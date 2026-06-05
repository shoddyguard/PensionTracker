import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const pensions = sqliteTable("pensions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  provider: text("provider").notNull(),
  name: text("name").notNull(),
  status: text("status", { enum: ["active", "closed"] }).notNull().default("active"),
  openingBalanceDate: integer("opening_balance_date", { mode: "timestamp" }),
});

export const funds = sqliteTable("funds", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pensionId: integer("pension_id")
    .notNull()
    .references(() => pensions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tickerIsin: text("ticker_isin"),
  targetAllocation: real("target_allocation"),
  openingBalance: real("opening_balance"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const snapshots = sqliteTable("snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  pensionId: integer("pension_id")
    .notNull()
    .references(() => pensions.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const snapshotEntries = sqliteTable("snapshot_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => snapshots.id, { onDelete: "cascade" }),
  fundId: integer("fund_id")
    .notNull()
    .references(() => funds.id),
  sharesHeld: real("shares_held").notNull(),
  value: real("value").notNull(),
});

export const contributions = sqliteTable("contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  snapshotId: integer("snapshot_id")
    .notNull()
    .references(() => snapshots.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  type: text("type", { enum: ["contribution", "transfer_in", "transfer_out"] }).notNull(),
});
