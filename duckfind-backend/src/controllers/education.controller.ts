import { and, eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { sendError } from "../lib/utils.js";
import { courseType, graduationStatus, userUniversities } from "../models/user.model.js";

const MAX_UNIVERSITIES = 10;

const universityFields = {
  university: z
    .string({ error: "University is required" })
    .trim()
    .min(1, "University is required")
    .max(200, "University must be at most 200 characters"),
  course: z
    .string({ error: "Course is required" })
    .trim()
    .min(1, "Course is required")
    .max(200, "Course must be at most 200 characters"),
  courseType: z.enum(courseType.enumValues, {
    error: `Course type must be one of: ${courseType.enumValues.join(", ")}`,
  }),
  status: z.enum(graduationStatus.enumValues, {
    error: `Status must be one of: ${graduationStatus.enumValues.join(", ")}`,
  }),
  // The actual graduation date, or the expected one (status says which)
  graduationDate: z.iso
    .date({ error: "Graduation date must be a date like 2027-06-30" })
    .nullable()
    .optional(),
};

const addUniversitySchema = z.object(universityFields, { error: "Invalid request body" });
const updateUniversitySchema = z
  .object(universityFields, { error: "Invalid request body" })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, "Nothing to update");

// Everything except user_id
const universityColumns = {
  id: userUniversities.id,
  university: userUniversities.university,
  course: userUniversities.course,
  courseType: userUniversities.courseType,
  status: userUniversities.status,
  graduationDate: userUniversities.graduationDate,
};

const firstIssue = (error: z.ZodError) => error.issues[0]?.message ?? "Invalid request body";

export async function listUniversities(req: Request, res: Response) {
  const universities = await db
    .select(universityColumns)
    .from(userUniversities)
    .where(eq(userUniversities.userId, req.user.id))
    .orderBy(sql`${userUniversities.graduationDate} desc nulls last`);

  res.status(200).json({ status: 200, message: "Universities fetched", universities });
}

export async function addUniversity(req: Request, res: Response) {
  const parsed = addUniversitySchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const [{ count } = { count: 0 }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(userUniversities)
    .where(eq(userUniversities.userId, req.user.id));
  if (count >= MAX_UNIVERSITIES) {
    return sendError(res, 400, `You can add up to ${MAX_UNIVERSITIES} universities`);
  }

  const [university] = await db
    .insert(userUniversities)
    .values({
      ...parsed.data,
      graduationDate: parsed.data.graduationDate ?? null,
      userId: req.user.id,
    })
    .returning(universityColumns);

  res.status(201).json({ status: 201, message: "University added", university });
}

export async function updateUniversity(req: Request, res: Response) {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return sendError(res, 404, "University not found");

  const parsed = updateUniversitySchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, firstIssue(parsed.error));

  const [university] = await db
    .update(userUniversities)
    .set(parsed.data)
    .where(and(eq(userUniversities.id, id.data), eq(userUniversities.userId, req.user.id)))
    .returning(universityColumns);
  if (!university) return sendError(res, 404, "University not found");

  res.status(200).json({ status: 200, message: "University updated", university });
}

export async function removeUniversity(req: Request, res: Response) {
  const id = z.uuid().safeParse(req.params.id);
  if (!id.success) return sendError(res, 404, "University not found");

  const [removed] = await db
    .delete(userUniversities)
    .where(and(eq(userUniversities.id, id.data), eq(userUniversities.userId, req.user.id)))
    .returning({ id: userUniversities.id });
  if (!removed) return sendError(res, 404, "University not found");

  res.status(200).json({ status: 200, message: "University removed" });
}
