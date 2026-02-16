"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderMeta = {
	title: string;
	subtitle?: string;
};

const ROUTE_META: Record<string, HeaderMeta> = {
	"/today": {
		title: "Today",
		subtitle: "Focus on the habits that move the day forward.",
	},
	"/plan": {
		title: "Plan",
		subtitle: "Distribute your week within available capacity.",
	},
	"/habits": {
		title: "Habits",
		subtitle: "Manage routines, weight, and micro-steps.",
	},
	"/settings": {
		title: "Settings",
		subtitle: "Appearance and app preferences.",
	},
};

function toTitleCase(segment: string) {
	return segment
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function getMeta(pathname: string): HeaderMeta {
	const exact = ROUTE_META[pathname];
	if (exact) {
		return exact;
	}

	const matchedEntry = Object.entries(ROUTE_META).find(([route]) => {
		return pathname.startsWith(`${route}/`);
	});

	if (matchedEntry) {
		return matchedEntry[1];
	}

	const fallbackSegment = pathname.split("/").filter(Boolean).at(-1) ?? "App";
	return {
		title: toTitleCase(fallbackSegment),
	};
}

export function AppHeader() {
	const pathname = usePathname();
	const meta = useMemo(() => getMeta(pathname), [pathname]);

	return (
		<header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/65">
			<div className="flex h-14 items-center gap-3 px-4 md:px-6">
				<SidebarTrigger className="-ml-1" />
				<div className="h-6 w-px bg-border/70" />
				<div className="min-w-0">
					<p className="truncate text-sm font-semibold tracking-tight md:text-base">
						{meta.title}
					</p>
					{meta.subtitle ? (
						<p className="hidden truncate text-xs text-muted-foreground sm:block">
							{meta.subtitle}
						</p>
					) : null}
				</div>
			</div>
		</header>
	);
}
