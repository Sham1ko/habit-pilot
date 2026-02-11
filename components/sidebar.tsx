import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import LogoutButton from "@/components/logout-button";

const navItems = [
  { href: "/today", label: "Today" },
  { href: "/habits", label: "Habits" },
  { href: "/progress", label: "Progress" },
  { href: "/plan", label: "Plan" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-full flex-col border-b border-zinc-200 bg-white px-6 py-6 md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white">
          HP
        </div>
        <span className="text-lg font-semibold">Habit Pilot</span>
      </div>

      <div className="mt-8 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Navigation
        </p>
        <nav className="mt-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6 border-t border-zinc-200 pt-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          <Settings className="h-4 w-4" />
          Settings
        </button>
        <LogoutButton className="mt-3 w-full">
          <span className="inline-flex items-center justify-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </span>
        </LogoutButton>
      </div>
    </aside>
  );
}
