import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { db } from "../lib/db.js";
import { env } from "../lib/env.js";
import { sendError, TOKEN_COOKIE } from "../lib/utils.js";
import { users } from "../models/user.model.js";

const payloadSchema = z.object({ user: z.object({ id: z.uuid() }) });

// Returns the user id from the token, or null if it is missing, expired, or tampered with
function getUserId(token: unknown): string | null {
  if (typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
    const payload = payloadSchema.safeParse(decoded);
    return payload.success ? payload.data.user.id : null;
  } catch {
    return null;
  }
}

const verifyToken: RequestHandler = async (req, res, next) => {
  const userId = getUserId(req.cookies?.[TOKEN_COOKIE]);
  if (!userId) {
    return sendError(res, 401, "Unauthorized - Invalid or missing token");
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { passwordHash: false },
  });
  if (!user) {
    return sendError(res, 401, "Unauthorized - User not found");
  }

  req.user = user;
  next();
};

// For public routes that show more to logged-in users (e.g. hiding their "Not interested" jobs):
// sets req.user when the login cookie is valid, otherwise just carries on without a user
export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const userId = getUserId(req.cookies?.[TOKEN_COOKIE]);
  if (userId) {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { passwordHash: false },
    });
    if (user) req.user = user;
  }
  next();
};

export default verifyToken;
