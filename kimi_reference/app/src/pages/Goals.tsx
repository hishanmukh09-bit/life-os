import { useState } from "react";
import { toast } from "sonner";
import { Check, Plus, Target, Trash2, Users } from "lucide-react";
import { trpc } from "@/providers/trpc";
import type { RouterOutputs } from "@/lib/router-types";
import { Chip, EmptyState, ProgressRing } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "academics", "career", "fitness", "projects", "reading",
  "skills", "financial", "personal", "us",
] as const;

type GoalRow = RouterOutputs["goal"]["list"][number];

export default function GoalsPage() {
  const [tab, setTab] = useState("me");
  const [open, setOpen] = useState(false);
  const { data: goals } = trpc.goal.list.useQuery();

  const mine = (goals ?? []).filter((g) => g.mine && g.category !== "us");
  const theirs = (goals ?? []).filter((g) => !g.mine && g.category !== "us");
  const us = (goals ?? []).filter((g) => g.category === "us");
  const shown = tab === "me" ? mine : tab === "us" ? us : theirs;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Goals</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Where we're headed</h1>
        </div>
        <Button onClick={() => setOpen(true)} className="btn-brand rounded-full min-h-[44px]">
          <Plus className="mr-1.5 h-4 w-4" /> New goal
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-11 rounded-full">
          <TabsTrigger value="me" className="rounded-full px-5">Me</TabsTrigger>
          <TabsTrigger value="us" className="rounded-full px-5">Us</TabsTrigger>
          <TabsTrigger value="you" className="rounded-full px-5">You</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === "you" && (
        <p className="text-xs text-muted-foreground">
          Only goals your partner explicitly shared appear here. Never ranked, never compared.
        </p>
      )}

      {shown.length === 0 ? (
        <EmptyState
          title={tab === "us" ? "No shared goals yet" : tab === "you" ? "Nothing shared yet" : "No goals yet"}
          hint={
            tab === "us"
              ? "30-day consistency, 20 combined workouts, a trip — set something to grow toward together."
              : "Set a target, break it into milestones, watch it move."
          }
          action={tab !== "you" ? <Button onClick={() => setOpen(true)} variant="outline" className="rounded-full">Add a goal</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {shown.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <GoalDialog open={open} onClose={() => setOpen(false)} defaultUs={tab === "us"} />
    </div>
  );
}

function GoalCard({ goal: g }: { goal: GoalRow }) {
  const utils = trpc.useUtils();
  const update = trpc.goal.update.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const toggleMilestone = trpc.goal.toggleMilestone.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.goal.remove.useMutation({
    onSuccess: () => utils.goal.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const editable = g.mine || g.category === "us";

  return (
    <div className={cn("card-lift rounded-2xl border border-border bg-card p-5", g.status === "done" && "opacity-70")}>
      <div className="flex items-start gap-4">
        <ProgressRing value={g.progress} size={64} stroke={6} label={`${g.progress}%`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {g.category === "us" && <Users className="h-4 w-4 shrink-0 text-brand" />}
            <p className="font-display truncate text-lg font-medium">{g.title}</p>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="capitalize">{g.category}</span>
            {g.targetDate && <span>· by {g.targetDate}</span>}
            <Chip tone={g.visibility === "shared" || g.category === "us" ? "brand" : "neutral"} className="py-0">
              {g.category === "us" ? "ours" : g.visibility}
            </Chip>
          </div>
        </div>
        {g.mine && (
          <button onClick={() => remove.mutate({ id: g.id })} aria-label="Delete goal" className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-[hsl(var(--destructive))]">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      {g.description && <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>}
      {g.milestones.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {g.milestones.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5">
              <button
                disabled={!editable}
                onClick={() => toggleMilestone.mutate({ id: m.id, done: !m.done })}
                aria-label={m.done ? `Uncheck ${m.title}` : `Check ${m.title}`}
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                  m.done ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white" : "border-border hover:border-[hsl(var(--brand))]",
                )}
              >
                {m.done && <Check className="h-3.5 w-3.5" />}
              </button>
              <span className={cn("text-sm", m.done && "text-muted-foreground line-through")}>{m.title}</span>
            </li>
          ))}
        </ul>
      )}
      {editable && g.status === "active" && (
        <div className="mt-4 flex items-center gap-3">
          <Slider
            value={[g.progress]}
            onValueChange={([v]) => update.mutate({ id: g.id, progress: v })}
            min={0} max={100} step={5}
            className="flex-1"
            aria-label={`Progress for ${g.title}`}
          />
          {g.progress === 100 && (
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => update.mutate({ id: g.id, status: "done" })}>
              <Target className="mr-1 h-3.5 w-3.5" /> Mark done
            </Button>
          )}
        </div>
      )}
      {g.status === "done" && <Chip tone="success" className="mt-3">Completed</Chip>}
    </div>
  );
}

function GoalDialog({ open, onClose, defaultUs }: { open: boolean; onClose: () => void; defaultUs: boolean }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(defaultUs ? "us" : "personal");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("private");
  const [milestones, setMilestones] = useState("");
  const utils = trpc.useUtils();
  const create = trpc.goal.create.useMutation({
    onSuccess: () => {
      utils.goal.list.invalidate();
      toast.success("Goal added.");
      setTitle(""); setDescription(""); setMilestones(""); setTargetDate("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">New goal</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              category,
              description: description || null,
              targetDate: targetDate || null,
              visibility,
              milestones: milestones.split("\n").map((m) => m.trim()).filter(Boolean),
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Read two books" className="h-12 rounded-xl" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c === "us" ? "Us (shared)" : c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Target date</Label>
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Why this matters (optional)" rows={2} className="rounded-xl" />
          <div>
            <Label className="eyebrow mb-1.5 block">Milestones (one per line)</Label>
            <Textarea value={milestones} onChange={(e) => setMilestones(e.target.value)} rows={3} placeholder={"Book one\nBook two"} className="rounded-xl" />
          </div>
          {category !== "us" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={visibility === "shared"}
                onChange={(e) => setVisibility(e.target.checked ? "shared" : "private")}
                className="h-4 w-4 rounded accent-[hsl(var(--brand))]"
              />
              Share with my partner
            </label>
          )}
          <Button type="submit" disabled={create.isPending || !title.trim()} className="btn-brand h-12 w-full rounded-full">
            {create.isPending ? "Adding…" : "Add goal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
