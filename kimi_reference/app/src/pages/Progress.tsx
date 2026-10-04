import { useEffect, useMemo, useState } from "react";
import { useAccent } from "@/providers/theme";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SectionTitle, EmptyState, Stat } from "@/components/widgets";
import { TrendingUp, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid,
} from "recharts";

const RANGES = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "3m", label: "3 months", days: 90 },
  { id: "6m", label: "6 months", days: 180 },
  { id: "1y", label: "1 year", days: 365 },
] as const;

export default function Progress() {
  const [range, setRange] = useState<(typeof RANGES)[number]["id"]>("30d");
  const { accent } = useAccent();
  const [brandColor, setBrandColor] = useState("#C05B3C");
  useEffect(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue("--brand").trim();
    if (v) setBrandColor(`hsl(${v})`);
  }, [accent]);
  const days = RANGES.find((r) => r.id === range)!.days;
  const { data } = trpc.progress.overview.useQuery({ days });
  const insights = trpc.ai.insights.useMutation();

  const chartData = useMemo(
    () =>
      (data?.perDay ?? []).map((d) => ({
        ...d,
        label: d.date.slice(5),
        waterL: Math.round((d.waterMl / 1000) * 10) / 10,
        sleepH: Math.round(((d.sleepMin ?? 0) / 60) * 10) / 10,
        studyH: Math.round((d.studyMin / 60) * 10) / 10,
      })),
    [data],
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow eyebrow-accent">Progress</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
            Look how far <em className="display-italic-accent">you've come.</em>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Trends, not scores — a life is more than a number.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((r) => (
            <Button
              key={r.id}
              size="sm"
              variant={range === r.id ? "default" : "outline"}
              className={range === r.id ? "btn-brand" : ""}
              onClick={() => setRange(r.id)}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </header>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4"><Stat label="Tasks done" value={data?.totals.tasksDone ?? "—"} /></Card>
        <Card className="p-4"><Stat label="Focus hours" value={data ? Math.round((data.totals.studyMin / 60) * 10) / 10 : "—"} /></Card>
        <Card className="p-4"><Stat label="Workouts" value={data?.totals.workouts ?? "—"} /></Card>
        <Card className="p-4"><Stat label="Habit consistency" value={data?.totals.habitConsistency != null ? `${data.totals.habitConsistency}%` : "—"} /></Card>
      </div>

      {/* Becoming better */}
      {data?.growth && (
        <Card className="mb-6 p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-brand" />
            <h2 className="font-display text-lg font-semibold">Becoming better</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Comparing the first half of this period with the second half.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ["Focus", data.growth.study],
              ["Workouts", data.growth.workouts],
              ["Tasks", data.growth.tasks],
              ["Sleep", data.growth.sleep],
            ] as const).map(([label, delta]) => (
              <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`font-display text-xl font-semibold ${delta >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {delta >= 0 ? "+" : ""}
                  {delta}%
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Charts */}
      {chartData.length === 0 ? (
        <EmptyState
          title="Nothing to chart yet"
          body="Complete tasks, log focus sessions and track your days — your trends will bloom here."
        />
      ) : (
        <div className="space-y-4">
          <Card className="p-5">
            <SectionTitle eyebrow="Momentum" title="Tasks completed" />
            <div className="mt-3 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ left: -24, right: 4, top: 4 }}>
                  <defs>
                    <linearGradient id="gTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={brandColor} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={brandColor} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,120,105,0.18)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="rgba(130,120,105,0.55)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(130,120,105,0.55)" allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="tasksDone" stroke={brandColor} strokeWidth={2} fill="url(#gTasks)" name="Tasks" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <SectionTitle eyebrow="Focus" title="Study hours" />
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ left: -28, right: 4, top: 4 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="rgba(130,120,105,0.55)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="rgba(130,120,105,0.55)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                    <Bar dataKey="studyH" fill={brandColor} radius={[4, 4, 0, 0]} name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card className="p-5">
              <SectionTitle eyebrow="Rest" title="Sleep hours" />
              <div className="mt-3 h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: -24, right: 4, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,120,105,0.18)" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="rgba(130,120,105,0.55)" />
                    <YAxis tick={{ fontSize: 10 }} stroke="rgba(130,120,105,0.55)" domain={[0, 12]} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="sleepH" stroke="#7a8b5a" strokeWidth={2} fill="#7a8b5a22" name="Hours" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <SectionTitle eyebrow="Care" title="Water (litres)" />
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -28, right: 4, top: 4 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" stroke="rgba(130,120,105,0.55)" />
                  <YAxis tick={{ fontSize: 10 }} stroke="rgba(130,120,105,0.55)" />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                  <Bar dataKey="waterL" fill="#4f7a8b" radius={[4, 4, 0, 0]} name="Litres" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* AI insights */}
      <Card className="mt-6 p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold">Gentle insights</h2>
            <p className="text-xs text-muted-foreground">Patterns from your own data — never judgement.</p>
          </div>
          <Button
            className="btn-brand"
            disabled={insights.isPending}
            onClick={() => insights.mutate()}
          >
            <Sparkles className="mr-1.5 h-4 w-4" />
            {insights.isPending ? "Thinking…" : "Generate"}
          </Button>
        </div>
        {insights.isError && (
          <p className="mt-3 text-sm text-destructive">
            {insights.error.message.includes("AI_UNAVAILABLE")
              ? "AI 额度已用完，此功能暂不可用，请网站管理员在 Kimi 充值。"
              : "AI 正忙，请稍后再试。"}
          </p>
        )}
        {insights.data && (
          <div className="prose-sm mt-4 whitespace-pre-wrap text-sm leading-relaxed">{insights.data.text}</div>
        )}
      </Card>
    </div>
  );
}