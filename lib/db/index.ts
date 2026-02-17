import * as schema from "./schema";

function createDb() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  // Use remote D1 via HTTP API when all credentials are provided
  if (accountId && databaseId && token) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { drizzle } =
      require("drizzle-orm/d1-http") as typeof import("drizzle-orm/d1-http");
    return drizzle({ accountId, databaseId, token, schema });
  }

  // Fallback to local SQLite for development
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database =
    require("better-sqlite3") as typeof import("better-sqlite3").default;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } =
    require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");

  const sqlite = new Database(process.env.LOCAL_DB_PATH ?? "local.db");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  return drizzle(sqlite, { schema });
}

const globalForDb = globalThis as { _db?: ReturnType<typeof createDb> };
if (!globalForDb._db) {
  globalForDb._db = createDb();
}

export const db = globalForDb._db;
