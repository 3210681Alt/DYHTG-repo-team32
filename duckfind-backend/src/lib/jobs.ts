import { eq } from "drizzle-orm";
import { isValidObjectId } from "mongoose";
import { hiddenJobs } from "../models/hiddenJob.model.js";
import { JobModel } from "../models/job.model.js";
import { db } from "./db.js";

// Company fields included with every job in a list
export const COMPANY_FIELDS = "name boardToken boardUrl sponsorsVisa";

// Big or internal fields left out of job lists
export const LIST_EXCLUDED_FIELDS = "-descriptionHtml -descriptionText -lastSeenAt -__v";

// populate() puts the company document in companyId; expose it as `company` instead
export function withCompany(job: object) {
  const { companyId: company, ...rest } = job as { companyId?: unknown };
  return { ...rest, company };
}

// Current details for jobs by their MongoDB ids, e.g. for a user's saved jobs.
// Jobs that have been taken down are simply missing from the map.
export async function findJobsByIds(ids: string[]) {
  const validIds = ids.filter((id) => isValidObjectId(id));
  const found = new Map<string, ReturnType<typeof withCompany>>();
  if (!validIds.length) return found;

  const jobs = await JobModel.find({ _id: { $in: validIds } })
    .select(LIST_EXCLUDED_FIELDS)
    .populate("companyId", COMPANY_FIELDS)
    .lean();
  for (const job of jobs) found.set(String(job._id), withCompany(job));
  return found;
}

// A job's title, company and link, copied into saved jobs and applications.
// Null when there is no such job.
export async function findJobSummary(jobId: string) {
  if (!isValidObjectId(jobId)) return null;

  const job = await JobModel.findById(jobId)
    .select("title url companyId")
    .populate<{ companyId: { name: string } | null }>("companyId", "name")
    .lean();
  if (!job) return null;

  return { jobTitle: job.title, companyName: job.companyId?.name ?? "", jobUrl: job.url ?? "" };
}

// Ids of the jobs a user marked "Not interested", to leave out of their lists
export async function hiddenJobIds(userId: string) {
  const hidden = await db
    .select({ jobId: hiddenJobs.jobId })
    .from(hiddenJobs)
    .where(eq(hiddenJobs.userId, userId));
  return hidden.map((row) => row.jobId).filter((id) => isValidObjectId(id));
}
