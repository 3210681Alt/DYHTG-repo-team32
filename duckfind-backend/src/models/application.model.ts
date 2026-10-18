import { pgEnum, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./user.model.js";

// Where an application has got to. The user picks this from a dropdown.
export const APPLICATION_STATUSES = [
  "applied",
  "online_assessment",
  "interview",
  "assessment_centre",
  "offer",
  "rejected",
  "withdrawn",
] as const;

export const applicationStatus = pgEnum("application_status", APPLICATION_STATUSES);

// Jobs a user applied for, and where each application is up to.
// job_id is the job's MongoDB _id; title, company and link are copied in, because people keep
// tracking an application long after the listing has been taken down.
export const applications = pgTable(
  "applications",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id").notNull(),
    jobTitle: text("job_title").notNull(),
    companyName: text("company_name").notNull(),
    jobUrl: text("job_url").notNull(),
    status: applicationStatus("status").notNull().default("applied"),
    appliedAt: timestamp("applied_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.jobId] })],
);

export type Application = typeof applications.$inferSelect;
