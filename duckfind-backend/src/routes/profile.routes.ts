import { Router } from "express";
import {
  addSkill,
  removeSkill,
  updateEmail,
  updatePassword,
} from "../controllers/profile.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";

export const profileRouter = Router();

profileRouter.post("/skills", verifyToken, addSkill);
profileRouter.delete("/skills/:skill", verifyToken, removeSkill);
profileRouter.patch("/email", verifyToken, updateEmail);
profileRouter.patch("/password", verifyToken, updatePassword);
