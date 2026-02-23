import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ── Tables ─────────────────────────────────────────────────────────────

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  password_hash: text("password_hash").notNull(),
  name: text("name"),
  tz: text("tz"),
  weekly_capacity_cu_default: text("weekly_capacity_cu_default"),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const habits = sqliteTable("habits", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  user_id: integer("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  emoji: text("emoji"),
  title: text("title").notNull(),
  description: text("description"),
  weight_cu: text("weight_cu").notNull(),
  freq_type: text("freq_type").notNull(),
  freq_per_week: text("freq_per_week").notNull(),
  has_micro: integer("has_micro", { mode: "boolean" }).notNull().default(false),
  micro_title: text("micro_title"),
  micro_weight_cu: text("micro_weight_cu").notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const habitEntries = sqliteTable("habit_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  habit_id: integer("habit_id", { mode: "number" })
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  actual_weight_cu: text("actual_weight_cu").notNull(),
  status: text("status", {
    enum: ["done", "skipped", "micro_done", "recovered"],
  }).notNull(),
  proof_url: text("proof_url"),
  note: text("note"),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const plannedOccurrences = sqliteTable("planned_occurrences", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  habit_id: integer("habit_id", { mode: "number" })
    .notNull()
    .references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  planned_weight_cu: text("planned_weight_cu").notNull(),
});

export const capacityPlans = sqliteTable("capacity_plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: integer("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  week_start_date: text("week_start_date").notNull(),
  capacity_cu: text("capacity_cu").notNull(),
});

export const shareLinks = sqliteTable("share_links", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  user_id: integer("user_id", { mode: "number" })
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  kind: text("kind", { enum: ["public", "ics"] }).notNull(),
  is_active: integer("is_active", { mode: "boolean" }).notNull().default(true),
  expires_at: integer("expires_at", { mode: "timestamp" }),
  created_at: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
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
