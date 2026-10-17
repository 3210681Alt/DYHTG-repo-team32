import { Router } from "express";
import { getJob, getJobFilters, listJobs } from "../controllers/jobListing.controller.js";

export const jobListingRouter = Router();

jobListingRouter.get("/", listJobs);
// Before /:id, so "filters" isn't treated as a job id
jobListingRouter.get("/filters", getJobFilters);
jobListingRouter.get("/:id", getJob);
