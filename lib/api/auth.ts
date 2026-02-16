import { eq } from "drizzle-orm";
import { errorResponse, type RouteResult } from "@/lib/api/http";
import { db } from "@/lib/db";
import { type User, users } from "@/lib/db/schema";
import { createClient } from "@/lib/supabase/server";

export async function requireAuthUserEmail(): Promise<RouteResult<string>> {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	const email = data.user?.email;
	if (error || !email) {
		return { error: errorResponse("Unauthorized", 401) };
	}

	return { data: email };
}

export async function requireDbUser(email: string): Promise<RouteResult<User>> {
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
