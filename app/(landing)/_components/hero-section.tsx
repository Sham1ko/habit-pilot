import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative flex h-screen items-center overflow-hidden bg-slate-50 py-12 sm:py-16 lg:pb-36">
      <div className="absolute bottom-0 right-0 hidden lg:block">
        <img
          className="w-full origin-bottom-right scale-150 lg:w-auto lg:scale-75"
          src="https://cdn.rareblocks.xyz/collection/clarity/images/hero/1/background-pattern.png"
          alt=""
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Calm planning
            </div>

            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl sm:leading-tight lg:text-6xl lg:leading-tight">
              Plan habits without overload.
            </h1>
            <p className="mt-3 text-lg text-slate-600 sm:mt-6">
              Weekly Capacity (CU) keeps your week realistic. Micro-steps help
              you recover without starting from zero.
            </p>

            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-start">
              <Link
                href="/app"
                className="inline-flex items-center justify-center rounded-md bg-slate-900 px-7 py-3 text-base font-semibold text-white transition hover:bg-slate-700"
              >
                Open app
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-7 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                See how it works
              </a>
            </div>

            <div className="mt-8 sm:mt-12">
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-600 lg:justify-start">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Private by default
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Works in browser
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                  Weekly capacity (CU)
                </span>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-4 rounded-[32px] bg-white/70 blur-2xl" />
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Habit Pilot
                </span>
              </div>

              <div className="space-y-5 p-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold text-slate-500">
                    Weekly Capacity Meter
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-2/3 rounded-full bg-slate-900" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Weekly Plan
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="h-2 w-4/5 rounded-full bg-slate-200" />
                      <div className="h-2 w-2/3 rounded-full bg-slate-200" />
                      <div className="h-2 w-3/4 rounded-full bg-slate-200" />
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500">
                      Today marks
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">
                        Done
                      </span>
                      <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">
                        Skip
                      </span>
                      <span className="rounded-full border border-slate-300 px-2 py-1 text-slate-600">
                        Micro
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Recovery tips</span>
                    <span className="text-emerald-600">+1 micro-step</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    “Do 2 minutes of your habit today to keep momentum.”
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
