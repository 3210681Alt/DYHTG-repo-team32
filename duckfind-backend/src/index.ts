import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./lib/env.js";
import { errorHandler, notFound } from "./middleware/error-handler.js";
import { router } from "./routes/index.js";

const app = express();

// credentials: true lets the browser send the auth cookies cross-origin from the frontend
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "DuckFind API" });
});

app.use("/api", router);

app.use(notFound);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Api listening on http://localhost:${env.PORT}`);
});
