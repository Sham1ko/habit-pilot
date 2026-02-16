import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────

export const shareLinkKindEnum = pgEnum("ShareLinkKind", ["public", "ics"]);

export const habitEntryStatusEnum = pgEnum("HabitEntryStatus", [
  "done",
  "skipped",
  "micro_done",
  "recovered",
]);

// ── Tables ─────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  tz: text("tz"),
  weekly_capacity_cu_default: numeric("weekly_capacity_cu_default"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  weight_cu: numeric("weight_cu").notNull(),
  freq_type: text("freq_type").notNull(),
  freq_per_week: numeric("freq_per_week").notNull(),
  has_micro: boolean("has_micro").notNull().default(false),
  micro_title: text("micro_title"),
  micro_weight_cu: numeric("micro_weight_cu").notNull(),
  context_tags: text("context_tags").array().notNull().default([]),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const habitEntries = pgTable("habit_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  habit_id: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: date("date", { mode: "date" }).notNull(),
  actual_weight_cu: numeric("actual_weight_cu").notNull(),
  status: habitEntryStatusEnum("status").notNull(),
  proof_url: text("proof_url"),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

export const plannedOccurrences = pgTable("planned_occurrences", {
  id: uuid("id").primaryKey().defaultRandom(),
  habit_id: integer("habit_id")
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: date("date", { mode: "date" }).notNull(),
  planned_weight_cu: numeric("planned_weight_cu").notNull(),
  context_tag: text("context_tag"),
});

export const capacityPlans = pgTable("capacity_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  week_start_date: date("week_start_date", { mode: "date" }).notNull(),
  capacity_cu: numeric("capacity_cu").notNull(),
});

export const shareLinks = pgTable("share_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  kind: shareLinkKindEnum("kind").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  expires_at: timestamp("expires_at", { withTimezone: true, mode: "date" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "date" })
    .notNull()
    .defaultNow(),
});

// ── Relations ──────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  habits: many(habits),
  capacityPlans: many(capacityPlans),
  shareLinks: many(shareLinks),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, { fields: [habits.user_id], references: [users.id] }),
  entries: many(habitEntries),
  plannedOccurrences: many(plannedOccurrences),
}));

export const habitEntriesRelations = relations(habitEntries, ({ one }) => ({
  habit: one(habits, {
    fields: [habitEntries.habit_id],
    references: [habits.id],
  }),
}));

export const plannedOccurrencesRelations = relations(
  plannedOccurrences,
  ({ one }) => ({
    habit: one(habits, {
      fields: [plannedOccurrences.habit_id],
      references: [habits.id],
    }),
  }),
);

export const capacityPlansRelations = relations(capacityPlans, ({ one }) => ({
  user: one(users, {
    fields: [capacityPlans.user_id],
    references: [users.id],
  }),
}));

export const shareLinksRelations = relations(shareLinks, ({ one }) => ({
  user: one(users, {
    fields: [shareLinks.user_id],
    references: [users.id],
  }),
}));

// ── Type helpers ───────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Habit = typeof habits.$inferSelect;
export type NewHabit = typeof habits.$inferInsert;

export type HabitEntry = typeof habitEntries.$inferSelect;
export type NewHabitEntry = typeof habitEntries.$inferInsert;

export type PlannedOccurrence = typeof plannedOccurrences.$inferSelect;
export type NewPlannedOccurrence = typeof plannedOccurrences.$inferInsert;

export type CapacityPlan = typeof capacityPlans.$inferSelect;
export type NewCapacityPlan = typeof capacityPlans.$inferInsert;

export type ShareLink = typeof shareLinks.$inferSelect;
export type NewShareLink = typeof shareLinks.$inferInsert;
