import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function createDb() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;
  const token = process.env.CLOUDFLARE_D1_TOKEN;

  return drizzle({ accountId, databaseId, token, schema });
}

export const db = createDb();
