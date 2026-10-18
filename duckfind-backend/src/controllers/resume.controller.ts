import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import {
  cloudinaryReady,
  deleteResume as deleteResumeFile,
  resumeDownloadLink,
  uploadResume as uploadResumeFile,
} from "../lib/cloudinary.js";
import { db } from "../lib/db.js";
import { keywordsFromText, pdfToText } from "../lib/resumeKeywords.js";
import { sendError } from "../lib/utils.js";
import { users } from "../models/user.model.js";

const NOT_SET_UP = "CV uploads aren't set up on this server yet";

// Every PDF starts with "%PDF-", whatever the browser says its type is
const isPdf = (file: Buffer) => file.subarray(0, 5).toString("latin1") === "%PDF-";

export async function getResume(req: Request, res: Response) {
  const user = req.user!;
  if (!user.resumeUploadedAt) return sendError(res, 404, "You haven't uploaded a CV yet");

  res.status(200).json({
    status: 200,
    message: "CV fetched",
    resume: {
      name: user.resumeName,
      uploadedAt: user.resumeUploadedAt,
      keywords: user.resumeKeywords,
      // Works for 10 minutes; the file itself is private
      downloadUrl: cloudinaryReady ? resumeDownloadLink(user.id) : null,
    },
  });
}

export async function uploadResume(req: Request, res: Response) {
  if (!cloudinaryReady) return sendError(res, 503, NOT_SET_UP);
  const file = req.file;
  if (!file) return sendError(res, 400, 'Send your CV as a PDF in a form field called "resume"');
  if (!isPdf(file.buffer)) return sendError(res, 400, "Your CV must be a PDF");

  let text: string;
  try {
    text = await pdfToText(file.buffer);
  } catch {
    return sendError(res, 400, "We couldn't open this PDF. Try saving it again and uploading that");
  }
  const keywords = keywordsFromText(text);
  if (!keywords.length) {
    return sendError(
      res,
      400,
      "We couldn't find any text in this PDF. If it's a scan, upload one made from a document instead",
    );
  }

  const userId = req.user!.id;
  let resumeUrl: string;
  try {
    resumeUrl = await uploadResumeFile(userId, file.buffer);
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    return sendError(res, 502, "We couldn't store your CV right now. Try again in a minute");
  }
  const [updated] = await db
    .update(users)
    .set({
      resumeUrl,
      resumeName: file.originalname.slice(0, 200),
      resumeKeywords: keywords,
      resumeUploadedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      name: users.resumeName,
      uploadedAt: users.resumeUploadedAt,
      keywords: users.resumeKeywords,
    });

  res.status(200).json({
    status: 200,
    message: "CV uploaded",
    resume: { ...updated, downloadUrl: resumeDownloadLink(userId) },
  });
}

export async function removeResume(req: Request, res: Response) {
  const user = req.user!;
  if (!user.resumeUploadedAt) return sendError(res, 404, "You haven't uploaded a CV yet");
  if (!cloudinaryReady) return sendError(res, 503, NOT_SET_UP);

  await deleteResumeFile(user.id);
  await db
    .update(users)
    .set({ resumeUrl: null, resumeName: null, resumeKeywords: [], resumeUploadedAt: null })
    .where(eq(users.id, user.id));

  res.status(200).json({ status: 200, message: "CV removed" });
}
