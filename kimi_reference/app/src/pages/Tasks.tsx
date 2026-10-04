import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Plus,
  Repeat,
  Camera,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import type { RouterOutputs } from "@/lib/router-types";
import { SectionTitle, Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addDays, formatMin, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";
import { fileToCompressedBase64 } from "@/lib/upload";

const CATEGORIES = [
  "study", "college", "work", "fitness", "health", "food",
  "personal", "household", "relationship", "life_admin", "other",
] as const;
const PRIORITIES = ["low", "normal", "high", "must_do"] as const;
const RECURRENCE = ["none", "daily", "weekdays", "weekends", "weekly", "monthly"] as const;

type TaskRow = RouterOutputs["task"]["list"][number];

export default function TasksPage() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("today");
  const [dialogOpen, setDialogOpen] = useState(params.get("new") === "task");
  const [proofTask, setProofTask] = useState<TaskRow | null>(null);
  const today = todayStr();

  const range = useMemo(() => {
    if (tab === "today") return { from: today, to: today };
    if (tab === "week") return { from: today, to: addDays(today, 6) };
    if (tab === "overdue") return { from: "2000-01-01", to: addDays(today, -1) };
    return {};
  }, [tab, today]);

  const { data: tasks, isLoading } = trpc.task.list.useQuery({
    ...range,
    status: tab === "done" ? "done" : tab === "all" ? "all" : "todo",
  });
  const { data: radar } = trpc.task.radar.useQuery();
  const { data: space } = trpc.space.get.useQuery();
  const utils = trpc.useUtils();
  const invalidate = () => {
    utils.task.list.invalidate();
    utils.task.radar.invalidate();
  };
  const complete = trpc.task.complete.useMutation({ onSuccess: invalidate, onError: (e) => toast.error(e.message) });
  const postpone = trpc.task.postpone.useMutation({
    onSuccess: (r) => {
      invalidate();
      if (r.postponeCount >= 3) {
        toast("Postponed a few times — would a 20-minute version help?", { icon: "🌱" });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.task.remove.useMutation({ onSuccess: invalidate, onError: (e) => toast.error(e.message) });

  useEffect(() => {
    if (params.get("new") === "task") {
      setDialogOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const rows = (tasks ?? []).filter((t) =>
    tab === "done" ? t.status === "done" : tab === "all" ? true : t.status === "todo",
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Tasks</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">What needs doing</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="btn-brand rounded-full min-h-[44px]">
          <Plus className="mr-1.5 h-4 w-4" /> New task
        </Button>
      </div>

      {/* Deadline radar */}
      {(radar ?? []).length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle>Deadline radar</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {(radar ?? []).map((t) => (
              <span
                key={t.id}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                  t.urgency === "red" && "border-[hsl(var(--destructive)/0.4)] bg-[hsl(var(--destructive)/0.08)] text-[hsl(var(--destructive))]",
                  t.urgency === "orange" && "border-[hsl(var(--warning)/0.4)] bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))]",
                  t.urgency === "yellow" && "border-border bg-secondary text-secondary-foreground",
                  t.urgency === "green" && "border-border text-muted-foreground",
                )}
              >
                {t.title}
                <span className="eyebrow">{t.dueDate === today ? "today" : t.dueDate === addDays(today, 1) ? "tomorrow" : t.dueDate}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="h-11 rounded-full">
          {["today", "week", "overdue", "done", "all"].map((t) => (
            <TabsTrigger key={t} value={t} className="rounded-full px-4 capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          title={tab === "done" ? "Nothing completed yet" : "Nothing here"}
          hint={tab === "today" ? "Add a task to shape your day — or enjoy the calm." : "Tasks you add will appear here."}
          action={<Button onClick={() => setDialogOpen(true)} variant="outline" className="rounded-full">Add a task</Button>}
        />
      ) : (
        <ul className="space-y-2">
          {rows.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              partnerName={space?.partner?.displayName || space?.partner?.name || "partner"}
              onComplete={() => {
                if (t.proofRequired && t.status !== "done" && !t.proofKey) setProofTask(t);
                else complete.mutate({ id: t.id, done: t.status !== "done" });
              }}
              onPostpone={() => postpone.mutate({ id: t.id, toDate: addDays(todayStr(), 1) })}
              onDelete={() => remove.mutate({ id: t.id })}
            />
          ))}
        </ul>
      )}

      <TaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} partnerId={space?.partner?.id} />
      <ProofDialog
        task={proofTask}
        onDone={(key) => {
          if (proofTask) complete.mutate({ id: proofTask.id, done: true, proofKey: key ?? undefined });
          setProofTask(null);
        }}
        onSkip={() => {
          if (proofTask) complete.mutate({ id: proofTask.id, done: true });
          setProofTask(null);
        }}
      />
    </div>
  );
}

function TaskItem({
  task: t,
  partnerName,
  onComplete,
  onPostpone,
  onDelete,
}: {
  task: TaskRow;
  partnerName: string;
  onComplete: () => void;
  onPostpone: () => void;
  onDelete: () => void;
}) {
  const done = t.status === "done";
  const overdue = !done && t.dueDate && t.dueDate < todayStr();
  return (
    <li className={cn("card-lift flex items-center gap-3 rounded-2xl border border-border bg-card p-3 pl-2", done && "opacity-60")}>
      <button
        onClick={onComplete}
        aria-label={done ? `Reopen ${t.title}` : `Complete ${t.title}`}
        className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-full", done ? "text-[hsl(var(--success))]" : "text-muted-foreground hover:text-brand")}
      >
        {done ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium", done && "line-through")}>{t.title}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span className="capitalize">{t.category.replace("_", " ")}</span>
          {t.dueDate && (
            <span className={cn("flex items-center gap-1", overdue && "font-medium text-[hsl(var(--destructive))]")}>
              <CalendarClock className="h-3 w-3" />
              {t.dueDate}
              {t.dueTime ? ` ${t.dueTime}` : ""}
            </span>
          )}
          {t.estimatedMin && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatMin(t.estimatedMin)}
            </span>
          )}
          {t.recurrence !== "none" && (
            <span className="flex items-center gap-1">
              <Repeat className="h-3 w-3" /> {t.recurrence}
            </span>
          )}
          {t.postponeCount > 0 && <span>postponed {t.postponeCount}×</span>}
          {t.assigneeId !== t.creatorId && (
            <Chip tone="brand" className="py-0">for {partnerName}</Chip>
          )}
          {t.visibility === "private" && <Chip className="py-0">private</Chip>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {t.priority === "must_do" && <Chip tone="danger">Must</Chip>}
        {t.priority === "high" && <Chip tone="warning">High</Chip>}
        {t.proofRequired && !t.proofKey && <Camera className="h-4 w-4 text-muted-foreground" aria-label="Proof required" />}
        <TaskMenu onPostpone={onPostpone} onDelete={onDelete} />
      </div>
    </li>
  );
}

function TaskMenu({ onPostpone, onDelete }: { onPostpone: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Task options"
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
      >
        <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <button onClick={() => { setOpen(false); onPostpone(); }} className="block w-full px-4 py-3 text-left text-sm hover:bg-secondary min-h-[44px]">
            Move to tomorrow
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }} className="block w-full px-4 py-3 text-left text-sm text-[hsl(var(--destructive))] hover:bg-secondary min-h-[44px]">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function TaskDialog({ open, onClose, partnerId }: { open: boolean; onClose: () => void; partnerId?: number | null }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("personal");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [dueDate, setDueDate] = useState(todayStr());
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState<(typeof RECURRENCE)[number]>("none");
  const [estimatedMin, setEstimatedMin] = useState("");
  const [visibility, setVisibility] = useState<"private" | "shared">("shared");
  const [assignee, setAssignee] = useState<"me" | "partner">("me");
  const [proofRequired, setProofRequired] = useState(false);

  const create = trpc.task.create.useMutation({
    onSuccess: () => {
      utils.task.list.invalidate();
      utils.task.radar.invalidate();
      toast.success("Task added.");
      onClose();
      setTitle(""); setDescription(""); setEstimatedMin(""); setDueTime("");
      setRecurrence("none"); setProofRequired(false); setAssignee("me");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">New task</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              description: description.trim() || null,
              category,
              priority,
              dueDate: dueDate || null,
              dueTime: dueTime || null,
              recurrence,
              estimatedMin: estimatedMin ? parseInt(estimatedMin) : null,
              visibility,
              assigneeId: assignee === "partner" && partnerId ? partnerId : null,
              proofRequired,
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" className="h-12 rounded-xl" autoFocus />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes (optional)" className="rounded-xl" rows={2} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>{p === "must_do" ? "Must do" : p[0].toUpperCase() + p.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Time</Label>
              <Input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Repeats</Label>
              <Select value={recurrence} onValueChange={(v) => setRecurrence(v as typeof recurrence)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECURRENCE.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r === "none" ? "Doesn't repeat" : r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Estimate (min)</Label>
              <Input type="number" min={1} max={1440} value={estimatedMin} onChange={(e) => setEstimatedMin(e.target.value)} placeholder="30" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={visibility === "shared"} onCheckedChange={(v) => setVisibility(v ? "shared" : "private")} />
              Shared with partner
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={proofRequired} onCheckedChange={setProofRequired} />
              Require photo proof
            </label>
            {partnerId && (
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={assignee === "partner"} onCheckedChange={(v) => { setAssignee(v ? "partner" : "me"); if (v) setVisibility("shared"); }} />
                Assign to partner
              </label>
            )}
          </div>
          <Button type="submit" disabled={create.isPending || !title.trim()} className="btn-brand h-12 w-full rounded-full">
            {create.isPending ? "Adding…" : "Add task"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProofDialog({
  task,
  onDone,
  onSkip,
}: {
  task: TaskRow | null;
  onDone: (key: string | null) => void;
  onSkip: () => void;
}) {
  const upload = trpc.storage.upload.useMutation();
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const base64 = await fileToCompressedBase64(file);
      const res = await upload.mutateAsync({
        name: file.name || "proof.jpg",
        contentBase64: base64,
        contentType: "image/jpeg",
        purpose: "task_proof",
      });
      onDone(res.key);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload the image.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!task} onOpenChange={(v) => !v && onSkip()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add proof?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          A photo marks “{task?.title}” as done. Only you two can see it.
        </p>
        <div className="mt-4 grid gap-2">
          <label className="btn-brand flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full text-sm font-medium">
            <Camera className="h-4 w-4" />
            {busy ? "Uploading…" : "Camera / Upload"}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
              }}
            />
          </label>
          <Button variant="outline" onClick={onSkip} className="h-12 rounded-full">
            <X className="mr-1.5 h-4 w-4" /> Skip
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
