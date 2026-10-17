import type { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "./env.js";

export interface TokenPayload {
  id: string;
}

export const TOKEN_COOKIE = "token";

// Frontend and backend are deployed on different sites, so the cookie must be cross-site
const tokenCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "none",
  secure: true,
  partitioned: true,
};

export const generateToken = (user: TokenPayload, res: Response) => {
  const token = jwt.sign({ user }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });

  res.cookie(TOKEN_COOKIE, token, { ...tokenCookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });

  return token;
};

export const clearToken = (res: Response) => {
  res.clearCookie(TOKEN_COOKIE, tokenCookieOptions);
};
