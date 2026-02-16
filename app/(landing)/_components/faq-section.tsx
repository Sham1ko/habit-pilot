import { faqs } from "./landing-data";

export function FaqSection() {
	return (
		<section id="faq" className="border-y border-border/60 bg-muted/30 py-16">
			<div className="mx-auto max-w-5xl px-4">
				<div className="space-y-3">
					<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
						FAQ
					</p>
					<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
						Quick answers before you start.
					</h2>
				</div>
				<div className="mt-8 space-y-4">
					{faqs.map((item) => (
						<details
							key={item.question}
							className="rounded-2xl border border-border/70 bg-card px-6 py-4 shadow-sm"
						>
							<summary className="cursor-pointer text-sm font-semibold text-foreground">
								{item.question}
							</summary>
							<p className="mt-3 text-sm text-muted-foreground">
								{item.answer}
							</p>
						</details>
					))}
				</div>
			</div>
		</section>
	);
}
