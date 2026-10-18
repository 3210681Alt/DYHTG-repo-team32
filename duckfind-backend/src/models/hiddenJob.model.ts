import { pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.model.js";

// Jobs a user marked "Not interested". They're left out of that user's job lists (GET /api/jobs).
// job_id is the job's MongoDB _id; title and company are kept so the user can find it to undo.
export const hiddenJobs = pgTable(
  "hidden_jobs",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    jobTitle: text("job_title").notNull(),
    companyName: text("company_name").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.jobId] })],
);

export type HiddenJob = typeof hiddenJobs.$inferSelect;
