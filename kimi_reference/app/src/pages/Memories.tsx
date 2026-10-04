import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { Camera, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { Chip, EmptyState } from "@/components/widgets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { todayStr } from "@/lib/date";
import { fileToCompressedBase64 } from "@/lib/upload";
import { StorageImage } from "@/components/StorageImage";

const TYPES = ["photo", "achievement", "goal", "trip", "special_day", "activity", "event"] as const;

export default function MemoriesPage() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const { data: memories } = trpc.memory.list.useQuery();
  const utils = trpc.useUtils();
  const remove = trpc.memory.remove.useMutation({
    onSuccess: () => utils.memory.list.invalidate(),
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (params.get("new") === "memory") {
      setOpen(true);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow-accent">Our memories</p>
          <h1 className="font-display mt-1 text-3xl font-medium sm:text-4xl">Look how far you've come</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Only what you deliberately save as a memory appears here.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="btn-brand rounded-full min-h-[44px]">
          <Plus className="mr-1.5 h-4 w-4" /> Save a memory
        </Button>
      </div>

      {(memories ?? []).length === 0 ? (
        <EmptyState
          title="No memories yet"
          hint="Save photos, achievements, trips and special days — the moments worth keeping."
          action={<Button onClick={() => setOpen(true)} variant="outline" className="rounded-full">Save your first memory</Button>}
        />
      ) : (
        <div className="columns-1 gap-4 sm:columns-2">
          {[...(memories ?? [])].reverse().map((m) => (
            <div key={m.id} className="card-lift mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-border bg-card">
              {m.photoKey && (
                <StorageImage fileKey={m.photoKey} alt={m.title} className="max-h-64 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-lg font-medium">{m.title}</p>
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{m.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Chip tone="brand" className="capitalize">{m.type.replace("_", " ")}</Chip>
                    {m.mine && (
                      <button
                        onClick={() => remove.mutate({ id: m.id })}
                        aria-label="Delete memory"
                        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:text-[hsl(var(--destructive))]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {m.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{m.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <MemoryDialog open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function MemoryDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr());
  const [type, setType] = useState<(typeof TYPES)[number]>("special_day");
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  const upload = trpc.storage.upload.useMutation();
  const create = trpc.memory.create.useMutation({
    onSuccess: () => {
      utils.memory.list.invalidate();
      toast.success("Memory saved.");
      setTitle(""); setDescription(""); setPhotoKey(null);
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const pick = async (file: File) => {
    setUploading(true);
    try {
      const base64 = await fileToCompressedBase64(file);
      const res = await upload.mutateAsync({
        name: file.name || "memory.jpg",
        contentBase64: base64,
        contentType: "image/jpeg",
        purpose: "memory",
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
        <DialogHeader><DialogTitle className="font-display text-2xl">Save a memory</DialogTitle></DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!title.trim()) return;
            create.mutate({
              title: title.trim(),
              description: description || null,
              date,
              type,
              photoKey,
            });
          }}
        >
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What happened?" className="h-12 rounded-xl" autoFocus />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="eyebrow mb-1.5 block">Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="eyebrow mb-1.5 block">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl" />
            </div>
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="The story behind it (optional)" rows={3} className="rounded-xl" />
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="rounded-full min-h-[44px]" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <Camera className="mr-1.5 h-4 w-4" />
              {uploading ? "Uploading…" : photoKey ? "Photo added ✓" : "Add photo"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pick(f);
              }}
            />
            {photoKey && <StorageImage fileKey={photoKey} alt="Memory" className="h-11 w-11 rounded-lg object-cover" />}
          </div>
          <Button type="submit" disabled={create.isPending || !title.trim()} className="btn-brand h-12 w-full rounded-full">
            {create.isPending ? "Saving…" : "Save memory"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
