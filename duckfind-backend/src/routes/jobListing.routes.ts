import { Router } from "express";
import { getJob, getJobFilters, listJobs } from "../controllers/jobListing.controller.js";
import { optionalAuth } from "../middleware/verifyToken.middleware.js";

export const jobListingRouter = Router();

// Public, but a logged-in user's "Not interested" jobs are left out
jobListingRouter.get("/", optionalAuth, listJobs);
// Before /:id, so "filters" isn't treated as a job id
jobListingRouter.get("/filters", getJobFilters);
jobListingRouter.get("/:id", getJob);
