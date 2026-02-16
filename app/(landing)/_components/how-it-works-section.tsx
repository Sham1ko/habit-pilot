import { steps } from "./landing-data";

export function HowItWorksSection() {
	return (
		<section id="how-it-works" className="py-16">
			<div className="mx-auto max-w-5xl px-4">
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						How it works
					</p>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						A three-step flow that respects your capacity.
					</h2>
					<p className="text-sm text-muted-foreground">
						Plan once, act daily, recover without friction.
					</p>
				</div>
				<div className="mt-8 grid gap-6 md:grid-cols-3">
					{steps.map((step) => (
						<div
							key={step.title}
							className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
						>
							<div className="text-2xl">{step.icon}</div>
							<h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
							<p className="mt-2 text-sm text-muted-foreground">
								{step.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
