import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { skillRouter } from "./skill.routes.js";
import { userRouter } from "./user.routes.js";
import { jobRouter } from "./job.routes.js";

export const router = Router();

router.use("/jobs", jobRouter);
router.use("/auth", authRouter);
router.use("/skills", skillRouter);
router.use("/users", userRouter);
