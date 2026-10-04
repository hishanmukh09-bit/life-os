import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { BookOpen, Pause, Play, Plus, Square, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { daysUntil, formatMin, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function StudyPage() {
  const [params, setParams] = useSearchParams();
  const { data, refetch } = trpc.study.dashboard.useQuery();
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  useEffect(() => {
    const n = params.get("new");
    if (n === "session") setSessionOpen(true);
    if (n) setParams({}, { replace: true });
  }, [params, setParams]);

  const today = todayStr();
  const sessions = data?.sessions ?? [];
  const todayMin = sessions.filter((s) => s.date === today).reduce((sum, s) => sum + s.durationMin, 0);
  const weekMin = sessions
    .filter((s) => s.date >= new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.durationMin, 0);
  const upcomingExams = (data?.exams ?? []).filter((e) => e.date >= today);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Study</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Deep work</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSubjectOpen(true)} className="rounded-full min-h-[44px]">
            <Plus className="mr-1.5 h-4 w-4" /> Subject
          </Button>
          <Button variant="outline" onClick={() => setExamOpen(true)} className="rounded-full min-h-[44px]">
            <Plus className="mr-1.5 h-4 w-4" /> Exam
          </Button>
          <Button onClick={() => setSessionOpen(true)} className="btn-brand rounded-full min-h-[44px]">
            <Plus className="mr-1.5 h-4 w-4" /> Log session
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="eyebrow">Today</p>
          <p className="font-display mt-1 text-2xl font-medium">{formatMin(todayMin)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="eyebrow">This week</p>
          <p className="font-display mt-1 text-2xl font-medium">{formatMin(weekMin)}</p>
        </div>
      </div>

      <FocusTimer subjects={data?.subjects ?? []} onDone={() => refetch()} />

      {/* Subjects */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionTitle>Subjects</SectionTitle>
        {(data?.subjects ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Add your subjects to organize study time.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(data?.subjects ?? []).map((s) => {
              const mins = sessions.filter((x) => x.subjectId === s.id).reduce((sum, x) => sum + x.durationMin, 0);
              return <SubjectChip key={s.id} id={s.id} name={s.name} mins={mins} />;
            })}
          </div>
        )}
      </section>

      {/* Exams */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionTitle>Exams & revision</SectionTitle>
        {upcomingExams.length === 0 ? (
          <EmptyState title="No exams scheduled" hint="Add an exam with topics to get a revision countdown." />
        ) : (
          <div className="space-y-4">
            {upcomingExams.map((e) => (
              <ExamCard key={e.id} exam={e} />
            ))}
          </div>
        )}
      </section>

      {/* Recent sessions */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionTitle>Recent sessions</SectionTitle>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No study sessions yet. Start the focus timer above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {[...sessions].reverse().slice(0, 8).map((s) => (
              <SessionRow key={s.id} session={s} subjects={data?.subjects ?? []} />
            ))}
          </ul>
        )}
      </section>

      <SubjectDialog open={subjectOpen} onClose={() => setSubjectOpen(false)} />
      <SessionDialog open={sessionOpen} onClose={() => setSessionOpen(false)} subjects={data?.subjects ?? []} />
      <ExamDialog open={examOpen} onClose={() => setExamOpen(false)} />
    </div>
  );
}

function SubjectChip({ id, name, mins }: { id: number; name: string; mins: number }) {
  const utils = trpc.useUtils();
  const del = trpc.study.deleteSubject.useMutation({
    onSuccess: () => utils.study.dashboard.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  return (
    <span className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-2 text-sm min-h-[44px]">
      <BookOpen className="h-3.5 w-3.5 text-brand" />
      {name}
      <span className="text-xs text-muted-foreground">{formatMin(mins)}</span>
      <button onClick={() => del.mutate({ id })} aria-label={`Delete ${name}`} className="text-muted-foreground hover:text-[hsl(var(--destructive))]">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function SessionRow({ session: s, subjects }: { session: { id: number; date: string; durationMin: number; subjectId: number | null; notes: string | null }; subjects: { id: number; name: string }[] }) {
  const utils = trpc.useUtils();
  const del = trpc.study.deleteSession.useMutation({
    onSuccess: () => utils.study.dashboard.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const subject = subjects.find((x) => x.id === s.subjectId);
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">{s.date}</span>
      <span className="min-w-0 flex-1 truncate text-sm">
        {subject?.name ?? "General study"}
        {s.notes ? <span className="text-muted-foreground"> · {s.notes}</span> : null}
      </span>
      <Chip tone="brand">{formatMin(s.durationMin)}</Chip>
      <button onClick={() => del.mutate({ id: s.id })} aria-label="Delete session" className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-[hsl(var(--destructive))]">
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

function ExamCard({ exam: e }: { exam: { id: number; title: string; subject: string | null; date: string; difficulty: number | null; topics: { id: number; name: string; progress: number }[] } }) {
  const utils = trpc.useUtils();
  const setProgress = trpc.study.setTopicProgress.useMutation({
    onSuccess: () => utils.study.dashboard.invalidate(),
    onError: (er) => toast.error(er.message),
  });
  const del = trpc.study.deleteExam.useMutation({
    onSuccess: () => utils.study.dashboard.invalidate(),
    onError: (er) => toast.error(er.message),
  });
  const days = daysUntil(e.date);
  const avg = e.topics.length ? Math.round(e.topics.reduce((s, t) => s + t.progress, 0) / e.topics.length) : 0;
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-medium">{e.title}</p>
          <p className="text-xs text-muted-foreground">
            {e.subject ?? "—"} · {e.date}
            {e.difficulty ? ` · difficulty ${e.difficulty}/5` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Chip tone={days <= 3 ? "danger" : days <= 7 ? "warning" : "brand"}>
            {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} left`}
          </Chip>
          <button onClick={() => del.mutate({ id: e.id })} aria-label="Delete exam" className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-[hsl(var(--destructive))]">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {e.topics.length > 0 && (
        <>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-[hsl(var(--brand))] transition-all" style={{ width: `${avg}%` }} />
          </div>
          <ul className="mt-3 space-y-2.5">
            {e.topics.map((t) => (
              <li key={t.id} className="flex items-center gap-3">
                <span className={cn("min-w-0 flex-1 truncate text-sm", t.progress === 100 && "text-muted-foreground line-through")}>
                  {t.name}
                </span>
                <span className="w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">{t.progress}%</span>
                <Slider
                  value={[t.progress]}
                  onValueChange={([v]) => setProgress.mutate({ topicId: t.id, progress: v })}
                  min={0}
                  max={100}
                  step={10}
                  className="w-28"
                  aria-label={`Progress for ${t.name}`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const FOCUS_PRESETS = [25, 50, 90];

function FocusTimer({ subjects, onDone }: { subjects: { id: number; name: string }[]; onDone: () => void }) {
  const [duration, setDuration] = useState(25);
  const [custom, setCustom] = useState("45");
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logSession = trpc.study.logSession.useMutation();

  useEffect(() => {
    if (running && secondsLeft !== null) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => (s !== null && s > 0 ? s - 1 : 0));
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, secondsLeft !== null]);

  useEffect(() => {
    if (secondsLeft === 0 && running) {
      setRunning(false);
      logSession.mutate(
        { durationMin: duration, subjectId, notes: "Focus session" },
        {
          onSuccess: () => {
            toast.success(`${duration} minutes logged. Well done.`);
            onDone();
          },
          onError: (e) => toast.error(e.message),
        },
      );
      setSecondsLeft(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const start = () => {
    setSecondsLeft(duration * 60);
    setRunning(true);
  };
  const stop = () => {
    setRunning(false);
    if (secondsLeft !== null) {
      const elapsed = Math.max(1, Math.round((duration * 60 - secondsLeft) / 60));
      if (elapsed >= 1) {
        logSession.mutate(
          { durationMin: elapsed, subjectId, notes: "Focus session (ended early)" },
          {
            onSuccess: () => {
              toast.success(`${elapsed} minutes logged.`);
              onDone();
            },
            onError: (e) => toast.error(e.message),
          },
        );
      }
    }
    setSecondsLeft(null);
  };

  const mm = secondsLeft !== null ? Math.floor(secondsLeft / 60) : duration;
  const ss = secondsLeft !== null ? secondsLeft % 60 : 0;
  const progress = secondsLeft !== null ? 1 - secondsLeft / (duration * 60) : 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle>Focus timer</SectionTitle>
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <svg width="160" height="160" className="-rotate-90">
            <circle cx="80" cy="80" r="72" fill="none" strokeWidth="8" style={{ stroke: "hsl(var(--muted))" }} />
            <circle
              cx="80" cy="80" r="72" fill="none"
              strokeWidth="8" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 72}
              strokeDashoffset={2 * Math.PI * 72 * (1 - progress)}
              style={{ stroke: "hsl(var(--brand))", transition: "stroke-dashoffset 500ms linear" }}
            />
          </svg>
          <span className="absolute font-display text-4xl font-medium tabular-nums">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </span>
        </div>
        {secondsLeft === null ? (
          <>
            <div className="flex flex-wrap justify-center gap-2">
              {FOCUS_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => setDuration(p)}
                  className={cn(
                    "min-h-[44px] rounded-full border px-4 text-sm font-medium",
                    duration === p ? "border-[hsl(var(--brand))] bg-brand-soft text-brand-ink" : "border-border hover:bg-secondary",
                  )}
                >
                  {p} min
                </button>
              ))}
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  value={custom}
                  min={5}
                  max={240}
                  onChange={(e) => setCustom(e.target.value)}
                  className="h-11 w-20 rounded-full text-center"
                  aria-label="Custom minutes"
                />
                <Button variant="outline" className="rounded-full h-11" onClick={() => setDuration(Math.max(5, Math.min(240, parseInt(custom) || 45)))}>
                  Set
                </Button>
              </div>
            </div>
            {subjects.length > 0 && (
              <Select value={subjectId?.toString() ?? "none"} onValueChange={(v) => setSubjectId(v === "none" ? null : parseInt(v))}>
                <SelectTrigger className="h-11 w-56 rounded-full"><SelectValue placeholder="Subject (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No subject</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button onClick={start} className="btn-brand h-12 rounded-full px-8">
              <Play className="mr-1.5 h-4 w-4" /> Start focus
            </Button>
          </>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRunning((r) => !r)} className="h-12 rounded-full px-6">
              {running ? <><Pause className="mr-1.5 h-4 w-4" /> Pause</> : <><Play className="mr-1.5 h-4 w-4" /> Resume</>}
            </Button>
            <Button variant="outline" onClick={stop} className="h-12 rounded-full px-6">
              <Square className="mr-1.5 h-4 w-4" /> End & log
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

function SubjectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("300");
  const add = trpc.study.addSubject.useMutation({
    onSuccess: () => {
      utils.study.dashboard.invalidate();
      toast.success("Subject added.");
      setName("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader><DialogTitle className="font-display text-2xl">New subject</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (name.trim()) add.mutate({ name: name.trim(), targetMinWeekly: parseInt(target) || 300 }); }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Robotics Dynamics" className="h-12 rounded-xl" autoFocus />
          <div>
            <Label className="eyebrow mb-1.5 block">Weekly target (minutes)</Label>
            <Input type="number" min={0} value={target} onChange={(e) => setTarget(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <Button type="submit" disabled={add.isPending || !name.trim()} className="btn-brand h-12 w-full rounded-full">Add subject</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionDialog({ open, onClose, subjects }: { open: boolean; onClose: () => void; subjects: { id: number; name: string }[] }) {
  const utils = trpc.useUtils();
  const [minutes, setMinutes] = useState("60");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [notes, setNotes] = useState("");
  const add = trpc.study.logSession.useMutation({
    onSuccess: () => {
      utils.study.dashboard.invalidate();
      toast.success("Session logged.");
      setNotes("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader><DialogTitle className="font-display text-2xl">Log study session</DialogTitle></DialogHeader>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); add.mutate({ durationMin: parseInt(minutes) || 25, subjectId: subjectId === "none" ? null : parseInt(subjectId), notes: notes || null }); }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Minutes</Label>
              <Input type="number" min={1} max={1440} value={minutes} onChange={(e) => setMinutes(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Subject</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What did you work on?" className="h-11 rounded-xl" />
          <Button type="submit" disabled={add.isPending} className="btn-brand h-12 w-full rounded-full">Log session</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExamDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [date, setDate] = useState(todayStr());
  const [difficulty, setDifficulty] = useState(3);
  const [topics, setTopics] = useState("");
  const add = trpc.study.addExam.useMutation({
    onSuccess: () => {
      utils.study.dashboard.invalidate();
      toast.success("Exam added.");
      setTitle(""); setSubject(""); setTopics("");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader><DialogTitle className="font-display text-2xl">New exam</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            add.mutate({
              title: title.trim(),
              subject: subject || null,
              date,
              difficulty,
              topics: topics.split("\n").map((t) => t.trim()).filter(Boolean),
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" className="h-12 rounded-xl" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" className="h-11 rounded-xl" />
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Difficulty: {difficulty}/5</Label>
            <Slider value={[difficulty]} onValueChange={([v]) => setDifficulty(v)} min={1} max={5} step={1} />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Topics (one per line)</Label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              rows={4}
              placeholder={"Euler-Lagrange\nNewton-Euler\nInertia Tensor"}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={add.isPending || !title.trim()} className="btn-brand h-12 w-full rounded-full">Add exam</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
