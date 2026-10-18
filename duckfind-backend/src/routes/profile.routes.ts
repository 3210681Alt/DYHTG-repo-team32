import { Router } from "express";
import {
  addUniversity,
  listUniversities,
  removeUniversity,
  updateUniversity,
} from "../controllers/education.controller.js";
import {
  addApplication,
  hideJob,
  listApplications,
  listHiddenJobs,
  listSavedJobs,
  removeApplication,
  saveJob,
  unhideJob,
  unsaveJob,
  updateApplication,
} from "../controllers/myJobs.controller.js";
import {
  addSkill,
  removeSkill,
  updateEmail,
  updatePassword,
} from "../controllers/profile.controller.js";
import { getResume, removeResume, uploadResume } from "../controllers/resume.controller.js";
import { uploadResumeFile } from "../middleware/upload.middleware.js";
import verifyToken from "../middleware/verifyToken.middleware.js";
import { credentialsLimiter } from "./auth.routes.js";

export const profileRouter = Router();

profileRouter.post("/skills", verifyToken, addSkill);
profileRouter.delete("/skills/:skill", verifyToken, removeSkill);
profileRouter.patch("/email", verifyToken, credentialsLimiter, updateEmail);
profileRouter.patch("/password", verifyToken, credentialsLimiter, updatePassword);

// Education (the user_universities table)
profileRouter.get("/universities", verifyToken, listUniversities);
profileRouter.post("/universities", verifyToken, addUniversity);
profileRouter.patch("/universities/:id", verifyToken, updateUniversity);
profileRouter.delete("/universities/:id", verifyToken, removeUniversity);

// Saved jobs
profileRouter.get("/saved-jobs", verifyToken, listSavedJobs);
profileRouter.post("/saved-jobs", verifyToken, saveJob);
profileRouter.delete("/saved-jobs/:jobId", verifyToken, unsaveJob);

// "Not interested" jobs, left out of the user's job lists
profileRouter.get("/hidden-jobs", verifyToken, listHiddenJobs);
profileRouter.post("/hidden-jobs", verifyToken, hideJob);
profileRouter.delete("/hidden-jobs/:jobId", verifyToken, unhideJob);

// Applications and their status
profileRouter.get("/applications", verifyToken, listApplications);
profileRouter.post("/applications", verifyToken, addApplication);
profileRouter.patch("/applications/:jobId", verifyToken, updateApplication);
profileRouter.delete("/applications/:jobId", verifyToken, removeApplication);

// CV (a PDF stored on Cloudinary); its keywords power the "From your CV" matches
profileRouter.get("/resume", verifyToken, getResume);
profileRouter.put("/resume", verifyToken, uploadResumeFile, uploadResume);
profileRouter.delete("/resume", verifyToken, removeResume);
