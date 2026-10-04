import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  LifeBuoy,
  Sparkles,
  Sunrise,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { ProgressRing, SectionTitle, Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { greeting, todayStr, formatMin, nowTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useAiAction } from "@/components/ai";

export default function HomePage() {
  const { user } = useAuth();
  const today = todayStr();
  const { data: profile } = trpc.profile.me.useQuery();
  const { data: tasks } = trpc.task.list.useQuery({ from: today, to: today });
  const { data: habits } = trpc.habit.list.useQuery();
  const { data: water } = trpc.tracker.waterToday.useQuery();
  const { data: sleep } = trpc.tracker.sleepList.useQuery({ days: 7 });
  const { data: study } = trpc.study.dashboard.useQuery();
  const { data: partnerStatus } = trpc.social.partnerStatus.useQuery(undefined, {
    refetchInterval: 60_000,
  });

  const myTasks = (tasks ?? []).filter((t) => t.status !== "archived");
  const done = myTasks.filter((t) => t.status === "done").length;
  const total = myTasks.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const priorities = myTasks
    .filter((t) => t.status === "todo")
    .sort((a, b) => {
      const rank = { must_do: 0, high: 1, normal: 2, low: 3 } as const;
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, 4);

  const studyToday = (study?.sessions ?? [])
    .filter((s) => s.date === today)
    .reduce((sum, s) => sum + s.durationMin, 0);
  const lastSleep = sleep?.filter((s) => s.date === today)[0] ?? sleep?.[sleep.length - 1];
  const myHabits = (habits ?? []).filter((h) => h.mine);
  const habitsDone = myHabits.filter((h) => h.doneToday).length;
  const waterTarget = profile?.waterTargetMl ?? 2500;

  const name = profile?.displayName || user?.name || "there";
  const utils = trpc.useUtils();
  const completeTask = trpc.task.complete.useMutation({
    onSuccess: () => utils.task.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="font-display mt-2 text-4xl font-medium leading-tight sm:text-5xl">
            {greeting()},{" "}
            <em className="display-italic-accent">{name}</em>.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">One step at a time.</p>
        </div>
        <div className="flex items-center gap-5">
          <ProgressRing value={pct} size={104} label={`${pct}%`} sub="today" />
          <div className="hidden sm:block">
            <p className="font-display text-2xl font-medium">
              {done} / {total}
            </p>
            <p className="text-sm text-muted-foreground">tasks completed</p>
          </div>
        </div>
      </div>

      {/* AI action row */}
      <NextActionCard />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Priorities */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle right={<Link to="/tasks" className="text-xs text-brand hover:underline">All tasks</Link>}>
            Today's priorities
          </SectionTitle>
          {priorities.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              {total === 0
                ? "Nothing planned yet. Add a task to shape your day."
                : "Everything's done. Tomorrow is another chance."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {priorities.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3">
                  <button
                    aria-label={`Complete ${t.title}`}
                    onClick={() => completeTask.mutate({ id: t.id })}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-brand"
                  >
                    <Circle className="h-5 w-5" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{t.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.category.replace("_", " ")}
                      {t.estimatedMin ? ` · ${formatMin(t.estimatedMin)}` : ""}
                    </p>
                  </div>
                  {t.priority === "must_do" && <Chip tone="danger">Must do</Chip>}
                  {t.priority === "high" && <Chip tone="warning">High</Chip>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* My progress */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle right={<Link to="/progress" className="text-xs text-brand hover:underline">Trends</Link>}>
            My progress
          </SectionTitle>
          <div className="grid grid-cols-2 gap-x-4 gap-y-5 py-2 sm:grid-cols-3">
            <MiniStat label="Tasks" value={`${done}/${total}`} />
            <MiniStat label="Study" value={formatMin(studyToday)} />
            <MiniStat label="Workout" value={<WorkoutToday />} />
            <MiniStat
              label="Water"
              value={`${((water?.total ?? 0) / 1000).toFixed(1)}L`}
              sub={`of ${(waterTarget / 1000).toFixed(1)}L`}
            />
            <MiniStat
              label="Sleep"
              value={lastSleep?.durationMin ? formatMin(lastSleep.durationMin) : "—"}
              sub={lastSleep?.quality ? `quality ${lastSleep.quality}/5` : undefined}
            />
            <MiniStat label="Habits" value={`${habitsDone}/${myHabits.length}`} />
          </div>
          {/* Water quick add */}
          <div className="mt-4 flex items-center gap-2">
            <WaterButton amount={250} />
            <WaterButton amount={500} />
            <Link to="/track" className="ml-auto text-xs text-brand hover:underline">
              Track
            </Link>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Habits */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle right={<Link to="/habits" className="text-xs text-brand hover:underline">All habits</Link>}>
            Habits
          </SectionTitle>
          {myHabits.length === 0 ? (
            <EmptyState
              title="No habits yet"
              hint="Small things, done often. Add your first habit."
              action={<Link to="/habits?new=habit"><Button variant="outline" className="rounded-full">Add a habit</Button></Link>}
            />
          ) : (
            <div className="flex flex-wrap gap-2 py-1">
              {myHabits.map((h) => (
                <HabitDot key={h.id} id={h.id} name={h.name} done={h.doneToday} streak={h.currentStreak} />
              ))}
            </div>
          )}
        </section>

        {/* Other person */}
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle right={<Link to="/us" className="text-xs text-brand hover:underline">Open Us</Link>}>
            {partnerStatus?.partner
              ? `How ${partnerStatus.partner.displayName || partnerStatus.partner.name || "your person"} is doing`
              : "Your person"}
          </SectionTitle>
          {!partnerStatus?.partner ? (
            <div className="py-2">
              <p className="text-sm text-muted-foreground">
                Your space is waiting for its second member.
              </p>
              <Link to="/us">
                <Button variant="outline" className="mt-3 rounded-full">Invite them</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {partnerStatus.checkin ? (
                <div className="flex items-center gap-3">
                  <Chip tone="brand">Mood: {partnerStatus.checkin.mood}</Chip>
                  <Chip tone="neutral">Energy {partnerStatus.checkin.energy}/10</Chip>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No check-in shared yet today.</p>
              )}
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  Tasks: <span className="font-medium text-foreground">{partnerStatus.tasks.done}/{partnerStatus.tasks.total}</span>
                </span>
                <span>
                  Workout: <span className="font-medium text-foreground">{partnerStatus.workoutLogged ? "logged" : "not yet"}</span>
                </span>
                {partnerStatus.sleep?.durationMin != null && (
                  <span>
                    Sleep: <span className="font-medium text-foreground">{formatMin(partnerStatus.sleep.durationMin)}</span>
                  </span>
                )}
              </div>
              <Link to="/us" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
                Send encouragement <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-1 text-lg font-medium">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function WorkoutToday() {
  const { data: workouts } = trpc.tracker.workoutList.useQuery({ days: 1 });
  const today = todayStr();
  const mine = (workouts ?? []).filter((w) => w.date === today);
  return <>{mine.length ? "Done" : "—"}</>;
}

function WaterButton({ amount }: { amount: number }) {
  const utils = trpc.useUtils();
  const add = trpc.tracker.addWater.useMutation({
    onSuccess: () => {
      utils.tracker.waterToday.invalidate();
      utils.tracker.waterWeek.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <button
      onClick={() => add.mutate({ amountMl: amount })}
      disabled={add.isPending}
      className="rounded-full border border-border px-3.5 py-2 text-xs font-medium transition-colors hover:bg-brand-soft hover:text-brand-ink min-h-[36px]"
    >
      +{amount} ml
    </button>
  );
}

function HabitDot({ id, name, done, streak }: { id: number; name: string; done: boolean; streak: number }) {
  const utils = trpc.useUtils();
  const toggle = trpc.habit.toggle.useMutation({
    onSuccess: () => utils.habit.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  return (
    <button
      onClick={() => toggle.mutate({ habitId: id })}
      className={cn(
        "flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors",
        done
          ? "border-[hsl(var(--brand))] bg-brand-soft text-brand-ink"
          : "border-border text-muted-foreground hover:bg-secondary",
      )}
      aria-pressed={done}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
      {name}
      {streak > 0 && <span className="eyebrow ml-1">{streak}d</span>}
    </button>
  );
}

/** NEXT ACTION + Rescue + Prepare tomorrow — the AI planning row. */
function NextActionCard() {
  const [result, setResult] = useState<{ kind: string; text: string } | null>(null);
  const nextAction = useAiAction(trpc.ai.nextAction.useMutation);
  const rescue = useAiAction(trpc.ai.rescueDay.useMutation);
  const prepare = useAiAction(trpc.ai.prepareTomorrow.useMutation);

  const run = (kind: string, mutation: typeof nextAction) => {
    mutation.mutate(
      { localTime: nowTime() },
      {
        onSuccess: (data) => setResult({ kind, text: data.text }),
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const pending = nextAction.isPending || rescue.isPending || prepare.isPending;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <p className="eyebrow-accent flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Next action
          </p>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            {result ? (
              <span className="font-display text-lg text-foreground">{result.kind}</span>
            ) : (
              "Not sure where to start? Ask, and get one concrete next step."
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => run("What should I do now?", nextAction)}
            disabled={pending}
            className="btn-brand rounded-full min-h-[44px]"
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            What should I do now?
          </Button>
          <Button
            variant="outline"
            onClick={() => run("Rescue my day", rescue)}
            disabled={pending}
            className="rounded-full min-h-[44px]"
          >
            <LifeBuoy className="mr-1.5 h-4 w-4" />
            Rescue my day
          </Button>
          <Button
            variant="outline"
            onClick={() => run("Prepare tomorrow", prepare)}
            disabled={pending}
            className="rounded-full min-h-[44px]"
          >
            <Sunrise className="mr-1.5 h-4 w-4" />
            Prepare tomorrow
          </Button>
        </div>
      </div>
      {pending && (
        <div className="border-t border-border px-5 py-4">
          <p className="text-sm text-muted-foreground">
            <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-border border-t-[hsl(var(--brand))] align-middle" />
            Thinking through your day…
          </p>
        </div>
      )}
      {result && !pending && (
        <div className="border-t border-border px-5 py-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{result.text}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            A suggestion, never an order — you decide what happens next.
          </p>
        </div>
      )}
    </section>
  );
}
