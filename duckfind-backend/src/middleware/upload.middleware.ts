import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { sendError } from "../lib/utils.js";

const MAX_RESUME_MB = 5;

// The CV is kept in memory (not written to disk): it's read for keywords, then sent to Cloudinary
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_RESUME_MB * 1024 * 1024, files: 1 },
}).single("resume");

// Turns multer's errors into the usual { status, message } responses
export function uploadResumeFile(req: Request, res: Response, next: NextFunction) {
  resumeUpload(req, res, (error: unknown) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return sendError(res, 413, `Your CV must be ${MAX_RESUME_MB} MB or smaller`);
    }
    if (error instanceof multer.MulterError) {
      return sendError(res, 400, 'Send one PDF in a form field called "resume"');
    }
    next(error);
  });
}
