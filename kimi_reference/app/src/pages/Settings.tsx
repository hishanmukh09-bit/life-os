import { useEffect, useRef, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionTitle } from "@/components/widgets";
import { useAccent, ACCENTS, ThemeToggle } from "@/providers/theme";
import { useAuth } from "@/hooks/useAuth";
import { StorageImage } from "@/components/StorageImage";
import { fileToCompressedBase64 } from "@/lib/upload";
import { Copy, RefreshCw, LogOut, Camera, UserX } from "lucide-react";
import { toast } from "sonner";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function Settings() {
  const utils = trpc.useUtils();
  const { logout } = useAuth();
  const { accent, setAccent } = useAccent();
  const meQ = trpc.profile.me.useQuery();
  const spaceQ = trpc.space.get.useQuery();
  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.me.invalidate();
      toast.success("Saved");
    },
  });
  const upload = trpc.storage.upload.useMutation();
  const regenerate = trpc.space.regenerateCode.useMutation({
    onSuccess: () => {
      utils.space.get.invalidate();
      toast.success("New invite code generated");
    },
  });
  const removeMember = trpc.space.removeMember.useMutation({
    onSuccess: () => {
      utils.space.get.invalidate();
      toast.success("Partner removed from the space");
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  useEffect(() => {
    const p = meQ.data;
    if (!p) return;
    setForm({
      displayName: p.displayName ?? "",
      dateOfBirth: p.dateOfBirth ?? "",
      heightCm: p.heightCm?.toString() ?? "",
      weightKg: p.weightKg?.toString() ?? "",
      fitnessGoal: p.fitnessGoal ?? "",
      activityLevel: p.activityLevel ?? "",
      equipment: p.equipment ?? "",
      workoutPrefMin: p.workoutPrefMin?.toString() ?? "",
      sleepTargetMin: p.sleepTargetMin?.toString() ?? "",
      wakeTarget: p.wakeTarget ?? "",
      waterTargetMl: p.waterTargetMl?.toString() ?? "",
      studyTargetMin: p.studyTargetMin?.toString() ?? "",
      diet: p.diet ?? "",
      allergies: p.allergies ?? "",
      dislikedFoods: p.dislikedFoods ?? "",
      favoriteFoods: p.favoriteFoods ?? "",
      occupation: p.occupation ?? "",
      quietHoursStart: p.quietHoursStart ?? "",
      quietHoursEnd: p.quietHoursEnd ?? "",
    });
  }, [meQ.data]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v: string) => (v.trim() === "" ? null : Number(v));
  const str = (v: string) => (v.trim() === "" ? null : v.trim());

  const save = () => {
    update.mutate({
      displayName: str(form.displayName ?? ""),
      dateOfBirth: str(form.dateOfBirth ?? ""),
      heightCm: num(form.heightCm ?? ""),
      weightKg: num(form.weightKg ?? ""),
      fitnessGoal: str(form.fitnessGoal ?? ""),
      activityLevel: str(form.activityLevel ?? ""),
      equipment: str(form.equipment ?? ""),
      workoutPrefMin: num(form.workoutPrefMin ?? ""),
      sleepTargetMin: num(form.sleepTargetMin ?? ""),
      wakeTarget: str(form.wakeTarget ?? ""),
      waterTargetMl: num(form.waterTargetMl ?? ""),
      studyTargetMin: num(form.studyTargetMin ?? ""),
      diet: str(form.diet ?? ""),
      allergies: str(form.allergies ?? ""),
      dislikedFoods: str(form.dislikedFoods ?? ""),
      favoriteFoods: str(form.favoriteFoods ?? ""),
      occupation: str(form.occupation ?? ""),
      quietHoursStart: str(form.quietHoursStart ?? ""),
      quietHoursEnd: str(form.quietHoursEnd ?? ""),
    });
  };

  const fileRef = useRef<HTMLInputElement>(null);
  const onAvatar = async (f: File) => {
    try {
      const contentBase64 = await fileToCompressedBase64(f, 512);
      const res = await upload.mutateAsync({
        name: `avatars/${Date.now()}.jpg`,
        contentBase64,
        contentType: "image/jpeg",
        purpose: "avatar",
      });
      await update.mutateAsync({ avatarKey: res.key });
      toast.success("Photo updated");
    } catch {
      toast.error("Upload failed — try a smaller image");
    }
  };

  const space = spaceQ.data?.space;
  const myRole = spaceQ.data?.myRole;
  const partner = spaceQ.data?.partner ?? null;
  const memberCount = spaceQ.data?.memberCount ?? 1;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6">
        <p className="eyebrow eyebrow-accent">Settings</p>
        <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
          Make it <em className="display-italic-accent">yours.</em>
        </h1>
      </header>

      {/* Profile */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Profile" title="About you" />
        <div className="mt-4 flex items-center gap-4">
          <button
            className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border"
            onClick={() => fileRef.current?.click()}
          >
            {meQ.data?.avatarKey ? (
              <StorageImage fileKey={meQ.data.avatarKey} alt="You" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-[hsl(var(--brand-soft))]">
                <Camera className="h-5 w-5 text-brand-ink" />
              </span>
            )}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onAvatar(f);
              e.target.value = "";
            }}
          />
          <div className="min-w-0 flex-1">
            <Field label="Display name">
              <Input value={form.displayName ?? ""} onChange={(e) => set("displayName", e.target.value)} />
            </Field>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Date of birth">
            <Input type="date" value={form.dateOfBirth ?? ""} onChange={(e) => set("dateOfBirth", e.target.value)} />
          </Field>
          <Field label="Occupation">
            <Input value={form.occupation ?? ""} onChange={(e) => set("occupation", e.target.value)} />
          </Field>
        </div>
      </Card>

      {/* Wellness */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Wellness" title="Body & rest" />
        <p className="mt-1 text-xs text-muted-foreground">Private by default — used to personalise your plans.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Height (cm)"><Input inputMode="numeric" value={form.heightCm ?? ""} onChange={(e) => set("heightCm", e.target.value)} /></Field>
          <Field label="Weight (kg)"><Input inputMode="numeric" value={form.weightKg ?? ""} onChange={(e) => set("weightKg", e.target.value)} /></Field>
          <Field label="Sleep target (min)" hint="e.g. 480 = 8h"><Input inputMode="numeric" value={form.sleepTargetMin ?? ""} onChange={(e) => set("sleepTargetMin", e.target.value)} /></Field>
          <Field label="Wake-up target" hint="e.g. 07:00"><Input placeholder="07:00" value={form.wakeTarget ?? ""} onChange={(e) => set("wakeTarget", e.target.value)} /></Field>
          <Field label="Water target (ml)"><Input inputMode="numeric" value={form.waterTargetMl ?? ""} onChange={(e) => set("waterTargetMl", e.target.value)} /></Field>
          <Field label="Study target (min/day)"><Input inputMode="numeric" value={form.studyTargetMin ?? ""} onChange={(e) => set("studyTargetMin", e.target.value)} /></Field>
        </div>
      </Card>

      {/* Fitness & food */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Preferences" title="Movement & food" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="Fitness goal"><Input placeholder="e.g. Run 5k" value={form.fitnessGoal ?? ""} onChange={(e) => set("fitnessGoal", e.target.value)} /></Field>
          <Field label="Activity level"><Input placeholder="e.g. Moderate" value={form.activityLevel ?? ""} onChange={(e) => set("activityLevel", e.target.value)} /></Field>
          <Field label="Equipment"><Input placeholder="e.g. Dumbbells, none" value={form.equipment ?? ""} onChange={(e) => set("equipment", e.target.value)} /></Field>
          <Field label="Workout length (min)"><Input inputMode="numeric" value={form.workoutPrefMin ?? ""} onChange={(e) => set("workoutPrefMin", e.target.value)} /></Field>
          <Field label="Diet"><Input placeholder="e.g. Vegetarian" value={form.diet ?? ""} onChange={(e) => set("diet", e.target.value)} /></Field>
          <Field label="Allergies"><Input value={form.allergies ?? ""} onChange={(e) => set("allergies", e.target.value)} /></Field>
          <Field label="Disliked foods"><Input value={form.dislikedFoods ?? ""} onChange={(e) => set("dislikedFoods", e.target.value)} /></Field>
          <Field label="Favourite foods"><Input value={form.favoriteFoods ?? ""} onChange={(e) => set("favoriteFoods", e.target.value)} /></Field>
        </div>
      </Card>

      {/* Appearance */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Appearance" title="Theme & accent" />
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm">Light / dark</p>
          <ThemeToggle />
        </div>
        <p className="mt-4 text-sm">Accent</p>
        <div className="mt-2 flex gap-2.5">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              aria-label={a.id}
              className={`h-9 w-9 rounded-full transition-transform ${accent === a.id ? "scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""}`}
              style={{ backgroundColor: a.swatch }}
              onClick={() => {
                setAccent(a.id);
                update.mutate({ accent: a.id });
              }}
            />
          ))}
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Notifications" title="Quiet hours" />
        <p className="mt-1 text-xs text-muted-foreground">No nudges during these hours — rest matters.</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label="From"><Input type="time" value={form.quietHoursStart ?? ""} onChange={(e) => set("quietHoursStart", e.target.value)} /></Field>
          <Field label="Until"><Input type="time" value={form.quietHoursEnd ?? ""} onChange={(e) => set("quietHoursEnd", e.target.value)} /></Field>
        </div>
      </Card>

      {/* Space */}
      <Card className="mb-4 p-5">
        <SectionTitle eyebrow="Your space" title="Two people, one space" />
        {space && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Invite code</p>
                <p className="font-mono text-lg font-semibold tracking-widest">{space.inviteCode}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(space.inviteCode);
                    toast.success("Copied");
                  }}
                  aria-label="Copy code"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                {myRole === "owner" && (
                  <Button variant="outline" size="icon" onClick={() => regenerate.mutate()} aria-label="Regenerate code">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">Members ({memberCount}/2)</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between rounded-lg border p-2.5">
                  <p className="text-sm">
                    {meQ.data?.displayName || "You"}
                    <span className="ml-2 text-xs text-muted-foreground">{myRole ?? "member"}</span>
                  </p>
                </div>
                {partner && (
                  <div className="flex items-center justify-between rounded-lg border p-2.5">
                    <p className="text-sm">
                      {partner.displayName || partner.name || "Your person"}
                      <span className="ml-2 text-xs text-muted-foreground">{partner.role}</span>
                    </p>
                    {myRole === "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Remove your partner from this space? Their private data stays theirs.")) {
                            removeMember.mutate({ userId: partner.id });
                          }
                        }}
                      >
                        <UserX className="mr-1 h-4 w-4" /> Remove
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button className="btn-brand" onClick={save} disabled={update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="outline" onClick={() => logout()}>
          <LogOut className="mr-1.5 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
