"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [dismissedSuccess, setDismissedSuccess] = useState(false);
	const showSuccess =
		searchParams.get("registered") === "true" && !dismissedSuccess;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setDismissedSuccess(true);

		if (!email || !password) {
			setError("Please fill in all fields");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/auth/login", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Login failed");
			}

			// Redirect to today's page after successful login
			router.push("/today");
			router.refresh();
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
							Welcome Back
						</h1>
						<p className="text-zinc-600 dark:text-zinc-400">
							Sign in to your account
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

						{showSuccess ? (
							<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
								Registration successful! Please check your email to verify your
								account.
							</div>
						) : null}

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
							{loading ? "Signing in..." : "Sign In"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-zinc-600 dark:text-zinc-400">
							Don&apos;t have an account?{" "}
							<Link
								href="/register"
								className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
							>
								Sign up
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export default function LoginPage() {
	return (
		<Suspense>
			<LoginForm />
		</Suspense>
	);
}
