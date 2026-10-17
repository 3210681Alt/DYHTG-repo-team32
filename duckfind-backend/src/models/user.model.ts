import { relations } from "drizzle-orm";
import { date, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const graduationStatus = pgEnum("graduation_status", [
  "graduated",
  "not_graduated",
  "expected",
]);

export const courseType = pgEnum("course_type", ["undergraduate", "postgraduate", "phd", "other"]);

// The user table for the user details
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  skills: text("skills").array().notNull().default([]),
  resumeUrl: text("resume_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// A user can have several universities, each with its own course and status
export const userUniversities = pgTable("user_universities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  university: text("university").notNull(),
  course: text("course").notNull(),
  courseType: courseType("course_type").notNull(),
  status: graduationStatus("status").notNull(),
  graduationDate: date("graduation_date"),
});

// One to many since a user can have multiple universities
export const usersRelations = relations(users, ({ many }) => ({
  universities: many(userUniversities),
}));

// user and university relations
export const userUniversitiesRelations = relations(userUniversities, ({ one }) => ({
  user: one(users, { fields: [userUniversities.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserUniversity = typeof userUniversities.$inferSelect;
export type NewUserUniversity = typeof userUniversities.$inferInsert;
