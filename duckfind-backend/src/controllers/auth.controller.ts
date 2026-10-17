import { eq, getTableColumns, or } from "drizzle-orm";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "../lib/db.js";
import { hashPassword, verifyDummyPassword, verifyPassword } from "../lib/password.js";
import { clearToken, generateToken, sendError } from "../lib/utils.js";
import { users } from "../models/user.model.js";

const { passwordHash: _passwordHash, ...publicUserColumns } = getTableColumns(users);

const registerSchema = z.object(
  {
    name: z
      .string({ error: "Name is required" })
      .trim()
      .min(1, "Name is required")
      .max(100, "Name must be at most 100 characters"),
    // No "@" allowed, so a login identifier can never match both a username and an email
    username: z
      .string({ error: "Username is required" })
      .trim()
      .toLowerCase()
      .min(1, "Username is required")
      .regex(/^[a-z0-9_]{3,30}$/, "Username must be 3-30 letters, numbers or underscores"),
    email: z
      .string({ error: "Email is required" })
      .trim()
      .toLowerCase()
      .min(1, "Email is required")
      .pipe(z.email("Please enter a valid email")),
    password: z
      .string({ error: "Password is required" })
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password must be at most 128 characters"),
  },
  { error: "Invalid request body" },
);

const loginSchema = z.object(
  {
    identifier: z
      .string({ error: "Email or username is required" })
      .trim()
      .toLowerCase()
      .min(1, "Email or username is required"),
    password: z
      .string({ error: "Password is required" })
      .min(1, "Password is required")
      .max(128, "Password must be at most 128 characters"),
  },
  { error: "Invalid request body" },
);

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
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const { name, username, email, password } = parsed.data;
  const passwordHash = await hashPassword(password);

  let user;
  try {
    [user] = await db
      .insert(users)
      .values({ name, username, email, passwordHash })
      .returning(publicUserColumns);
  } catch (err) {
    const constraint = uniqueViolationConstraint(err);
    if (constraint === "users_email_unique") {
      return sendError(res, 409, "Email is already registered");
    }
    if (constraint === "users_username_unique") {
      return sendError(res, 409, "Username is already taken");
    }
    throw err;
  }
  if (!user) throw new Error("User insert returned no row");

  generateToken({ id: user.id }, res);
  res.status(201).json({ status: 201, message: "Registration successful", user });
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, parsed.error.issues[0]?.message ?? "Invalid request body");
  }

  const { identifier, password } = parsed.data;

  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);

  const valid = user
    ? await verifyPassword(password, user.passwordHash)
    : await verifyDummyPassword(password);
  if (!user || !valid) {
    return sendError(res, 401, "Invalid email/username or password");
  }

  generateToken({ id: user.id }, res);
  const { passwordHash: _, ...publicUser } = user;
  res.status(200).json({ status: 200, message: "Logged in successfully", user: publicUser });
}

export function logout(_req: Request, res: Response) {
  clearToken(res);
  res.status(200).json({ status: 200, message: "Logged out successfully" });
}

export function checkAuth(req: Request, res: Response) {
  res.status(200).json({ status: 200, message: "Authenticated", user: req.user });
}
