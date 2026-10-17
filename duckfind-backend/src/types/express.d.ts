import type { User } from "../models/user.model.js";

declare global {
  namespace Express {
    interface Request {
      // Set by the verifyToken middleware
      user?: Omit<User, "passwordHash">;
    }
  }
}
