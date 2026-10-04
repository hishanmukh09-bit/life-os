import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Droplets, HeartHandshake, Plus } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, Chip } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatMin, todayStr } from "@/lib/date";
import { cn } from "@/lib/utils";

const MOODS = ["great", "good", "okay", "low", "tired"] as const;

export default function TrackPage() {
  const [params, setParams] = useSearchParams();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [cycleOpen, setCycleOpen] = useState(false);
  const newParam = params.get("new");

  useEffect(() => {
    if (newParam === "sleep") setSleepOpen(true);
    if (newParam === "checkin") setCheckinOpen(true);
    if (newParam) setParams({}, { replace: true });
  }, [newParam, setParams]);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow-accent">Track</p>
        <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Body & mind</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <WaterCard />
        <SleepCard onLog={() => setSleepOpen(true)} />
      </div>

      <CheckinCard onOpen={() => setCheckinOpen(true)} />
      <CycleCard onAdd={() => setCycleOpen(true)} />

      <SleepDialog open={sleepOpen} onClose={() => setSleepOpen(false)} />
      <CheckinDialog open={checkinOpen} onClose={() => setCheckinOpen(false)} />
      <CycleDialog open={cycleOpen} onClose={() => setCycleOpen(false)} />
    </div>
  );
}

function WaterCard() {
  const { data: today } = trpc.tracker.waterToday.useQuery();
  const { data: week } = trpc.tracker.waterWeek.useQuery();
  const { data: profile } = trpc.profile.me.useQuery();
  const utils = trpc.useUtils();
  const add = trpc.tracker.addWater.useMutation({
    onSuccess: () => {
      utils.tracker.waterToday.invalidate();
      utils.tracker.waterWeek.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  const target = profile?.waterTargetMl ?? 2500;
  const total = today?.total ?? 0;
  const pct = Math.min(100, Math.round((total / target) * 100));
  const maxWeek = Math.max(target, ...(week ?? []).map((d) => d.amountMl));

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle right={<Droplets className="h-4 w-4 text-brand" />}>Water</SectionTitle>
      <div className="flex items-end justify-between">
        <p className="font-display text-3xl font-medium">
          {(total / 1000).toFixed(2)}L
          <span className="ml-2 text-base font-normal text-muted-foreground">/ {(target / 1000).toFixed(1)}L</span>
        </p>
        <Chip tone={pct >= 100 ? "success" : "brand"}>{pct}%</Chip>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-[hsl(var(--brand))] transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-4 flex gap-2">
        {[250, 500].map((a) => (
          <button
            key={a}
            onClick={() => add.mutate({ amountMl: a })}
            disabled={add.isPending}
            className="min-h-[44px] flex-1 rounded-full border border-border text-sm font-medium transition-colors hover:bg-brand-soft hover:text-brand-ink"
          >
            +{a} ml
          </button>
        ))}
        <CustomWater onAdd={(ml) => add.mutate({ amountMl: ml })} />
      </div>
      {/* Week bars */}
      <div className="mt-5 flex h-20 items-end gap-1.5">
        {(week ?? []).map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn("w-full rounded-md", d.date === todayStr() ? "bg-[hsl(var(--brand))]" : "bg-secondary")}
              style={{ height: `${Math.max(4, (d.amountMl / maxWeek) * 72)}px` }}
              title={`${d.date}: ${d.amountMl} ml`}
            />
            <span className="text-[10px] text-muted-foreground">{d.date.slice(8)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CustomWater({ onAdd }: { onAdd: (ml: number) => void }) {
  const [val, setVal] = useState("");
  return (
    <form
      className="flex flex-1 gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        const ml = parseInt(val);
        if (ml > 0 && ml <= 3000) {
          onAdd(ml);
          setVal("");
        }
      }}
    >
      <Input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Custom"
        className="h-11 rounded-full text-center text-sm"
        min={1}
        max={3000}
        aria-label="Custom water amount in ml"
      />
    </form>
  );
}

function SleepCard({ onLog }: { onLog: () => void }) {
  const { data: sleep } = trpc.tracker.sleepList.useQuery({ days: 7 });
  const { data: profile } = trpc.profile.me.useQuery();
  const target = profile?.sleepTargetMin ?? 480;
  const last = sleep?.[sleep.length - 1];
  const avg = sleep && sleep.length
    ? Math.round(sleep.reduce((s, r) => s + (r.durationMin ?? 0), 0) / sleep.length)
    : null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle
        right={
          <Button variant="outline" size="sm" onClick={onLog} className="rounded-full min-h-[36px]">
            <Plus className="mr-1 h-3.5 w-3.5" /> Log sleep
          </Button>
        }
      >
        Sleep
      </SectionTitle>
      <div className="flex items-end justify-between">
        <p className="font-display text-3xl font-medium">
          {last?.durationMin ? formatMin(last.durationMin) : "—"}
          <span className="ml-2 text-base font-normal text-muted-foreground">last night</span>
        </p>
        {avg != null && (
          <Chip tone={avg >= target ? "success" : "warning"}>avg {formatMin(avg)}</Chip>
        )}
      </div>
      <div className="mt-5 flex h-20 items-end gap-1.5">
        {(sleep ?? []).map((s) => (
          <div key={s.id} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "w-full rounded-md",
                (s.durationMin ?? 0) >= target ? "bg-[hsl(var(--success)/0.7)]" : "bg-[hsl(var(--brand)/0.6)]",
              )}
              style={{ height: `${Math.max(4, ((s.durationMin ?? 0) / 600) * 72)}px` }}
              title={`${s.date}: ${formatMin(s.durationMin)}${s.quality ? `, quality ${s.quality}/5` : ""}`}
            />
            <span className="text-[10px] text-muted-foreground">{s.date.slice(8)}</span>
          </div>
        ))}
        {(sleep ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Log your first night to start seeing patterns.</p>
        )}
      </div>
    </section>
  );
}

function SleepDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [bedtime, setBedtime] = useState("23:00");
  const [wakeTime, setWakeTime] = useState("07:00");
  const [quality, setQuality] = useState(4);
  const [notes, setNotes] = useState("");
  const [shared, setShared] = useState(true);
  const utils = trpc.useUtils();
  const log = trpc.tracker.logSleep.useMutation({
    onSuccess: () => {
      utils.tracker.sleepList.invalidate();
      toast.success("Sleep logged.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Log sleep</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            log.mutate({
              bedtime,
              wakeTime,
              quality,
              notes: notes || null,
              visibility: shared ? "shared" : "private",
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Bedtime</Label>
              <Input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Wake time</Label>
              <Input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Quality: {quality}/5</Label>
            <Slider value={[quality]} onValueChange={([v]) => setQuality(v)} min={1} max={5} step={1} />
          </div>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-11 rounded-xl" />
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Share duration with partner
          </label>
          <Button type="submit" disabled={log.isPending} className="btn-brand h-12 w-full rounded-full">
            {log.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckinCard({ onOpen }: { onOpen: () => void }) {
  const { data: checkin } = trpc.tracker.checkinGet.useQuery();
  const { data: history } = trpc.tracker.checkinHistory.useQuery({ days: 14 });
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle
        right={
          <Button variant="outline" size="sm" onClick={onOpen} className="rounded-full min-h-[36px]">
            <HeartHandshake className="mr-1 h-3.5 w-3.5" />
            {checkin ? "Update check-in" : "Check in"}
          </Button>
        }
      >
        Daily check-in
      </SectionTitle>
      {checkin ? (
        <div className="flex flex-wrap items-center gap-2 py-1">
          <Chip tone="brand">Mood: {checkin.mood}</Chip>
          <Chip>Energy {checkin.energy}/10</Chip>
          <Chip>Stress {checkin.stress}/10</Chip>
          {checkin.mainGoal && <Chip tone="info">Goal: {checkin.mainGoal}</Chip>}
          <Chip tone={checkin.visibility === "shared" ? "success" : "neutral"}>
            {checkin.visibility === "shared" ? "shared" : "private"}
          </Chip>
        </div>
      ) : (
        <p className="py-1 text-sm text-muted-foreground">
          How are you arriving today? Thirty seconds, once a day.
        </p>
      )}
      {(history ?? []).length > 1 && (
        <div className="mt-4">
          <p className="eyebrow mb-2">Energy, last 14 days</p>
          <div className="flex h-14 items-end gap-1">
            {(history ?? []).map((h) => (
              <div
                key={h.id}
                className="flex-1 rounded-md bg-[hsl(var(--brand)/0.55)]"
                style={{ height: `${(h.energy / 10) * 52}px` }}
                title={`${h.date}: energy ${h.energy}, stress ${h.stress}`}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CheckinDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: existing } = trpc.tracker.checkinGet.useQuery();
  const [mood, setMood] = useState<(typeof MOODS)[number]>("good");
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(4);
  const [mainGoal, setMainGoal] = useState("");
  const [note, setNote] = useState("");
  const [need, setNeed] = useState("");
  const [shared, setShared] = useState(true);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (existing && open) {
      setMood(existing.mood);
      setEnergy(existing.energy);
      setStress(existing.stress);
      setMainGoal(existing.mainGoal ?? "");
      setNote(existing.note ?? "");
      setNeed(existing.need ?? "");
      setShared(existing.visibility === "shared");
    }
  }, [existing, open]);

  const save = trpc.tracker.checkinUpsert.useMutation({
    onSuccess: () => {
      utils.tracker.checkinGet.invalidate();
      utils.tracker.checkinHistory.invalidate();
      utils.social.partnerStatus.invalidate();
      toast.success("Checked in.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Daily check-in</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate({
              mood,
              energy,
              stress,
              mainGoal: mainGoal || null,
              note: note || null,
              need: need || null,
              visibility: shared ? "shared" : "private",
            });
          }}
        >
          <div>
            <Label className="eyebrow mb-2 block">Mood</Label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMood(m)}
                  className={cn(
                    "min-h-[44px] rounded-full border px-4 text-sm capitalize transition-colors",
                    mood === m ? "border-[hsl(var(--brand))] bg-brand-soft text-brand-ink" : "border-border hover:bg-secondary",
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Energy: {energy}/10</Label>
            <Slider value={[energy]} onValueChange={([v]) => setEnergy(v)} min={1} max={10} step={1} />
          </div>
          <div>
            <Label className="eyebrow mb-2 block">Stress: {stress}/10</Label>
            <Slider value={[stress]} onValueChange={([v]) => setStress(v)} min={1} max={10} step={1} />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">Main goal today</Label>
            <Input value={mainGoal} onChange={(e) => setMainGoal(e.target.value)} placeholder="One thing that matters" className="h-11 rounded-xl" />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">What happened today? (optional)</Label>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="rounded-xl" />
          </div>
          <div>
            <Label className="eyebrow mb-1.5 block">What do you need today? (optional)</Label>
            <Input value={need} onChange={(e) => setNeed(e.target.value)} placeholder="e.g. quiet, help with study…" className="h-11 rounded-xl" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Share with my partner
          </label>
          <Button type="submit" disabled={save.isPending} className="btn-brand h-12 w-full rounded-full">
            {save.isPending ? "Saving…" : "Save check-in"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CycleCard({ onAdd }: { onAdd: () => void }) {
  const { data: cycles } = trpc.tracker.cycleList.useQuery();
  const last = cycles?.[cycles.length - 1];
  let nextEstimate: string | null = null;
  if (last) {
    const d = new Date(last.startDate + "T00:00:00");
    d.setDate(d.getDate() + (last.cycleLength ?? 28));
    nextEstimate = d.toISOString().slice(0, 10);
  }
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle
        right={
          <Button variant="outline" size="sm" onClick={onAdd} className="rounded-full min-h-[36px]">
            <Plus className="mr-1 h-3.5 w-3.5" /> Log period
          </Button>
        }
      >
        Cycle <span className="normal-case tracking-normal">(optional · private by default)</span>
      </SectionTitle>
      {cycles?.length ? (
        <div className="space-y-1 py-1 text-sm">
          <p>
            Last period: <span className="font-medium">{last!.startDate}</span>
          </p>
          {nextEstimate && (
            <p className="text-muted-foreground">
              Next period: <span className="font-medium text-foreground">{nextEstimate}</span>{" "}
              <span className="text-xs">(estimated — never a certainty)</span>
            </p>
          )}
        </div>
      ) : (
        <p className="py-1 text-sm text-muted-foreground">
          Optional and private. Log a period start to see gentle estimates.
        </p>
      )}
    </section>
  );
}

function CycleDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [startDate, setStartDate] = useState(todayStr());
  const [cycleLength, setCycleLength] = useState("28");
  const [periodDuration, setPeriodDuration] = useState("5");
  const [symptoms, setSymptoms] = useState("");
  const utils = trpc.useUtils();
  const add = trpc.tracker.cycleAdd.useMutation({
    onSuccess: () => {
      utils.tracker.cycleList.invalidate();
      toast.success("Logged.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Log period</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate({
              startDate,
              cycleLength: parseInt(cycleLength) || 28,
              periodDuration: parseInt(periodDuration) || 5,
              symptoms: symptoms || null,
            });
          }}
        >
          <div>
            <Label className="eyebrow mb-1.5 block">Start date</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Cycle length</Label>
              <Input type="number" min={15} max={60} value={cycleLength} onChange={(e) => setCycleLength(e.target.value)} className="h-11 rounded-xl" />
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Period days</Label>
              <Input type="number" min={1} max={15} value={periodDuration} onChange={(e) => setPeriodDuration(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <Input value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Symptoms (optional)" className="h-11 rounded-xl" />
          <Button type="submit" disabled={add.isPending} className="btn-brand h-12 w-full rounded-full">
            {add.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
