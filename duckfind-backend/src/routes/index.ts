import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { skillRouter } from "./skill.routes.js";
import { userRouter } from "./user.routes.js";

export const router = Router();

router.use("/auth", authRouter);
router.use("/skills", skillRouter);
router.use("/users", userRouter);
