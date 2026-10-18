import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { isValidObjectId, type Types } from "mongoose";
import { z } from "zod";
import { db } from "../lib/db.js";
import { COMPANY_FIELDS, hiddenJobIds, withCompany } from "../lib/jobs.js";
import { levelsFromEducation, scoreJob, type MatchProfile } from "../lib/matching.js";
import { findSkill } from "../lib/skills.js";
import { sendError } from "../lib/utils.js";
import { CompanyModel } from "../models/company.model.js";
import { JobModel } from "../models/job.model.js";
import { userUniversities } from "../models/user.model.js";

export const SENIORITY_LEVELS = ["intern", "graduate", "junior", "mid", "senior", "lead"] as const;
export const WORKPLACE_TYPES = ["remote", "hybrid", "onsite"] as const;
// Query value -> how the route is written on the sponsor register
const SPONSOR_ROUTES = {
  "skilled-worker": "Skilled Worker",
  "global-business-mobility": "Global Business Mobility",
  "scale-up": "Scale-up",
} as const;
const SORTS = ["newest", "oldest", "title", "relevance"] as const;

const booleanFlag = (name: string) =>
  z.enum(["true", "false"], { error: `${name} must be true or false` }).optional();

const text = (name: string, max = 100) =>
  z
    .string({ error: `${name} must be text` })
    .trim()
    .min(1, `${name} can't be empty`)
    .max(max, `${name} must be at most ${max} characters`)
    .optional();

// "a,b,c" -> ["a", "b", "c"]
const list = (name: string) =>
  z
    .string({ error: `${name} must be a comma-separated list` })
    .transform((value) =>
      value
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    )
    .optional();

const enumList = <T extends readonly [string, ...string[]]>(name: string, values: T) =>
  list(name).pipe(
    z.array(z.enum(values, { error: `${name} must be one of: ${values.join(", ")}` })).optional(),
  );

const listJobsSchema = z.object({
  sponsors: booleanFlag("sponsors"),
  uk: booleanFlag("uk"),
  q: text("q"),
  keywords: text("keywords", 200),
  location: text("location"),
  company: list("company"),
  // One department, not a list: some department names contain commas
  department: text("department", 200),
  country: list("country"),
  workplace: enumList("workplace", WORKPLACE_TYPES),
  seniority: enumList("seniority", SENIORITY_LEVELS),
  route: z
    .enum(Object.keys(SPONSOR_ROUTES) as [keyof typeof SPONSOR_ROUTES], {
      error: `route must be one of: ${Object.keys(SPONSOR_ROUTES).join(", ")}`,
    })
    .optional(),
  postedWithin: z.coerce
    .number({ error: "postedWithin must be a number of days" })
    .int("postedWithin must be a whole number of days")
    .min(1, "postedWithin must be at least 1 day")
    .max(365, "postedWithin must be at most 365 days")
    .optional(),
  sort: z.enum(SORTS, { error: `sort must be one of: ${SORTS.join(", ")}` }).optional(),
  page: z.coerce
    .number({ error: "page must be a number" })
    .int("page must be a whole number")
    .min(1, "page must be 1 or more")
    .default(1),
  limit: z.coerce
    .number({ error: "limit must be a number" })
    .int("limit must be a whole number")
    .min(1, "limit must be 1 or more")
    .max(100, "limit must be at most 100")
    .default(20),
});

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
// Case-insensitive exact match, so "engineering" finds "Engineering"
const exactly = (value: string) => new RegExp(`^${escapeRegex(value)}$`, "i");

export async function listJobs(req: Request, res: Response) {
  const parsed = listJobsSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid query");
  }

  const query = parsed.data;
  const { page, limit } = query;
  const filter: Record<string, unknown> = {};

  if (query.sponsors) filter.sponsorsVisa = query.sponsors === "true";
  if (query.uk) filter.isUk = query.uk === "true";
  if (query.q) filter.title = { $regex: escapeRegex(query.q), $options: "i" };
  if (query.keywords) filter.$text = { $search: query.keywords };
  if (query.location) filter.location = { $regex: escapeRegex(query.location), $options: "i" };
  if (query.department) filter.departments = exactly(query.department);
  if (query.country?.length) filter.countries = { $in: query.country.map(exactly) };
  if (query.workplace?.length) filter.workplace = { $in: query.workplace };
  if (query.seniority?.length) filter.seniority = { $in: query.seniority };
  if (query.postedWithin) {
    filter.firstPublishedAt = { $gte: new Date(Date.now() - query.postedWithin * 86_400_000) };
  }

  // Logged-in users don't see jobs they marked "Not interested"
  if (req.user?.id) {
    const hiddenIds = await hiddenJobIds(req.user.id);
    if (hiddenIds.length) filter._id = { $nin: hiddenIds };
  }

  // Company and sponsor-route filters live on companies; both narrow the allowed companyIds
  if (query.company?.length || query.route) {
    const companyFilter: Record<string, unknown> = {};
    if (query.company?.length) companyFilter.boardToken = { $in: query.company };
    if (query.route) {
      companyFilter.sponsorRoutes = {
        $regex: `^${escapeRegex(SPONSOR_ROUTES[query.route])}`,
      };
    }
    const companies = await CompanyModel.find(companyFilter, { _id: 1 }).lean();
    if (query.company?.length && !companies.length && !query.route) {
      return sendError(res, 404, "Company not found");
    }
    filter.companyId = { $in: companies.map((company) => company._id as Types.ObjectId) };
  }

  // Relevance needs a keywords search to rank by
  const sortBy = query.sort ?? (query.keywords ? "relevance" : "newest");
  if (sortBy === "relevance" && !query.keywords) {
    return sendError(res, 400, "sort=relevance needs keywords");
  }
  const sort: Record<string, 1 | -1 | { $meta: "textScore" }> = {
    newest: { firstPublishedAt: -1 as const, _id: 1 as const },
    oldest: { firstPublishedAt: 1 as const, _id: 1 as const },
    title: { title: 1 as const, _id: 1 as const },
    relevance: { score: { $meta: "textScore" as const }, _id: 1 as const },
  }[sortBy];

  const projection: Record<string, unknown> = {
    descriptionHtml: 0,
    descriptionText: 0,
    lastSeenAt: 0,
    __v: 0,
    ...(sortBy === "relevance" && { score: { $meta: "textScore" } }),
  };

  const [jobs, total] = await Promise.all([
    JobModel.find(filter, projection)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("companyId", COMPANY_FIELDS)
      .lean(),
    JobModel.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 200,
    message: "Jobs fetched",
    jobs: jobs.map(withCompany),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

// How many jobs the text search hands over for scoring; matches are ranked within these
const MATCH_CANDIDATES = 300;

const listMatchesSchema = z.object({
  from: z.enum(["skills", "cv"], { error: "from must be skills or cv" }).default("skills"),
  sponsors: booleanFlag("sponsors"),
  uk: booleanFlag("uk"),
  seniority: enumList("seniority", SENIORITY_LEVELS),
  page: listJobsSchema.shape.page,
  limit: listJobsSchema.shape.limit,
});

// Jobs ranked by how well they fit the user's skills or CV and their education level (lib/matching.ts)
export async function listMatches(req: Request, res: Response) {
  const parsed = listMatchesSchema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid query");
  }
  const query = parsed.data;
  const { page, limit } = query;
  const user = req.user;

  // From the CV: its skills, plus the other words it uses a lot (used for job titles)
  const fromCv = query.from === "cv";
  const source = fromCv ? user.resumeKeywords : user.skills;
  if (!source.length) {
    return sendError(
      res,
      404,
      fromCv ? "You haven't uploaded a CV yet" : "Add some skills to your profile first",
    );
  }
  const skills = source.map(findSkill).filter((skill) => skill !== undefined);
  const words = fromCv ? source.filter((keyword) => !findSkill(keyword)) : [];

  const education = await db
    .select({ status: userUniversities.status, graduationDate: userUniversities.graduationDate })
    .from(userUniversities)
    .where(eq(userUniversities.userId, user.id));
  const profile: MatchProfile = { skills, words, levels: levelsFromEducation(education) };

  const filter: Record<string, unknown> = { $text: { $search: source.join(" ") } };
  if (query.sponsors) filter.sponsorsVisa = query.sponsors === "true";
  if (query.uk) filter.isUk = query.uk === "true";
  if (query.seniority?.length) filter.seniority = { $in: query.seniority };
  const hiddenIds = await hiddenJobIds(user.id);
  if (hiddenIds.length) filter._id = { $nin: hiddenIds };

  const candidates = await JobModel.find(filter, {
    descriptionHtml: 0,
    lastSeenAt: 0,
    __v: 0,
    score: { $meta: "textScore" },
  })
    .sort({ score: { $meta: "textScore" }, _id: 1 })
    .limit(MATCH_CANDIDATES)
    .lean<(Record<string, unknown> & { title: string; score?: number })[]>();

  const bestTextScore = candidates[0]?.score ?? 0;
  const ranked = candidates
    .map((job) => ({ job, match: scoreJob(job, profile, bestTextScore) }))
    .filter((entry) => entry.match !== null)
    .sort((a, b) => b.match!.score - a.match!.score);

  const pageOfJobs = ranked.slice((page - 1) * limit, page * limit).map(({ job, match }) => {
    // The description was only needed for scoring
    const { descriptionText: _text, score: _score, ...rest } = job;
    return { ...rest, match };
  });
  await JobModel.populate(pageOfJobs, { path: "companyId", select: COMPANY_FIELDS });

  res.status(200).json({
    status: 200,
    message: "Matches fetched",
    jobs: pageOfJobs.map(withCompany),
    page,
    limit,
    total: ranked.length,
    totalPages: Math.ceil(ranked.length / limit),
  });
}

// Values the frontend can offer in its filter dropdowns, with how many jobs each has
export async function getJobFilters(_req: Request, res: Response) {
  const count = (field: string, top?: number) => [
    { $unwind: `$${field}` },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 as const, _id: 1 as const } },
    ...(top ? [{ $limit: top }] : []),
    { $project: { _id: 0, value: "$_id", count: 1 } },
  ];

  const [facets] = await JobModel.aggregate([
    {
      $facet: {
        countries: count("countries"),
        departments: count("departments", 100),
        workplace: count("workplace"),
        seniority: count("seniority"),
        companies: [
          { $group: { _id: "$companyId", count: { $sum: 1 } } },
          { $lookup: { from: "companies", localField: "_id", foreignField: "_id", as: "c" } },
          { $unwind: "$c" },
          {
            $project: {
              _id: 0,
              value: "$c.boardToken",
              name: "$c.name",
              sponsorsVisa: "$c.sponsorsVisa",
              count: 1,
            },
          },
          { $sort: { name: 1 } },
        ],
      },
    },
  ]);

  res.status(200).json({
    status: 200,
    message: "Filters fetched",
    filters: {
      ...facets,
      routes: Object.entries(SPONSOR_ROUTES).map(([value, name]) => ({ value, name })),
      sorts: SORTS,
    },
  });
}

export async function getJob(req: Request, res: Response) {
  const id = String(req.params.id);
  if (!isValidObjectId(id)) return sendError(res, 400, "Invalid job id");

  const job = await JobModel.findById(id)
    .select("-lastSeenAt -__v")
    .populate("companyId", `${COMPANY_FIELDS} description sponsorRegisterName sponsorRoutes`)
    .lean();
  if (!job) return sendError(res, 404, "Job not found");

  res.status(200).json({ status: 200, message: "Job fetched", job: withCompany(job) });
}
