import { useState } from "react";
import { trpc } from "@/providers/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, Chip } from "@/components/widgets";
import { Plus, Trash2, Check, CalendarDays, Lock, Globe2, Heart, BookOpen, Link2, Lightbulb, StickyNote, Bell } from "lucide-react";
import { toast } from "sonner";
import { daysUntil, prettyDate, todayStr } from "@/lib/date";

const ADMIN_CATEGORIES = ["bills", "payments", "documents", "renewals", "appointments", "repairs", "purchases", "other"] as const;
const EVENT_TYPES = ["birthday", "anniversary", "exam", "trip", "appointment", "deadline", "milestone", "other"] as const;
const KNOWLEDGE_TYPES = [
  { id: "note", label: "Note", icon: StickyNote },
  { id: "learned", label: "Thing I learned", icon: BookOpen },
  { id: "link", label: "Link", icon: Link2 },
  { id: "idea", label: "Idea", icon: Lightbulb },
  { id: "book", label: "Book", icon: BookOpen },
  { id: "little_thing", label: "Little thing", icon: Heart },
  { id: "remember", label: "Remember this", icon: Bell },
] as const;

export default function LifeAdmin() {
  const utils = trpc.useUtils();
  const [tab, setTab] = useState("admin");
  const [dialog, setDialog] = useState<"admin" | "event" | "knowledge" | null>(null);

  const adminQ = trpc.misc.lifeAdminList.useQuery();
  const eventsQ = trpc.misc.eventList.useQuery();
  const knowledgeQ = trpc.misc.knowledgeList.useQuery();

  const invalidate = () => {
    utils.misc.lifeAdminList.invalidate();
    utils.misc.eventList.invalidate();
    utils.misc.knowledgeList.invalidate();
  };

  const adminAdd = trpc.misc.lifeAdminAdd.useMutation({ onSuccess: () => { invalidate(); setDialog(null); toast.success("Added"); } });
  const adminToggle = trpc.misc.lifeAdminToggle.useMutation({ onSuccess: invalidate });
  const adminDelete = trpc.misc.lifeAdminDelete.useMutation({ onSuccess: invalidate });
  const eventAdd = trpc.misc.eventAdd.useMutation({ onSuccess: () => { invalidate(); setDialog(null); toast.success("Event added"); } });
  const eventDelete = trpc.misc.eventDelete.useMutation({ onSuccess: invalidate });
  const knowledgeAdd = trpc.misc.knowledgeAdd.useMutation({ onSuccess: () => { invalidate(); setDialog(null); toast.success("Saved"); } });
  const knowledgeDelete = trpc.misc.knowledgeDelete.useMutation({ onSuccess: invalidate });

  const [adminForm, setAdminForm] = useState({ title: "", category: "other" as string, dueDate: "", notes: "", visibility: "shared" as "private" | "shared" });
  const [eventForm, setEventForm] = useState({ title: "", type: "other" as string, date: todayStr(), notes: "", visibility: "shared" as "private" | "shared" });
  const [kForm, setKForm] = useState({ title: "", content: "", url: "", type: "note" as string, aboutPartner: false, visibility: "private" as "private" | "shared" });

  const pendingAdmin = (adminQ.data ?? []).filter((i) => !i.done);
  const doneAdmin = (adminQ.data ?? []).filter((i) => i.done);
  const upcomingEvents = (eventsQ.data ?? []).filter((e) => daysUntil(e.date) >= 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8 lg:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow eyebrow-accent">Life admin</p>
          <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
            The quiet <em className="display-italic-accent">logistics</em> of life.
          </h1>
        </div>
        <Button
          className="btn-brand"
          onClick={() => setDialog(tab === "events" ? "event" : tab === "vault" ? "knowledge" : "admin")}
        >
          <Plus className="mr-1.5 h-4 w-4" /> Add
        </Button>
      </header>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-5">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="vault">Vault</TabsTrigger>
        </TabsList>

        <TabsContent value="admin">
          {pendingAdmin.length === 0 && doneAdmin.length === 0 ? (
            <EmptyState title="No admin items" body="Bills, renewals, appointments — keep the boring stuff out of your head." />
          ) : (
            <div className="space-y-2">
              {pendingAdmin.map((i) => (
                <Card key={i.id} className="flex items-center gap-3 p-3.5">
                  <button
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors hover:border-[hsl(var(--brand))]"
                    onClick={() => adminToggle.mutate({ id: i.id, done: true })}
                    aria-label="Mark done"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.category}
                      {i.dueDate && (
                        <> · due {prettyDate(i.dueDate)}
                          {daysUntil(i.dueDate) <= 3 && daysUntil(i.dueDate) >= 0 && (
                            <span className="text-amber-600"> ({daysUntil(i.dueDate) === 0 ? "today" : `in ${daysUntil(i.dueDate)}d`})</span>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  {i.visibility === "private" ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />}
                  {i.mine && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => adminDelete.mutate({ id: i.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </Card>
              ))}
              {doneAdmin.length > 0 && (
                <>
                  <p className="eyebrow pt-4">Done</p>
                  {doneAdmin.map((i) => (
                    <div key={i.id} className="flex items-center gap-3 px-3.5 py-2 opacity-50">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <p className="flex-1 truncate text-sm line-through">{i.title}</p>
                      {i.mine && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => adminDelete.mutate({ id: i.id })}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="events">
          {upcomingEvents.length === 0 ? (
            <EmptyState title="No upcoming events" body="Birthdays, anniversaries, trips — the dates that matter." />
          ) : (
            <div className="space-y-2">
              {upcomingEvents.map((e) => {
                const d = daysUntil(e.date);
                return (
                  <Card key={e.id} className="flex items-center gap-3 p-3.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--brand-soft))]">
                      <CalendarDays className="h-5 w-5 text-brand-ink" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{prettyDate(e.date)} · {e.type}</p>
                    </div>
                    <Chip tone={d === 0 ? "brand" : d <= 7 ? "warning" : "neutral"}>
                      {d === 0 ? "Today" : `in ${d}d`}
                    </Chip>
                    {e.mine && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => eventDelete.mutate({ id: e.id })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vault">
          {(knowledgeQ.data ?? []).length === 0 ? (
            <EmptyState
              title="Your vault is empty"
              body="Things you learned, ideas, links, little things you notice about each other — kept safe here. Private by default."
            />
          ) : (
            <div className="columns-1 gap-3 sm:columns-2 [&>*]:mb-3">
              {(knowledgeQ.data ?? []).map((k) => {
                const meta = KNOWLEDGE_TYPES.find((t) => t.id === k.type) ?? KNOWLEDGE_TYPES[0];
                const Icon = meta.icon;
                return (
                  <Card key={k.id} className="break-inside-avoid p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-brand" />
                        <p className="text-xs text-muted-foreground">{meta.label}{k.aboutPartner ? " · about them" : ""}</p>
                      </div>
                      {k.visibility === "private" ? <Lock className="h-3.5 w-3.5 text-muted-foreground" /> : <Globe2 className="h-3.5 w-3.5 text-muted-foreground" />}
                    </div>
                    <p className="mt-2 text-sm font-medium">{k.title}</p>
                    {k.content && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{k.content}</p>}
                    {k.url && (
                      <a href={k.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-brand underline">
                        {k.url}
                      </a>
                    )}
                    {k.mine && (
                      <div className="mt-2 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => knowledgeDelete.mutate({ id: k.id })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Admin dialog */}
      <Dialog open={dialog === "admin"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New admin item</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="e.g. Renew car insurance" value={adminForm.title} onChange={(e) => setAdminForm({ ...adminForm, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={adminForm.category} onValueChange={(v) => setAdminForm({ ...adminForm, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ADMIN_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={adminForm.dueDate} onChange={(e) => setAdminForm({ ...adminForm, dueDate: e.target.value })} />
            </div>
            <Textarea placeholder="Notes (optional)" value={adminForm.notes} onChange={(e) => setAdminForm({ ...adminForm, notes: e.target.value })} />
            <Select value={adminForm.visibility} onValueChange={(v) => setAdminForm({ ...adminForm, visibility: v as "private" | "shared" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">Shared with your person</SelectItem>
                <SelectItem value="private">Private — only me</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="btn-brand w-full"
              disabled={!adminForm.title.trim() || adminAdd.isPending}
              onClick={() => adminAdd.mutate({
                title: adminForm.title.trim(),
                category: adminForm.category as (typeof ADMIN_CATEGORIES)[number],
                dueDate: adminForm.dueDate || null,
                notes: adminForm.notes || null,
                visibility: adminForm.visibility,
              })}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Event dialog */}
      <Dialog open={dialog === "event"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>New event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="e.g. Her birthday" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
              <Input type="date" value={eventForm.date} onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })} />
            </div>
            <Textarea placeholder="Notes (optional)" value={eventForm.notes} onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })} />
            <Select value={eventForm.visibility} onValueChange={(v) => setEventForm({ ...eventForm, visibility: v as "private" | "shared" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="shared">Shared with your person</SelectItem>
                <SelectItem value="private">Private — only me</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="btn-brand w-full"
              disabled={!eventForm.title.trim() || eventAdd.isPending}
              onClick={() => eventAdd.mutate({
                title: eventForm.title.trim(),
                type: eventForm.type as (typeof EVENT_TYPES)[number],
                date: eventForm.date,
                notes: eventForm.notes || null,
                visibility: eventForm.visibility,
              })}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Knowledge dialog */}
      <Dialog open={dialog === "knowledge"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Save to vault</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={kForm.type} onValueChange={(v) => setKForm({ ...kForm, type: v, aboutPartner: v === "little_thing" ? kForm.aboutPartner : false })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{KNOWLEDGE_TYPES.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input
              placeholder={kForm.type === "little_thing" ? "e.g. She loves cinnamon in her coffee" : "Title"}
              value={kForm.title}
              onChange={(e) => setKForm({ ...kForm, title: e.target.value })}
            />
            <Textarea placeholder="Details (optional)" value={kForm.content} onChange={(e) => setKForm({ ...kForm, content: e.target.value })} />
            {kForm.type === "link" && (
              <Input placeholder="https://…" value={kForm.url} onChange={(e) => setKForm({ ...kForm, url: e.target.value })} />
            )}
            {kForm.type === "little_thing" && (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={kForm.aboutPartner} onChange={(e) => setKForm({ ...kForm, aboutPartner: e.target.checked })} className="h-4 w-4" />
                This is about my person
              </label>
            )}
            <Select value={kForm.visibility} onValueChange={(v) => setKForm({ ...kForm, visibility: v as "private" | "shared" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private — only me (default)</SelectItem>
                <SelectItem value="shared">Shared with your person</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="btn-brand w-full"
              disabled={!kForm.title.trim() || knowledgeAdd.isPending}
              onClick={() => knowledgeAdd.mutate({
                title: kForm.title.trim(),
                content: kForm.content || null,
                url: kForm.url || null,
                type: kForm.type as "note",
                aboutPartner: kForm.aboutPartner,
                visibility: kForm.visibility,
              })}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
