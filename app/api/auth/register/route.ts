import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { setAuthCookie, signToken } from "@/lib/auth/jwt";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return NextResponse.json(
				{ error: "Email and password are required" },
				{ status: 400 },
			);
		}

		if (password.length < 6) {
			return NextResponse.json(
				{ error: "Password must be at least 6 characters" },
				{ status: 400 },
			);
		}

		// Check if user already exists
		const [existing] = await db
			.select({ id: users.id })
			.from(users)
			.where(eq(users.email, email))
			.limit(1);

		if (existing) {
			return NextResponse.json(
				{ error: "User with this email already exists" },
				{ status: 409 },
			);
		}

		const password_hash = await hashPassword(password);

		const [user] = await db
			.insert(users)
			.values({ email, password_hash })
			.returning({ id: users.id, email: users.email });

		const token = await signToken({ sub: user.email, userId: user.id });
		await setAuthCookie(token);

		return NextResponse.json(
			{ message: "Registration successful", user: { id: user.id, email: user.email } },
			{ status: 201 },
		);
	} catch (error) {
		console.error("Registration error:", error);
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
