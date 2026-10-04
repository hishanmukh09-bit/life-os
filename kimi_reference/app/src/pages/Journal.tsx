import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Lock, PenLine, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import type { RouterOutputs } from "@/lib/router-types";
import { Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { todayStr } from "@/lib/date";

const MOODS = ["great", "good", "okay", "low", "tired"] as const;
type Entry = RouterOutputs["journal"]["list"][number];

export default function JournalPage() {
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Entry | null>(null);
  const [open, setOpen] = useState(false);
  const { data: entries } = trpc.journal.list.useQuery();

  useEffect(() => {
    if (params.get("new") === "entry") {
      setEditing(null);
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const mine = (entries ?? []).filter((e) => e.mine);
  const shared = (entries ?? []).filter((e) => !e.mine);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Journal</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Your quiet page</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" /> Private by default. Share only what you choose.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="btn-brand rounded-full min-h-[44px]">
          <Plus className="mr-1.5 h-4 w-4" /> New entry
        </Button>
      </div>

      {mine.length === 0 ? (
        <EmptyState
          title="No entries yet"
          hint="What happened today? What did you learn? What are you grateful for?"
          action={<Button onClick={() => { setEditing(null); setOpen(true); }} variant="outline" className="rounded-full">Write your first entry</Button>}
        />
      ) : (
        <div className="space-y-3">
          {mine.map((e) => (
            <button
              key={e.id}
              onClick={() => { setEditing(e); setOpen(true); }}
              className="card-lift block w-full rounded-2xl border border-border bg-card p-5 text-left"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-display text-lg font-medium">
                  {e.title || "Untitled"}
                </p>
                <div className="flex items-center gap-2">
                  {e.mood && <Chip tone="brand">{e.mood}</Chip>}
                  <Chip tone={e.visibility === "shared" ? "success" : "neutral"}>
                    {e.visibility === "shared" ? "shared" : "private"}
                  </Chip>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.content}</p>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{e.date}</p>
            </button>
          ))}
        </div>
      )}

      {shared.length > 0 && (
        <section>
          <h2 className="eyebrow mb-3">Shared by your partner</h2>
          <div className="space-y-3">
            {shared.map((e) => (
              <div key={e.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg font-medium">{e.title || "Untitled"}</p>
                  {e.mood && <Chip tone="brand">{e.mood}</Chip>}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{e.content}</p>
                <p className="mt-2 font-mono text-xs text-muted-foreground">{e.date}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <EntryDialog open={open} onClose={() => setOpen(false)} entry={editing} />
    </div>
  );
}

function EntryDialog({ open, onClose, entry }: { open: boolean; onClose: () => void; entry: Entry | null }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("none");
  const [highlights, setHighlights] = useState("");
  const [lessons, setLessons] = useState("");
  const [gratitude, setGratitude] = useState("");
  const [shared, setShared] = useState(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (open) {
      setTitle(entry?.title ?? "");
      setContent(entry?.content ?? "");
      setMood(entry?.mood ?? "none");
      setHighlights(entry?.highlights ?? "");
      setLessons(entry?.lessons ?? "");
      setGratitude(entry?.gratitude ?? "");
      setShared(entry?.visibility === "shared");
    }
  }, [open, entry]);

  const save = trpc.journal.upsert.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      toast.success("Saved.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });
  const remove = trpc.journal.remove.useMutation({
    onSuccess: () => {
      utils.journal.list.invalidate();
      toast.success("Entry deleted.");
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-2xl">
            <PenLine className="h-5 w-5 text-brand" />
            {entry ? "Edit entry" : "New entry"}
          </DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!content.trim()) return;
            save.mutate({
              id: entry?.id ?? null,
              title: title || null,
              content: content.trim(),
              mood: mood === "none" ? null : (mood as (typeof MOODS)[number]),
              highlights: highlights || null,
              lessons: lessons || null,
              gratitude: gratitude || null,
              visibility: shared ? "shared" : "private",
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`${todayStr()} — give today a title`} className="h-12 rounded-xl" />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What happened today?"
            rows={6}
            className="rounded-xl"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {MOODS.map((m) => (
                    <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Gratitude</Label>
              <Input value={gratitude} onChange={(e) => setGratitude(e.target.value)} placeholder="One good thing" className="h-11 rounded-xl" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input value={highlights} onChange={(e) => setHighlights(e.target.value)} placeholder="Highlight (optional)" className="h-11 rounded-xl" />
            <Input value={lessons} onChange={(e) => setLessons(e.target.value)} placeholder="Lesson (optional)" className="h-11 rounded-xl" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Share this entry with my partner
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={save.isPending || !content.trim()} className="btn-brand h-12 flex-1 rounded-full">
              {save.isPending ? "Saving…" : "Save entry"}
            </Button>
            {entry && (
              <Button
                type="button"
                variant="outline"
                className="h-12 rounded-full text-[hsl(var(--destructive))]"
                onClick={() => remove.mutate({ id: entry.id })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
