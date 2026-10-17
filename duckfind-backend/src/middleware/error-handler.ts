import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/http-error.js";

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err) });
    return;
  }

  // Also covers 4xx errors raised by Express itself, e.g. malformed JSON bodies
  if (err instanceof HttpError || (typeof err?.status === "number" && err.status < 500)) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: "Internal server error",
    ...(env.NODE_ENV !== "production" && err instanceof Error && { message: err.message }),
  });
};
