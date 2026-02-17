import { eq } from "drizzle-orm";
import { getAuthCookie, verifyToken } from "@/lib/auth/jwt";
import { errorResponse, type RouteResult } from "@/lib/api/http";
import { getDb } from "@/lib/db";
import { type User, users } from "@/lib/db/schema";

export async function requireAuthUserEmail(): Promise<RouteResult<string>> {
  const token = await getAuthCookie();
  if (!token) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { error: errorResponse("Unauthorized", 401) };
  }

  return { data: payload.sub };
}

export async function requireDbUser(email: string): Promise<RouteResult<User>> {
  const db = await getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: errorResponse("User not found", 404) };
  }

  return { data: user };
}

export async function requireRequestUser(): Promise<RouteResult<User>> {
  const emailResult = await requireAuthUserEmail();
  if ("error" in emailResult) {
    return emailResult;
  }

  return requireDbUser(emailResult.data);
}
