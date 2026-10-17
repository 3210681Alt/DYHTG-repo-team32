import { and, eq, getTableColumns, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { findSkill, SKILLS } from "../lib/skills.js";
import { sendError, uniqueViolationConstraint } from "../lib/utils.js";
import { users } from "../models/user.model.js";
import { emailSchema, passwordSchema } from "./auth.controller.js";

const { passwordHash: _passwordHash, ...publicUserColumns } = getTableColumns(users);

const currentPasswordSchema = z
  .string({ error: "Current password is required" })
  .min(1, "Current password is required")
  .max(128, "Current password is incorrect");

const updateEmailSchema = z.object(
  { email: emailSchema, currentPassword: currentPasswordSchema },
  { error: "Invalid request body" },
);

const updatePasswordSchema = z.object(
  {
    currentPassword: currentPasswordSchema,
    // Same rules as register, but a clearer message when the field is missing
    newPassword: z.string({ error: "New password is required" }).pipe(passwordSchema),
  },
  { error: "Invalid request body" },
);

// Email and password changes must be confirmed with the user's current password
async function isCurrentPassword(userId: string, password: string): Promise<boolean> {
  const [user] = await db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, userId));
  return user ? verifyPassword(password, user.passwordHash) : false;
}

const addSkillSchema = z.object(
  {
    skill: z.string({ error: "Skill is required" }).trim().min(1, "Skill is required"),
  },
  { error: "Invalid request body" },
);

export function getSkills(_req: Request, res: Response) {
  res.status(200).json({ status: 200, message: "Skills fetched", skills: SKILLS });
}

export async function addSkill(req: Request, res: Response) {
  const parsed = addSkillSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const skill = findSkill(parsed.data.skill);
  if (!skill) return sendError(res, 400, "Unknown skill");

  // Single statement, so two simultaneous adds can't store the skill twice
  const [updated] = await db
    .update(users)
    .set({ skills: sql`array_append(${users.skills}, ${skill})` })
    .where(and(eq(users.id, req.user.id), sql`not (${skill} = any(${users.skills}))`))
    .returning({ skills: users.skills });
  if (!updated) return sendError(res, 409, "Skill already added");

  res.status(200).json({ status: 200, message: "Skill added", skills: updated.skills });
}

export async function removeSkill(req: Request, res: Response) {
  const skill = findSkill(String(req.params.skill));
  if (!skill) return sendError(res, 400, "Unknown skill");

  const [updated] = await db
    .update(users)
    .set({ skills: sql`array_remove(${users.skills}, ${skill})` })
    .where(and(eq(users.id, req.user.id), sql`${skill} = any(${users.skills})`))
    .returning({ skills: users.skills });
  if (!updated) return sendError(res, 404, "Skill not found in your list");

  res.status(200).json({ status: 200, message: "Skill removed", skills: updated.skills });
}

export async function updateEmail(req: Request, res: Response) {
  const parsed = updateEmailSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  if (!(await isCurrentPassword(req.user.id, parsed.data.currentPassword))) {
    return sendError(res, 401, "Current password is incorrect");
  }

  let user;
  try {
    [user] = await db
      .update(users)
      .set({ email: parsed.data.email })
      .where(eq(users.id, req.user.id))
      .returning(publicUserColumns);
  } catch (err) {
    if (uniqueViolationConstraint(err) === "users_email_unique") {
      return sendError(res, 409, "Email is already registered");
    }
    throw err;
  }
  if (!user) return sendError(res, 401, "Unauthorized - User not found");

  res.status(200).json({ status: 200, message: "Email updated", user });
}

export async function updatePassword(req: Request, res: Response) {
  const parsed = updatePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!(await isCurrentPassword(req.user.id, currentPassword))) {
    return sendError(res, 401, "Current password is incorrect");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword) })
    .where(eq(users.id, req.user.id));

  res.status(200).json({ status: 200, message: "Password updated" });
}
