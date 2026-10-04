import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Camera, Plus, Sparkles, Trash2, UtensilsCrossed } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { SectionTitle, Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayStr } from "@/lib/date";
import { aiErrorMessage, AiThinking } from "@/components/ai";
import { fileToCompressedBase64 } from "@/lib/upload";
import { StorageImage } from "@/components/StorageImage";

const MEAL_TYPES = ["breakfast", "lunch", "snack", "dinner", "other"] as const;

export default function FoodPage() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [date] = useState(todayStr());
  const { data: meals } = trpc.tracker.mealList.useQuery({ date });
  const { data: profile } = trpc.profile.me.useQuery();
  const utils = trpc.useUtils();
  const del = trpc.tracker.deleteMeal.useMutation({
    onSuccess: () => utils.tracker.mealList.invalidate(),
    onError: (e) => toast.error(e.message),
  });
  const suggest = trpc.ai.mealSuggest.useMutation({
    onError: (e) => toast.error(aiErrorMessage(e.message)),
  });
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("new") === "meal") {
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  const byType = MEAL_TYPES.map((t) => ({
    type: t,
    items: (meals ?? []).filter((m) => m.type === t),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Food</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Eat well, simply</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {profile?.diet ? `Preference: ${profile.diet}. ` : ""}
            Nutrition notes are estimates unless verified.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-full min-h-[44px]"
            disabled={suggest.isPending}
            onClick={() => suggest.mutate(undefined, { onSuccess: (d) => setSuggestion(d.text) })}
          >
            <Sparkles className="mr-1.5 h-4 w-4" /> Suggest meals
          </Button>
          <Button onClick={() => setOpen(true)} className="btn-brand rounded-full min-h-[44px]">
            <Plus className="mr-1.5 h-4 w-4" /> Log meal
          </Button>
        </div>
      </div>

      {(suggest.isPending || suggestion) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <SectionTitle>Meal ideas for you</SectionTitle>
          {suggest.isPending ? (
            <AiThinking label="Considering your preferences and schedule…" />
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{suggestion}</p>
          )}
        </section>
      )}

      {(meals ?? []).length === 0 ? (
        <EmptyState
          title="No meals logged today"
          hint={`Try natural language: "I ate two eggs and dosa."`}
          action={<Button onClick={() => setOpen(true)} variant="outline" className="rounded-full">Log your first meal</Button>}
        />
      ) : (
        <div className="space-y-4">
          {byType.map((g) => (
            <section key={g.type} className="rounded-2xl border border-border bg-card p-5">
              <SectionTitle>{g.type}</SectionTitle>
              <ul className="space-y-3">
                {g.items.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    {m.photoKey ? (
                      <StorageImage fileKey={m.photoKey} alt={m.description} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-soft">
                        <UtensilsCrossed className="h-4 w-4 text-brand" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{m.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {[m.time, m.portion, m.notes].filter(Boolean).join(" · ")}
                        {!mMine(m) && " · theirs"}
                      </p>
                    </div>
                    <Chip tone={m.visibility === "shared" ? "brand" : "neutral"}>
                      {m.visibility === "shared" ? "shared" : "private"}
                    </Chip>
                    {mMine(m) && (
                      <button
                        onClick={() => del.mutate({ id: m.id })}
                        aria-label="Delete meal"
                        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-[hsl(var(--destructive))]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <MealDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function mMine(m: { mine?: boolean }): boolean {
  return m.mine !== false;
}

function MealDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [type, setType] = useState<(typeof MEAL_TYPES)[number]>("lunch");
  const [description, setDescription] = useState("");
  const [portion, setPortion] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [shared, setShared] = useState(true);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const upload = trpc.storage.upload.useMutation();

  const add = trpc.tracker.addMeal.useMutation({
    onSuccess: () => {
      utils.tracker.mealList.invalidate();
      toast.success("Meal logged.");
      setDescription(""); setPortion(""); setTime(""); setNotes(""); setPhotoKey(null);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const pickPhoto = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await fileToCompressedBase64(file);
      const res = await upload.mutateAsync({
        name: file.name || "meal.jpg",
        contentBase64: base64,
        contentType: "image/jpeg",
        purpose: "meal",
      });
      setPhotoKey(res.key);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't upload the image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Log meal</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!description.trim()) return;
            add.mutate({
              type,
              description: description.trim(),
              portion: portion || null,
              time: time || null,
              notes: notes || null,
              photoKey,
              visibility: shared ? "shared" : "private",
            });
          }}
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Meal</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEAL_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="I ate two eggs and dosa…"
            className="h-12 rounded-xl"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input value={portion} onChange={(e) => setPortion(e.target.value)} placeholder="Portion (optional)" className="h-11 rounded-xl" />
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes (optional)" className="h-11 rounded-xl" />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-full min-h-[44px]"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="mr-1.5 h-4 w-4" />
              {uploading ? "Uploading…" : photoKey ? "Photo added ✓" : "Add photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickPhoto(f);
              }}
            />
            {photoKey && <StorageImage fileKey={photoKey} alt="Meal" className="h-11 w-11 rounded-lg object-cover" />}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={shared} onCheckedChange={setShared} />
            Share with partner
          </label>
          <Button type="submit" disabled={add.isPending || !description.trim()} className="btn-brand h-12 w-full rounded-full">
            {add.isPending ? "Saving…" : "Log meal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
