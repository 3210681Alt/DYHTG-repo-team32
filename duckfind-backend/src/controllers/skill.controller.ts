import { and, eq, sql } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { findSkill, SKILLS } from "../lib/skills.js";
import { sendError } from "../lib/utils.js";
import { users } from "../models/user.model.js";

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
