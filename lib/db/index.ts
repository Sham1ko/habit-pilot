import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

function initDbConnection() {
  return drizzle(process.env.DB as unknown as D1Database, { schema });
}

export const db = initDbConnection();
