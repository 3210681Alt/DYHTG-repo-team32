import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { jobRouter } from "./job.routes.js";
import { jobListingRouter } from "./jobListing.routes.js";
import { profileRouter } from "./profile.routes.js";
import { skillRouter } from "./skill.routes.js";

export const router = Router();

// Jobs from the scraped MongoDB dataset
router.use("/jobs", jobListingRouter);
// Live Greenhouse fetch for one board (GREENHOUSE_BOARD_TOKEN)
router.use("/greenhouse/jobs", jobRouter);
router.use("/auth", authRouter);
router.use("/skills", skillRouter);
router.use("/profile", profileRouter);
