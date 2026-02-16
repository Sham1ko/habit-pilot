import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
	try {
		const { email, password } = await request.json();

		// Validate input
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

		const supabase = await createClient();

		// Sign up user with Supabase Auth
		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${request.headers.get("origin")}/auth/callback`,
			},
		});

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 400 });
		}

		return NextResponse.json(
			{
				message:
					"Registration successful! Please check your email to verify your account.",
				user: data.user,
			},
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
