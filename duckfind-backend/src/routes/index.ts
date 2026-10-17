import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { profileRouter } from "./profile.routes.js";
import { skillRouter } from "./skill.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/skills", skillRouter);
router.use("/profile", profileRouter);
