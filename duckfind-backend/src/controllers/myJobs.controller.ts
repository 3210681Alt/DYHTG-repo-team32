import { and, desc, eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { findJobsByIds, findJobSummary } from "../lib/jobs.js";
import { sendError } from "../lib/utils.js";
import { APPLICATION_STATUSES, applications } from "../models/application.model.js";
import { hiddenJobs } from "../models/hiddenJob.model.js";
import { savedJobs } from "../models/savedJob.model.js";

// A user's own lists of jobs: saved, "Not interested" (hidden) and applied for.
// Jobs live in MongoDB; these lists live in Postgres next to the user, linked by the job's id.

const jobIdSchema = z.object(
  { jobId: z.string({ error: "Job is required" }).trim().min(1, "Job is required") },
  { error: "Invalid request body" },
);

const statusSchema = z.enum(APPLICATION_STATUSES, {
  error: `Status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
});

const addApplicationSchema = z.object(
  { jobId: jobIdSchema.shape.jobId, status: statusSchema.optional() },
  { error: "Invalid request body" },
);
const updateApplicationSchema = z.object(
  { status: statusSchema },
  { error: "Invalid request body" },
);

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Invalid request body";

// Adds the job's current details (or null if it's been taken down) to each row
async function withLiveJobs<T extends { jobId: string }>(rows: T[]) {
  const jobs = await findJobsByIds(rows.map((row) => row.jobId));
  return rows.map((row) => ({ ...row, job: jobs.get(row.jobId) ?? null }));
}

// ---------- Saved jobs ----------

export async function listSavedJobs(req: Request, res: Response) {
  const rows = await db
    .select({
      jobId: savedJobs.jobId,
      jobTitle: savedJobs.jobTitle,
      companyName: savedJobs.companyName,
      jobUrl: savedJobs.jobUrl,
      savedAt: savedJobs.createdAt,
    })
    .from(savedJobs)
    .where(eq(savedJobs.userId, req.user.id))
    .orderBy(desc(savedJobs.createdAt));

  res
    .status(200)
    .json({ status: 200, message: "Saved jobs fetched", savedJobs: await withLiveJobs(rows) });
}

export async function saveJob(req: Request, res: Response) {
  const parsed = jobIdSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const summary = await findJobSummary(parsed.data.jobId);
  if (!summary) return sendError(res, 404, "Job not found");

  const [saved] = await db
    .insert(savedJobs)
    .values({ userId: req.user.id, jobId: parsed.data.jobId, ...summary })
    .onConflictDoNothing()
    .returning({ jobId: savedJobs.jobId, savedAt: savedJobs.createdAt });
  if (!saved) return sendError(res, 409, "Job already saved");

  res.status(201).json({ status: 201, message: "Job saved", savedJob: { ...saved, ...summary } });
}

export async function unsaveJob(req: Request, res: Response) {
  const [removed] = await db
    .delete(savedJobs)
    .where(and(eq(savedJobs.userId, req.user.id), eq(savedJobs.jobId, String(req.params.jobId))))
    .returning({ jobId: savedJobs.jobId });
  if (!removed) return sendError(res, 404, "Job isn't in your saved jobs");

  res.status(200).json({ status: 200, message: "Job removed from saved" });
}

// ---------- Not interested ----------

export async function listHiddenJobs(req: Request, res: Response) {
  const hidden = await db
    .select({
      jobId: hiddenJobs.jobId,
      jobTitle: hiddenJobs.jobTitle,
      companyName: hiddenJobs.companyName,
      hiddenAt: hiddenJobs.createdAt,
    })
    .from(hiddenJobs)
    .where(eq(hiddenJobs.userId, req.user.id))
    .orderBy(desc(hiddenJobs.createdAt));

  res.status(200).json({ status: 200, message: "Hidden jobs fetched", hiddenJobs: hidden });
}

export async function hideJob(req: Request, res: Response) {
  const parsed = jobIdSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const summary = await findJobSummary(parsed.data.jobId);
  if (!summary) return sendError(res, 404, "Job not found");

  const [hidden] = await db
    .insert(hiddenJobs)
    .values({
      userId: req.user.id,
      jobId: parsed.data.jobId,
      jobTitle: summary.jobTitle,
      companyName: summary.companyName,
    })
    .onConflictDoNothing()
    .returning({ jobId: hiddenJobs.jobId, hiddenAt: hiddenJobs.createdAt });
  if (!hidden) return sendError(res, 409, "Job already hidden");

  res.status(201).json({
    status: 201,
    message: "Job hidden",
    hiddenJob: { ...hidden, jobTitle: summary.jobTitle, companyName: summary.companyName },
  });
}

export async function unhideJob(req: Request, res: Response) {
  const [removed] = await db
    .delete(hiddenJobs)
    .where(and(eq(hiddenJobs.userId, req.user.id), eq(hiddenJobs.jobId, String(req.params.jobId))))
    .returning({ jobId: hiddenJobs.jobId });
  if (!removed) return sendError(res, 404, "Job isn't hidden");

  res.status(200).json({ status: 200, message: "Job shown again" });
}

// ---------- Applications ----------

const applicationColumns = {
  jobId: applications.jobId,
  jobTitle: applications.jobTitle,
  companyName: applications.companyName,
  jobUrl: applications.jobUrl,
  status: applications.status,
  appliedAt: applications.appliedAt,
  updatedAt: applications.updatedAt,
};

export async function listApplications(req: Request, res: Response) {
  const rows = await db
    .select(applicationColumns)
    .from(applications)
    .where(eq(applications.userId, req.user.id))
    .orderBy(desc(applications.updatedAt));

  res.status(200).json({
    status: 200,
    message: "Applications fetched",
    applications: await withLiveJobs(rows),
  });
}

export async function addApplication(req: Request, res: Response) {
  const parsed = addApplicationSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const summary = await findJobSummary(parsed.data.jobId);
  if (!summary) return sendError(res, 404, "Job not found");

  const [application] = await db
    .insert(applications)
    .values({
      userId: req.user.id,
      jobId: parsed.data.jobId,
      status: parsed.data.status ?? "applied",
      ...summary,
    })
    .onConflictDoNothing()
    .returning(applicationColumns);
  if (!application) return sendError(res, 409, "You've already added this application");

  res.status(201).json({ status: 201, message: "Application added", application });
}

export async function updateApplication(req: Request, res: Response) {
  const parsed = updateApplicationSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const [application] = await db
    .update(applications)
    .set({ status: parsed.data.status })
    .where(
      and(eq(applications.userId, req.user.id), eq(applications.jobId, String(req.params.jobId))),
    )
    .returning(applicationColumns);
  if (!application) return sendError(res, 404, "Application not found");

  res.status(200).json({ status: 200, message: "Status updated", application });
}

export async function removeApplication(req: Request, res: Response) {
  const [removed] = await db
    .delete(applications)
    .where(
      and(eq(applications.userId, req.user.id), eq(applications.jobId, String(req.params.jobId))),
    )
    .returning({ jobId: applications.jobId });
  if (!removed) return sendError(res, 404, "Application not found");

  res.status(200).json({ status: 200, message: "Application removed" });
}
