import { type ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Bell,
  BookOpen,
  CalendarClock,
  Camera,
  Dumbbell,
  Heart,
  Home,
  LineChart,
  ListChecks,
  PenLine,
  Plus,
  Repeat,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
  UtensilsCrossed,
  Wallet,
  GlassWater,
  MoonStar,
  ClipboardList,
  X,
} from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export const NAV_ITEMS = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/day", label: "My Day", icon: CalendarClock },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/track", label: "Track", icon: GlassWater },
  { to: "/workout", label: "Workout", icon: Dumbbell },
  { to: "/food", label: "Food", icon: UtensilsCrossed },
  { to: "/study", label: "Study", icon: BookOpen },
  { to: "/habits", label: "Habits", icon: Repeat },
  { to: "/goals", label: "Goals", icon: Target },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/us", label: "Us", icon: Users },
  { to: "/journal", label: "Journal", icon: PenLine },
  { to: "/memories", label: "Memories", icon: Camera },
  { to: "/life-admin", label: "Life Admin", icon: Wallet },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE_NAV = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/track", label: "Track", icon: GlassWater },
  { to: "/progress", label: "Progress", icon: LineChart },
  { to: "/us", label: "Us", icon: Users },
] as const;

const QUICK_ACTIONS = [
  { label: "Task", icon: ListChecks, to: "/tasks?new=task" },
  { label: "Habit", icon: Repeat, to: "/habits?new=habit" },
  { label: "Meal", icon: UtensilsCrossed, to: "/food?new=meal" },
  { label: "Water", icon: GlassWater, to: "/track?new=water" },
  { label: "Workout", icon: Dumbbell, to: "/workout?new=workout" },
  { label: "Study session", icon: BookOpen, to: "/study?new=session" },
  { label: "Check-in", icon: Heart, to: "/track?new=checkin" },
  { label: "Memory", icon: Camera, to: "/memories?new=memory" },
  { label: "Journal", icon: PenLine, to: "/journal?new=entry" },
  { label: "Sleep", icon: MoonStar, to: "/track?new=sleep" },
] as const;

function Wordmark() {
  return (
    <Link to="/home" className="flex items-center gap-2.5" aria-label="LIFE OS home">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" aria-hidden>
          <circle cx="9.5" cy="12" r="5" strokeWidth="2.4" style={{ stroke: "hsl(var(--brand))" }} />
          <circle cx="14.5" cy="12" r="5" strokeWidth="2.4" style={{ stroke: "hsl(var(--brand))" }} />
        </svg>
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">LIFE OS</span>
    </Link>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const results = trpc.search.query.useQuery(
    { q },
    { enabled: q.trim().length > 0, staleTime: 10_000 },
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Search className="h-[18px] w-[18px]" />
      </button>
      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput placeholder="Search tasks, goals, journal, memories…" value={q} onValueChange={setQ} />
        <CommandList>
          <CommandEmpty>
            {q.trim() ? "Nothing found. Try different words." : "Type to search your space."}
          </CommandEmpty>
          <CommandGroup heading="Results">
            {(results.data ?? []).map((r) => (
              <CommandItem
                key={`${r.type}-${r.id}`}
                value={`${r.type}-${r.id}`}
                onSelect={() => {
                  setOpen(false);
                  setQ("");
                  navigate(r.to);
                }}
              >
                <span className="eyebrow mr-2 shrink-0">{r.type.replace("_", " ")}</span>
                <span className="truncate">{r.title}</span>
                {r.detail && <span className="ml-auto text-xs text-muted-foreground">{r.detail}</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}

function NotificationBell() {
  const utils = trpc.useUtils();
  const { data: unread } = trpc.social.unreadCount.useQuery(undefined, {
    refetchInterval: 30_000,
  });
  const { data: notifications } = trpc.social.notifications.useQuery();
  const markRead = trpc.social.markNotificationRead.useMutation({
    onSuccess: () => {
      utils.social.unreadCount.invalidate();
      utils.social.notifications.invalidate();
    },
  });
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Notifications"
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          {(unread?.count ?? 0) > 0 && (
            <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[hsl(var(--brand))] px-1 text-[10px] font-semibold text-white">
              {unread!.count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="eyebrow">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {(notifications ?? []).length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              Nothing yet. Encouragement and help requests will show up here.
            </p>
          )}
          {(notifications ?? []).map((n) => (
            <button
              key={n.id}
              onClick={() => !n.read && markRead.mutate({ id: n.id })}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60",
                !n.read && "bg-brand-soft/50",
              )}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{n.title}</p>
                {n.body && <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>}
              </div>
              {!n.read && <span className="ml-auto mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[hsl(var(--brand))]" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function QuickAdd() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Quick add"
        className="btn-brand fixed bottom-[calc(76px+env(safe-area-inset-bottom))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg lg:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-[calc(20px+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="font-display text-xl">Quick add</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => {
                  setOpen(false);
                  navigate(a.to);
                }}
                className="flex min-h-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-xs font-medium transition-colors hover:bg-secondary"
              >
                <a.icon className="h-5 w-5 text-brand" />
                {a.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth({ redirectOnUnauthenticated: true });
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[hsl(var(--brand))]" />
      </div>
    );
  }

  const initials = (user.name ?? "?").slice(0, 1).toUpperCase();

  return (
    <div className="relative z-10 min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-[hsl(var(--sidebar-background))] lg:flex">
        <div className="flex h-16 items-center px-5">
          <Wordmark />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors min-h-[44px]",
                  active
                    ? "bg-brand-soft font-medium text-brand-ink"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4", active && "text-brand")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-secondary min-h-[44px]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block text-xs text-muted-foreground">Sign out</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/92 px-3 backdrop-blur-md lg:hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Wordmark />
        <div className="flex items-center">
          <GlobalSearch />
          <NotificationBell />
          <button
            onClick={() => setMoreOpen(true)}
            aria-label="All sections"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <ClipboardList className="h-[18px] w-[18px]" />
          </button>
          <Link
            to="/settings"
            aria-label="Settings"
            className="flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink">
              {initials}
            </span>
          </Link>
        </div>
      </header>

      {/* Desktop top bar */}
      <div className="sticky top-0 z-30 ml-60 hidden h-14 items-center justify-end gap-1 border-b border-border bg-background/92 px-6 backdrop-blur-md lg:flex">
        <GlobalSearch />
        <NotificationBell />
      </div>

      {/* Content */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(96px+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:ml-60 lg:max-w-none lg:px-10 lg:pb-16 lg:pt-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>

      {/* Mobile bottom nav — Home / Tasks / Track / Progress / Us */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        {MOBILE_NAV.map((item) => (
          <MobileNavItem key={item.to} item={item} pathname={location.pathname} />
        ))}
      </nav>

      {/* More sheet (mobile) */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="max-h-[75vh] rounded-t-3xl pb-[calc(20px+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-xl">All sections</SheetTitle>
              <button onClick={() => setMoreOpen(false)} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </SheetHeader>
          <div className="mt-3 grid grid-cols-2 gap-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                  location.pathname === item.to
                    ? "bg-brand-soft font-medium text-brand-ink"
                    : "text-muted-foreground hover:bg-secondary",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <QuickAdd />
    </div>
  );
}

function MobileNavItem({
  item,
  pathname,
}: {
  item: (typeof MOBILE_NAV)[number];
  pathname: string;
}) {
  const active = pathname === item.to;
  return (
    <Link
      to={item.to}
      className={cn(
        "flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
        active ? "text-brand" : "text-muted-foreground",
      )}
      aria-current={active ? "page" : undefined}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
