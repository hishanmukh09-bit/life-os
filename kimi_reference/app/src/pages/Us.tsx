import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, HeartHandshake, Plus, Send, ShoppingCart, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, Chip } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMin } from "@/lib/date";
import { cn } from "@/lib/utils";

const QUICK_MESSAGES = [
  "You've got this.",
  "Take a break.",
  "One task at a time.",
  "I'm proud of you.",
  "Need help?",
];

const HELP_CATEGORIES = [
  { id: "study", label: "Study" },
  { id: "workout", label: "Workout" },
  { id: "productivity", label: "Productivity" },
  { id: "technical", label: "Technical" },
  { id: "time_management", label: "Time management" },
  { id: "overwhelmed", label: "Feeling overwhelmed" },
  { id: "food", label: "Food" },
  { id: "just_need_someone", label: "Just need someone" },
] as const;

export default function UsPage() {
  const { data: space } = trpc.space.get.useQuery();
  const { data: status } = trpc.social.partnerStatus.useQuery(undefined, { refetchInterval: 45_000 });
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow-accent">Me · You · Us</p>
        <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">
          {space?.partner
            ? `You & ${space.partner.displayName || space.partner.name || "your person"}`
            : "Your space for two"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Accountability that feels like support — never surveillance.
        </p>
      </div>

      {!space?.partner ? (
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-display text-xl">Invite your person</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Share this code. Once they join, the space closes — it's only ever
            the two of you.
          </p>
          <div className="mx-auto mt-5 flex max-w-xs items-center gap-2">
            <code className="flex-1 rounded-xl bg-secondary px-4 py-3 font-mono tracking-widest">
              {space?.space.inviteCode ?? "…"}
            </code>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl"
              aria-label="Copy invite code"
              onClick={() => {
                if (space?.space.inviteCode) {
                  navigator.clipboard.writeText(space.space.inviteCode).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }
              }}
            >
              {copied ? <Check className="h-4 w-4 text-[hsl(var(--success))]" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </section>
      ) : (
        <>
          {/* CHECK ON THEM */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <SectionTitle>Check on them</SectionTitle>
            {!status?.checkin && (status?.tasks?.total ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing shared yet today. When they share a check-in or tasks,
                you'll see them here.
              </p>
            ) : (
              <div className="space-y-3">
                {status?.checkin && (
                  <div className="flex flex-wrap gap-2">
                    <Chip tone="brand">Mood: {status.checkin.mood}</Chip>
                    <Chip>Energy {status.checkin.energy}/10</Chip>
                    <Chip>Stress {status.checkin.stress}/10</Chip>
                    {status.checkin.need && <Chip tone="warning">Needs: {status.checkin.need}</Chip>}
                  </div>
                )}
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <span>Tasks: <span className="font-medium text-foreground">{status?.tasks?.done ?? 0}/{status?.tasks?.total ?? 0}</span></span>
                  <span>Workout: <span className="font-medium text-foreground">{status?.workoutLogged ? "logged" : "not yet"}</span></span>
                  {status?.sleep?.durationMin != null && (
                    <span>Sleep: <span className="font-medium text-foreground">{formatMin(status.sleep.durationMin)}</span></span>
                  )}
                </div>
              </div>
            )}
            <EncouragementRow />
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <INeedHelp />
            <Inbox />
          </div>
        </>
      )}

      <ShoppingListCard />
    </div>
  );
}

function EncouragementRow() {
  const [custom, setCustom] = useState("");
  const utils = trpc.useUtils();
  const send = trpc.social.sendEncouragement.useMutation({
    onSuccess: () => {
      toast.success("Encouragement sent.");
      utils.social.inbox.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="eyebrow mb-2">Send encouragement</p>
      <div className="flex flex-wrap gap-2">
        {QUICK_MESSAGES.map((m) => (
          <button
            key={m}
            onClick={() => send.mutate({ message: m })}
            disabled={send.isPending}
            className="min-h-[44px] rounded-full border border-border px-4 text-sm transition-colors hover:bg-brand-soft hover:text-brand-ink"
          >
            {m}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (custom.trim()) {
            send.mutate({ message: custom.trim() });
            setCustom("");
          }
        }}
      >
        <Input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Write your own…"
          className="h-11 rounded-full"
          maxLength={500}
        />
        <Button type="submit" size="icon" disabled={send.isPending || !custom.trim()} className="btn-brand h-11 w-11 shrink-0 rounded-full" aria-label="Send">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function INeedHelp() {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const utils = trpc.useUtils();
  const ask = trpc.social.iNeedHelp.useMutation({
    onSuccess: () => {
      toast.success("Your person has been notified.");
      setSelected(null);
      setMessage("");
      utils.social.inbox.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle>I need help</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {HELP_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelected(c.id)}
            className={cn(
              "min-h-[44px] rounded-full border px-4 text-sm transition-colors",
              selected === c.id ? "border-[hsl(var(--brand))] bg-brand-soft text-brand-ink" : "border-border hover:bg-secondary",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>
      {selected && (
        <form
          className="mt-3 space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            ask.mutate({ category: selected as never, message: message || null });
          }}
        >
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note (optional)"
            className="h-11 rounded-xl"
            maxLength={500}
          />
          <Button type="submit" disabled={ask.isPending} className="btn-brand h-11 w-full rounded-full">
            <HeartHandshake className="mr-1.5 h-4 w-4" />
            {ask.isPending ? "Sending…" : "Ask for help"}
          </Button>
        </form>
      )}
    </section>
  );
}

function Inbox() {
  const { data: inbox } = trpc.social.inbox.useQuery(undefined, { refetchInterval: 45_000 });
  const utils = trpc.useUtils();
  const markRead = trpc.social.markRead.useMutation({
    onSuccess: () => utils.social.inbox.invalidate(),
  });
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle>Between you two</SectionTitle>
      {(inbox ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Encouragement and help requests will appear here.
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto">
          {(inbox ?? []).map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-xl border p-3",
                m.incoming && !m.read ? "border-[hsl(var(--brand)/0.4)] bg-brand-soft/40" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm">
                    {m.kind === "help_request" ? "🤝 " : ""}
                    {m.message}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.incoming ? "From your person" : "You sent this"} ·{" "}
                    {new Date(m.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </p>
                </div>
                {m.incoming && !m.read && (
                  <button
                    onClick={() => markRead.mutate({ id: m.id })}
                    className="text-xs text-brand hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ShoppingListCard() {
  const { data: items } = trpc.misc.shoppingList.useQuery(undefined, { refetchInterval: 30_000 });
  const [name, setName] = useState("");
  const utils = trpc.useUtils();
  const add = trpc.misc.shoppingAdd.useMutation({
    onSuccess: () => {
      utils.misc.shoppingList.invalidate();
      setName("");
    },
    onError: (e) => toast.error(e.message),
  });
  const toggle = trpc.misc.shoppingToggle.useMutation({
    onSuccess: () => utils.misc.shoppingList.invalidate(),
  });
  const del = trpc.misc.shoppingDelete.useMutation({
    onSuccess: () => utils.misc.shoppingList.invalidate(),
  });

  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle>
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-3.5 w-3.5" /> Shared shopping list
        </span>
      </SectionTitle>
      <form
        className="mb-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) add.mutate({ name: name.trim() });
        }}
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Milk, eggs, notebook…"
          className="h-11 rounded-full"
          maxLength={200}
        />
        <Button type="submit" size="icon" disabled={add.isPending || !name.trim()} className="btn-brand h-11 w-11 shrink-0 rounded-full" aria-label="Add item">
          <Plus className="h-4 w-4" />
        </Button>
      </form>
      {(items ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to buy. Both of you can add and check items.</p>
      ) : (
        <ul className="divide-y divide-border">
          {(items ?? []).map((i) => (
            <li key={i.id} className="flex items-center gap-3 py-2">
              <button
                onClick={() => toggle.mutate({ id: i.id, done: !i.done })}
                aria-label={i.done ? `Uncheck ${i.name}` : `Check ${i.name}`}
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors",
                  i.done ? "border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white" : "border-border hover:border-[hsl(var(--brand))]",
                )}
              >
                {i.done && <Check className="h-4 w-4" />}
              </button>
              <span className={cn("flex-1 text-sm", i.done && "text-muted-foreground line-through")}>{i.name}</span>
              <button onClick={() => del.mutate({ id: i.id })} aria-label={`Remove ${i.name}`} className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-[hsl(var(--destructive))]">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
