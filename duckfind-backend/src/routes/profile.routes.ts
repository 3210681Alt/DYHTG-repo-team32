import { Router } from "express";
import {
  addSkill,
  removeSkill,
  updateEmail,
  updatePassword,
} from "../controllers/profile.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";
import { credentialsLimiter } from "./auth.routes.js";

export const profileRouter = Router();

profileRouter.post("/skills", verifyToken, addSkill);
profileRouter.delete("/skills/:skill", verifyToken, removeSkill);
profileRouter.patch("/email", verifyToken, credentialsLimiter, updateEmail);
profileRouter.patch("/password", verifyToken, credentialsLimiter, updatePassword);
