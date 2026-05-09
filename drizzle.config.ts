import type { Config } from "drizzle-kit";

const isSQLite = (process.env.DATABASE_TYPE ?? "sqlite") === "sqlite";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isSQLite ? "sqlite" : "postgresql",
  dbCredentials: isSQLite
    ? { url: process.env.DATABASE_URL ?? "file:./data/pension.db" }
    : { url: process.env.DATABASE_URL! },
} satisfies Config;
