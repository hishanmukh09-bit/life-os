import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Dumbbell, Plus, Sparkles, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {formatMin} from "@/lib/date";
import { aiErrorMessage, AiThinking } from "@/components/ai";

const TYPES = [
  "strength", "cardio", "walking", "running", "cycling",
  "mobility", "yoga", "bodyweight", "gym", "sports",
] as const;

export default function WorkoutPage() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: workouts } = trpc.tracker.workoutList.useQuery({ days: 30 });
  const utils = trpc.useUtils();
  const del = trpc.tracker.deleteWorkout.useMutation({
    onSuccess: () => utils.tracker.workoutList.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const plan = trpc.ai.workoutPlan.useMutation({
    onError: (e) => toast.error(aiErrorMessage(e.message)),
  });
  const [planText, setPlanText] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("new") === "workout") {
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const mine = (workouts ?? []).filter((w) => w.mine);
  const totalMin = mine.reduce((s, w) => s + w.durationMin, 0);
  const thisWeek = mine.filter((w) => w.date >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Workout</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Move, gently</h1>
          <p className="mt-1 text-sm text-muted-foreground">Consistency first. Wellbeing over numbers.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full min-h-[44px]"
            disabled={plan.isPending}
            onClick={() =>
              plan.mutate(undefined, {
                onSuccess: (d) => setPlanText(d.text),
              })
            }
          >
            <Sparkles className="mr-1.5 h-4 w-4" /> AI plan
          </Button>
          <Button onClick={() => setOpen(true)} className="btn-brand rounded-full min-h-[44px]">
            <Plus className="mr-1.5 h-4 w-4" /> Log workout
          </Button>
        </div>
      </div>

      {(plan.isPending || planText) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle>Today's AI workout suggestion</SectionTitle>
          {plan.isPending ? (
            <AiThinking label="Building a routine around your equipment and time…" />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{planText}</p>
          )}
        </section>
      )}

      <div className="grid grid-cols-3 gap-3">
        <StatPill label="This week" value={`${thisWeek.length}`} sub="sessions" />
        <StatPill label="30 days" value={`${mine.length}`} sub="sessions" />
        <StatPill label="30 days" value={formatMin(totalMin)} sub="moving" />
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="No workouts yet"
          hint="Log your first workout to start seeing your progress."
          action={<Button onClick={() => setOpen(true)} variant="outline" className="rounded-full">Log a workout</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {[...mine].reverse().map((w) => (
            <li key={w.id} className="card-lift flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-soft">
                <Dumbbell className="h-4 w-4 text-brand" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium capitalize">{w.type} · {formatMin(w.durationMin)}</p>
                <p className="text-xs text-muted-foreground">
                  {w.date}
                  {w.notes ? ` · ${w.notes}` : ""}
                </p>
              </div>
              <Chip tone={w.visibility === "shared" ? "brand" : "neutral"}>
                {w.visibility === "shared" ? "shared" : "private"}
              </Chip>
              <button
                onClick={() => del.mutate({ id: w.id })}
                aria-label="Delete workout"
                className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-[hsl(var(--destructive))]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <WorkoutDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function StatPill({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 text-center">
      <p className="eyebrow">{label}</p>
      <p className="font-display mt-1 text-2xl font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function WorkoutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<(typeof TYPES)[number]>("strength");
  const [duration, setDuration] = useState("45");
  const [exercises, setExercises] = useState("");
  const [notes, setNotes] = useState("");
  const [shared, setShared] = useState(true);
  const utils = trpc.useUtils();
  const add = trpc.tracker.addWorkout.useMutation({
    onSuccess: () => {
      utils.tracker.workoutList.invalidate();
      toast.success("Workout logged.");
      setExercises(""); setNotes("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Log workout</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({
              type,
              durationMin: parseInt(duration) || 30,
              exercises: exercises || null,
              notes: notes || null,
              visibility: shared ? "shared" : "private",
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Duration (min)</Label>
              <Input type="number" min={1} max={1440} value={duration} onChange={(e) => setDuration(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Exercises (optional)</Label>
            <Textarea
              value={exercises}
              onChange={(e) => setExercises(e.target.value)}
              placeholder={"Squats 3×10 @ 20kg\nPush-ups 3×12\nPlank 3×45s"}
              rows={4}
              className="rounded-xl font-mono text-xs"
            />
          </div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-11 rounded-xl" />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Share with partner
          </label>
          <Button type="submit" disabled={add.isPending} className="btn-brand h-12 w-full rounded-full">
            {add.isPending ? "Saving…" : "Log workout"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
