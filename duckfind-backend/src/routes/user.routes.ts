import { Router } from "express";
import { addSkill, removeSkill } from "../controllers/skill.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";

export const userRouter = Router();

userRouter.post("/me/skills", verifyToken, addSkill);
userRouter.delete("/me/skills/:skill", verifyToken, removeSkill);
