import { Router } from "express";
import { getSkills } from "../controllers/profile.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";

export const skillRouter = Router();

skillRouter.get("/", verifyToken, getSkills);
