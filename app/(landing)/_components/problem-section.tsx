export function ProblemSection() {
  return (
    <section className="border-y border-border/60 bg-muted/30 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            The problem
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            The problem
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Overplanning that looks good until it collapses.</li>
            <li>Streak guilt after one missed day.</li>
            <li>Drop after misses and a hard restart.</li>
          </ul>
        </div>
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            What Habit Pilot changes
          </p>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            What Habit Pilot changes
          </h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Weekly capacity budget (CU) that caps overload.</li>
            <li>Micro-steps (graded wins) to stay consistent.</li>
            <li>Slip recovery flow that keeps you moving.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
