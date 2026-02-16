"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		// Basic validation
		if (!email || !password || !confirmPassword) {
			setError("Please fill in all fields");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (password.length < 6) {
			setError("Password must be at least 6 characters");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Registration failed");
			}

			// Redirect to login or home page after successful registration
			router.push("/login?registered=true");
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-black px-4">
			<div className="w-full max-w-md">
				<div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
							Create Account
						</h1>
						<p className="text-zinc-600 dark:text-zinc-400">
							Sign up to get started
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-6">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
							>
								Email
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="you@example.com"
								className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
							>
								Password
							</label>
							<input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
								required
							/>
						</div>

						<div>
							<label
								htmlFor="confirmPassword"
								className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
							>
								Confirm Password
							</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								placeholder="••••••••"
								className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
								required
							/>
						</div>

						{error ? (
							<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
								{error}
							</div>
						) : null}

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600 dark:disabled:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:cursor-not-allowed"
						>
							{loading ? "Creating account..." : "Sign Up"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
							>
								Sign in
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
