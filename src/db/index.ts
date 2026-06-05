import { mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import Database from "better-sqlite3";
import * as schema from "./schema";

// To switch to Postgres, replace this with drizzle-orm/node-postgres + pg Pool
// and set DATABASE_TYPE=postgres + a connection string in DATABASE_URL
const dbPath = resolve(
  (process.env.DATABASE_URL ?? "file:./data/pension.db").replace("file:", "")
);
mkdirSync(dirname(dbPath), { recursive: true });

export const db = drizzle(new Database(dbPath), { schema });

migrate(db, { migrationsFolder: resolve(process.cwd(), "drizzle") });
