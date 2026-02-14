import { features } from "./landing-data";

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="border-y border-border/60 bg-muted/30 py-16"
    >
      <div className="mx-auto max-w-5xl px-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Key features
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Tools built for realistic momentum.
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to plan, track, and recover.
          </p>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
