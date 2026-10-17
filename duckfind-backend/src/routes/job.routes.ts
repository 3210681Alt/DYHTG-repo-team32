import { Router } from "express";
import { getGreenhouseJobs } from "../controllers/job.controller.js";

export const jobRouter = Router();

jobRouter.get("/", getGreenhouseJobs);
