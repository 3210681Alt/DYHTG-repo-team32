import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.model.js";

// Jobs a user saved for later.
// job_id is the job's MongoDB _id (the jobs collection the scraper fills). The title, company and
// link are copied in, so the list still makes sense after the company takes the listing down.
export const savedJobs = pgTable(
  "saved_jobs",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    jobTitle: text("job_title").notNull(),
    companyName: text("company_name").notNull(),
    jobUrl: text("job_url").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  // A job can only be saved once per user
  (table) => [primaryKey({ columns: [table.userId, table.jobId] })],
);

export type SavedJob = typeof savedJobs.$inferSelect;
