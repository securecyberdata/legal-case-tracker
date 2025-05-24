import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  date,
  primaryKey,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Case statuses
export const CASE_STATUSES = [
  "Pending",
  "Active",
  "Scheduled",
  "Adjourned",
  "Closed",
  "Urgent",
] as const;

// Court types
export const COURT_TYPES = [
  "Supreme Court",
  "High Court",
  "District Court",
  "Civil Court",
  "Family Court",
  "Banking Court",
  "Other",
] as const;

// Cases table
export const cases = pgTable("cases", {
  id: serial("id").primaryKey(),
  applicationNumber: varchar("application_number", { length: 50 }),
  caseNumber: varchar("case_number", { length: 50 }).notNull(),
  firNumber: varchar("fir_number", { length: 50 }),
  plaintiffName: varchar("plaintiff_name", { length: 100 }),
  defendantName: varchar("defendant_name", { length: 100 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  courtName: varchar("court_name", { length: 100 }).notNull(),
  courtType: varchar("court_type", { length: 50 }).$type<typeof COURT_TYPES[number]>(),
  status: varchar("status", { length: 50 }).$type<typeof CASE_STATUSES[number]>().notNull().default("Pending"),
  filingDate: date("filing_date"),
  nextHearingDate: date("next_hearing_date"),
  clientId: integer("client_id"),
  documents: text("documents"),
  previousMessages: text("previous_messages"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  clientUuid: uuid("client_uuid").defaultRandom().notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  contactNumber: varchar("contact_number", { length: 20 }),
  email: varchar("email", { length: 100 }),
  address: text("address"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Hearings table
export const hearings = pgTable("hearings", {
  id: serial("id").primaryKey(),
  caseId: integer("case_id").references(() => cases.id, { onDelete: "cascade" }).notNull(),
  hearingDate: date("hearing_date").notNull(),
  time: varchar("time", { length: 10 }),
  notes: text("notes"),
  status: varchar("status", { length: 50 }).default("Scheduled"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table for tracking user actions
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // "case", "client", "hearing"
  entityId: integer("entity_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema for inserting a case
export const insertCaseSchema = createInsertSchema(cases)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true });

// Schema for inserting a client
export const insertClientSchema = createInsertSchema(clients)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true });

// Schema for inserting a hearing
export const insertHearingSchema = createInsertSchema(hearings)
  .omit({ id: true, createdAt: true, updatedAt: true, userId: true });

// Schema for inserting an activity
export const insertActivitySchema = createInsertSchema(activities)
  .omit({ id: true, createdAt: true, userId: true });

// Types for inserts
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertCase = z.infer<typeof insertCaseSchema>;
export type Case = typeof cases.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertHearing = z.infer<typeof insertHearingSchema>;
export type Hearing = typeof hearings.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;
