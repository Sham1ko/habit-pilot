import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function createDb() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  // Use remote D1 via HTTP API when all credentials are provided
  if (accountId && databaseId && token) {
    return drizzle({ accountId, databaseId, token, schema });
  }
}

const globalForDb = globalThis as { _db?: ReturnType<typeof createDb> };
if (!globalForDb._db) {
  globalForDb._db = createDb();
}

export const db = globalForDb._db;
