import { useMemo } from "react";
import { Link } from "react-router";
import { Sunrise, Sun, Sunset, MoonStar } from "lucide-react";
import { trpc } from "@/providers/trpc";

import { todayStr, nowTime } from "@/lib/date";
import { cn } from "@/lib/utils";

type Block = { key: string; label: string; icon: typeof Sun; from: number; to: number };
const BLOCKS: Block[] = [
  { key: "morning", label: "Morning", icon: Sunrise, from: 5, to: 12 },
  { key: "afternoon", label: "Afternoon", icon: Sun, from: 12, to: 17 },
  { key: "evening", label: "Evening", icon: Sunset, from: 17, to: 21 },
  { key: "night", label: "Night", icon: MoonStar, from: 21, to: 24 },
];

/** My Day — a timeline built from your real tasks and trackers. */
export default function MyDayPage() {
  const today = todayStr();
  const { data: tasks } = trpc.task.list.useQuery({ from: today, to: today });
  const { data: habits } = trpc.habit.list.useQuery();
  const { data: meals } = trpc.tracker.mealList.useQuery({ date: today });
  const { data: checkin } = trpc.tracker.checkinGet.useQuery();

  const hour = parseInt(nowTime().split(":")[0], 10);

  const byBlock = useMemo(() => {
    const map: Record<string, { time: string | null; title: string; done: boolean; kind: string }[]> = {
      morning: [], afternoon: [], evening: [], night: [],
    };
    const blockOf = (time: string | null | undefined): string => {
      if (!time) return "morning";
      const h = parseInt(time.split(":")[0], 10);
      if (h < 12) return "morning";
      if (h < 17) return "afternoon";
      if (h < 21) return "evening";
      return "night";
    };
    for (const t of tasks ?? []) {
      map[blockOf(t.dueTime)].push({
        time: t.dueTime,
        title: t.title,
        done: t.status === "done",
        kind: "task",
      });
    }
    for (const m of meals ?? []) {
      map[blockOf(m.time)].push({
        time: m.time,
        title: `${m.type[0].toUpperCase() + m.type.slice(1)}: ${m.description}`,
        done: true,
        kind: "meal",
      });
    }
    const myHabits = (habits ?? []).filter((h) => h.mine);
    const morningHabits = myHabits.slice(0, 3);
    for (const h of morningHabits) {
      map.morning.push({ time: null, title: h.name, done: h.doneToday, kind: "habit" });
    }
    map.night.push({
      time: null,
      title: "Reflection & tomorrow planning",
      done: !!checkin,
      kind: "ritual",
    });
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
    }
    return map;
  }, [tasks, meals, habits, checkin]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow-accent">My Day</p>
        <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your day, built from your tasks, meals and rituals.
        </p>
      </div>

      <div className="space-y-6">
        {BLOCKS.map((block) => {
          const items = byBlock[block.key];
          const isNow = block.key === "night" ? hour >= 21 || hour < 5 : hour >= block.from && hour < block.to;
          return (
            <section
              key={block.key}
              className={cn(
                "rounded-2xl border bg-card p-5 transition-colors",
                isNow ? "border-[hsl(var(--brand)/0.5)]" : "border-border",
              )}
            >
              <div className="mb-3 flex items-center gap-2">
                <block.icon className={cn("h-4 w-4", isNow ? "text-brand" : "text-muted-foreground")} />
                <h2 className="eyebrow">{block.label}</h2>
                {isNow && <span className="eyebrow-accent ml-auto">Now</span>}
              </div>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing planned. <Link to="/tasks?new=task" className="text-brand hover:underline">Add something</Link> or leave it open.
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((it, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <span className="w-12 shrink-0 text-right font-mono text-xs text-muted-foreground">
                        {it.time ?? "—"}
                      </span>
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", it.done ? "bg-[hsl(var(--success))]" : "bg-[hsl(var(--brand))]")} />
                      <span className={cn("text-sm", it.done && "text-muted-foreground line-through")}>
                        {it.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
