import { previewMocks } from "./landing-data";

export function PreviewSection() {
	return (
		<section className="py-16">
			<div className="mx-auto max-w-5xl px-4">
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						Preview
					</p>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						A clean interface that stays out of the way.
					</h2>
				</div>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{previewMocks.map((label) => (
						<div
							key={label}
							className="rounded-2xl border border-border/70 bg-muted/40 p-4 shadow-sm"
						>
							<div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/70 text-xs font-semibold text-muted-foreground">
								{label}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
