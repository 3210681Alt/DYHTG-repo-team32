import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:5173")
    .transform((value) => value.split(",").map((origin) => origin.trim())),

  GREENHOUSE_BOARD_TOKEN: z.string().min(1),
  GREENHOUSE_API_BASE_URL: z.url().default("https://boards-api.greenhouse.io/v1"),

  // Scraped companies and jobs (written by scraper/)
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017"),
  MONGODB_DB: z.string().min(1).default("duckfind"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
