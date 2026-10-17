import { eq, getTableColumns, or } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { HttpError } from "../lib/http-error.js";
import { hashPassword, verifyDummyPassword, verifyPassword } from "../lib/password.js";
import { clearToken, generateToken } from "../lib/utils.js";
import { users } from "../models/user.model.js";

const { passwordHash: _passwordHash, ...publicUserColumns } = getTableColumns(users);

const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // No "@" allowed, so a login identifier can never match both a username and an email
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,30}$/, "Username must be 3-30 letters, numbers or underscores"),
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1).max(128),
});

// Drizzle wraps driver errors, so the Postgres error may be on `cause`
function uniqueViolationConstraint(err: unknown): string | undefined {
  for (const candidate of [err, (err as { cause?: unknown })?.cause]) {
    const pgError = candidate as { code?: unknown; constraint?: unknown } | undefined;
    if (pgError?.code === "23505" && typeof pgError.constraint === "string") {
      return pgError.constraint;
    }
  }
  return undefined;
}

export async function register(req: Request, res: Response) {
  const { name, username, email, password } = registerSchema.parse(req.body);
  const passwordHash = await hashPassword(password);

  let user;
  try {
    [user] = await db
      .insert(users)
      .values({ name, username, email, passwordHash })
      .returning(publicUserColumns);
  } catch (err) {
    const constraint = uniqueViolationConstraint(err);
    if (constraint === "users_email_unique")
      throw new HttpError(409, "Email is already registered");
    if (constraint === "users_username_unique")
      throw new HttpError(409, "Username is already taken");
    throw err;
  }
  if (!user) throw new Error("User insert returned no row");

  generateToken({ id: user.id }, res);
  res.status(201).json({ message: "Registration successful", user });
}

export async function login(req: Request, res: Response) {
  const { identifier, password } = loginSchema.parse(req.body);

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);

  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyDummyPassword(password);
  if (!user || !valid) throw new HttpError(401, "Invalid email/username or password");

  generateToken({ id: user.id }, res);
  const { passwordHash: _, ...publicUser } = user;
  res.json({ message: "Logged in successfully", user: publicUser });
}

export function logout(_req: Request, res: Response) {
  clearToken(res);
  res.json({ message: "Logged out successfully" });
}

export function checkAuth(req: Request, res: Response) {
  res.json(req.user);
}
