export function Footer() {
	return (
		<footer className="border-t border-border/60 py-8">
			<div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
				<span>© Habit Pilot</span>
				<div className="flex flex-wrap gap-4">
					<a
						href="https://github.com/Sham1ko/habit-pilot"
						className="transition hover:text-foreground"
					>
						GitHub
					</a>
					<a href="#" className="transition hover:text-foreground">
						Privacy
					</a>
					<a href="#" className="transition hover:text-foreground">
						Contact
					</a>
				</div>
			</div>
		</footer>
	);
}
