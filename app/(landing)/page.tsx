import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="max-w-lg text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
          Habit Pilot
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-zinc-900">
          Navigate your habits with ease.
        </h1>
        <p className="mt-4 text-base text-zinc-600">
          Simple daily check-ins, clear progress, and a plan that sticks.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
            href="/login"
          >
            Sign in
          </Link>
          <Link
            className="inline-flex items-center justify-center rounded-lg border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-white"
            href="/register"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  );
}
