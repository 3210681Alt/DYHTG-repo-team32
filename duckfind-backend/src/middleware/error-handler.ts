import type { ErrorRequestHandler, RequestHandler } from "express";
import { sendError } from "../lib/utils.js";

export const notFound: RequestHandler = (_req, res) => {
  sendError(res, 404, "Route not found");
};

// Safety net for anything a controller didn't handle itself; never exposes error details
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  // 4xx errors raised by Express itself, e.g. a malformed JSON body
  if (typeof err?.status === "number" && err.status >= 400 && err.status < 500) {
    const message =
      err.type === "entity.parse.failed" ? "Invalid JSON in request body" : "Bad request";
    return sendError(res, err.status, message);
  }

  console.error(err);
  sendError(res, 500, "Internal server error");
};
