"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
	const { theme, resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const isThemeResolved = Boolean(resolvedTheme);

	const handleThemeChange = (checked: boolean) => {
		setTheme(checked ? "dark" : "light");
	};

	return (
		<section className="mx-auto w-full max-w-2xl space-y-6">
			<header>
				<p className="text-sm text-muted-foreground">
					Manage the appearance of the application.
				</p>
			</header>

			<div className="rounded-xl border border-border bg-card p-5 shadow-sm">
				<div className="flex items-center justify-between gap-4">
					<div className="space-y-1">
						<h2 className="text-base font-medium">Dark mode</h2>
						<p className="text-sm text-muted-foreground">
							Toggle between light and dark themes.
						</p>
					</div>

					<div className="flex items-center gap-3">
						<Sun className="size-4 text-muted-foreground" />
						<Switch
							checked={isDark}
							disabled={!isThemeResolved}
							onCheckedChange={handleThemeChange}
							aria-label="Toggle dark mode"
						/>
						<Moon className="size-4 text-muted-foreground" />
					</div>
				</div>

				<p className="mt-4 text-xs text-muted-foreground">
					Current theme:{" "}
					{theme === "system" ? "system" : (resolvedTheme ?? "...")}
				</p>
			</div>
		</section>
	);
}
