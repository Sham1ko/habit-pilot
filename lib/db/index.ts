import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as { pool?: pg.Pool };

if (!globalForDb.pool) {
	globalForDb.pool = new pg.Pool({
		connectionString: process.env.DIRECT_URL,
	});
}

export const db = drizzle(globalForDb.pool, { schema });
