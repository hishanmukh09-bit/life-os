import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Flame, Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, EmptyState, Chip } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addDays, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function HabitsPage() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get("new") === "habit");
  const { data: habits } = trpc.habit.list.useQuery();
  const utils = trpc.useUtils();
  const toggle = trpc.habit.toggle.useMutation({
    onSuccess: () => utils.habit.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (params.get("new") === "habit") {
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const mine = (habits ?? []).filter((h) => h.mine);
  const theirs = (habits ?? []).filter((h) => !h.mine);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Habits</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Small things, often</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One missed day doesn't erase your progress.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="btn-brand rounded-full min-h-[44px]">
          <Plus className="mr-1.5 h-4 w-4" /> New habit
        </Button>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="No habits yet"
          hint="Wake early, read, walk, drink water — start with one."
          action={<Button onClick={() => setOpen(true)} variant="outline" className="rounded-full">Add your first habit</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {mine.map((h) => (
            <div key={h.id} className="card-lift rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-display text-lg font-medium">{h.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Flame className="h-3.5 w-3.5 text-brand" /> {h.currentStreak} day{h.currentStreak === 1 ? "" : "s"}
                    </span>
                    <span>· best {h.bestStreak}</span>
                    <span>· {h.consistency30}% this month</span>
                  </div>
                </div>
                <button
                  onClick={() => toggle.mutate({ habitId: h.id })}
                  aria-pressed={h.doneToday}
                  className={cn(
                    "min-h-[44px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                    h.doneToday ? "btn-brand" : "border border-border hover:bg-secondary",
                  )}
                >
                  {h.doneToday ? "Done today" : "Mark done"}
                </button>
              </div>
              {/* Week strip */}
              <div className="mt-4 flex gap-1.5">
                {h.week.map((d) => (
                  <div
                    key={d.date}
                    title={d.date}
                    className={cn(
                      "h-8 flex-1 rounded-lg",
                      d.done ? "bg-[hsl(var(--brand))]" : "bg-secondary",
                      d.date === todayStr() && "ring-2 ring-[hsl(var(--brand)/0.4)] ring-offset-1 ring-offset-card",
                    )}
                  />
                ))}
              </div>
              <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                <span>{addDays(todayStr(), -6).slice(5)}</span>
                <span>today</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {theirs.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle>Shared by your partner</SectionTitle>
          <div className="grid gap-3 sm:grid-cols-2">
            {theirs.map((h) => (
              <div key={h.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{h.name}</p>
                  <Chip tone={h.doneToday ? "success" : "neutral"}>
                    {h.doneToday ? "done today" : "not yet"}
                  </Chip>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {h.currentStreak}-day streak · {h.consistency30}% this month
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Their habits, only because they chose to share. No nudging — just support.
          </p>
        </section>
      )}

      <HabitDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function HabitDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [shared, setShared] = useState(true);
  const utils = trpc.useUtils();
  const create = trpc.habit.create.useMutation({
    onSuccess: () => {
      utils.habit.list.invalidate();
      toast.success("Habit added.");
      setName("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New habit</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            create.mutate({ name: name.trim(), visibility: shared ? "shared" : "private" });
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Read 20 pages"
            className="h-12 rounded-xl"
            autoFocus
          />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Visible to my partner
          </label>
          <Button type="submit" disabled={create.isPending || !name.trim()} className="btn-brand h-12 w-full rounded-full">
            {create.isPending ? "Adding…" : "Add habit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
