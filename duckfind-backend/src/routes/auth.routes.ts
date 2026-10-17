import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { checkAuth, login, logout, register } from "../controllers/auth.controller.js";
import verifyToken from "../middleware/verifyToken.middleware.js";

// security against password guessing
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { status: 429, message: "Too many attempts, please try again later" },
});

export const authRouter = Router();

authRouter.post("/register", credentialsLimiter, register);
authRouter.post("/login", credentialsLimiter, login);
authRouter.post("/logout", logout);
authRouter.get("/checkAuth", verifyToken, checkAuth);
