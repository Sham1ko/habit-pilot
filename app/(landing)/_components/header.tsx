import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted/40 text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
            HP
          </div>
          <span className="text-base font-semibold tracking-tight">
            Habit Pilot
          </span>
        </Link>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <a href="#how-it-works" className="transition hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="transition hover:text-foreground">
              Features
            </a>
            <a href="#faq" className="transition hover:text-foreground">
              FAQ
            </a>
          </nav>
          <Button asChild variant="outline" size="sm" className="md:ml-2">
            <Link href="/app">Open app</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
