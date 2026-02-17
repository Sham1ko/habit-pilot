import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export function getDb() {
  const { env } = getCloudflareContext<{ env: { DB: D1Database } }>();
  return drizzle(env.DB, { schema });
}
