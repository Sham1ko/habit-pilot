import { HabitCreateDialog } from "./HabitCreateDialog";

export default function HabitsPage() {
  const habits = [
    {
      id: "habit-1",
      name: "Morning run",
      schedule: "Mon, Wed, Fri",
      streak: 12,
    },
    {
      id: "habit-2",
      name: "Read 20 pages",
      schedule: "Daily",
      streak: 5,
    },
    {
      id: "habit-3",
      name: "No sugar",
      schedule: "Weekdays",
      streak: 9,
    },
  ];

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
          <p className="text-sm text-muted-foreground">
            Track your routines and keep your streaks alive.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HabitCreateDialog />
        </div>
      </header>

      <div className="grid gap-3">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground"
          >
            <div>
              <h2 className="text-lg font-semibold">{habit.name}</h2>
              <p className="text-sm text-muted-foreground">{habit.schedule}</p>
            </div>
            <div className="text-sm font-medium">
              Streak: {habit.streak} days
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
