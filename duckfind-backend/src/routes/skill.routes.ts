import { Router } from "express";
import { getSkills } from "../controllers/skill.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";

export const skillRouter = Router();

skillRouter.get("/", verifyToken,getSkills);
