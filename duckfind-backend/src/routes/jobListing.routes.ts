import { Router } from "express";
import {
  getJob,
  getJobFilters,
  listJobs,
  listMatches,
} from "../controllers/jobListing.controller.js";
import verifyToken, { optionalAuth } from "../middleware/verifyToken.middleware.js";

export const jobListingRouter = Router();

// Public, but a logged-in user's "Not interested" jobs are left out
jobListingRouter.get("/", optionalAuth, listJobs);
// Before /:id, so "filters" and "matches" aren't treated as job ids
jobListingRouter.get("/filters", getJobFilters);
jobListingRouter.get("/matches", verifyToken, listMatches);
jobListingRouter.get("/:id", getJob);
