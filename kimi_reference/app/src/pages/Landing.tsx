import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LOGIN_PATH } from "@/const";

const FEATURES = [
  {
    n: "01",
    title: "Plan",
    body: "Start each day knowing exactly what matters. Tasks, routines and tomorrow's plan — shaped around your real time, not an ideal one.",
  },
  {
    n: "02",
    title: "Track",
    body: "Water, sleep, workouts, meals and habits — logged in seconds. Gentle trends, never judgement.",
  },
  {
    n: "03",
    title: "Study",
    body: "Subjects, focus sessions, exams and a deadline radar that warns you before it's urgent.",
  },
  {
    n: "04",
    title: "Move",
    body: "Workouts that fit your equipment, time and energy. Consistency first, always.",
  },
  {
    n: "05",
    title: "Reflect",
    body: "A private journal, daily check-ins and weekly resets. Look how far you've come.",
  },
  {
    n: "06",
    title: "Grow",
    body: "Shared goals, encouragement and memories — accountability that feels like support, not surveillance.",
  },
];

export default function Landing() {
  const { user, isLoading } = useAuth();

  return (
    <div className="relative z-10 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-background/92 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
                <circle cx="9.5" cy="12" r="5" strokeWidth="2.4" style={{ stroke: "hsl(var(--brand))" }} />
                <circle cx="14.5" cy="12" r="5" strokeWidth="2.4" style={{ stroke: "hsl(var(--brand))" }} />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">LIFE OS</span>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && user ? (
              <Link
                to="/home"
                className="btn-brand inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-medium"
              >
                Open your space
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link to={LOGIN_PATH} className="hidden min-h-[44px] items-center px-3 text-sm text-muted-foreground hover:text-foreground sm:inline-flex">
                  Sign in
                </Link>
                <Link
                  to={LOGIN_PATH}
                  className="btn-brand inline-flex min-h-[44px] items-center gap-2 rounded-full px-5 text-sm font-medium"
                >
                  Create your private space
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24">
        <p className="eyebrow-accent mb-6">A private space for two</p>
        <h1 className="font-display max-w-3xl text-5xl font-medium leading-[1.05] sm:text-7xl">
          Build <em className="display-italic-accent">better days</em> together.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          A private space for two people to plan, track, grow and support each
          other. Not another dashboard — a quiet place to organize life and
          become a little better, side by side.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            to={user ? "/home" : LOGIN_PATH}
            className="btn-brand group inline-flex min-h-[52px] items-center gap-2 rounded-full px-7 text-base font-medium"
          >
            Create your private space
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </Link>
          <p className="text-sm text-muted-foreground">Exactly two people. Private by default.</p>
        </div>
      </section>

      {/* Daily loop strip */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-5 py-5">
          {["Plan", "Do", "Track", "Reflect", "Improve", "Plan tomorrow"].map((s, i) => (
            <span key={s} className="flex items-center gap-8">
              <span className="eyebrow">{s}</span>
              {i < 5 && <span className="hidden h-1 w-1 rounded-full bg-[hsl(var(--brand))] sm:block" />}
            </span>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.n} className="card-lift bg-card p-7">
              <span className="eyebrow-accent">{f.n}</span>
              <h3 className="font-display mt-3 text-2xl font-medium">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy section — dark band */}
      <section className="bg-[#1B1916] text-[#F5F1EA]">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow mb-6 text-[#C98A6B]">Privacy, by design</p>
          <h2 className="font-display max-w-2xl text-3xl font-medium leading-tight sm:text-5xl">
            Accountability <em className="display-italic-accent">without</em> surveillance.
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div>
              <h3 className="font-display text-xl">Private by default</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A89E90]">
                Journals, weight, health and cycle data stay yours. You choose
                what to share — the other person can never override it.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Exactly two</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A89E90]">
                One private space, two members, enforced on the server. No
                leaderboards, no rankings, no guilt notifications.
              </p>
            </div>
            <div>
              <h3 className="font-display text-xl">Support, not control</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#A89E90]">
                Send encouragement, ask for help, share goals. The app asks
                "how can I support them?" — never "why haven't they?".
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-[hsl(var(--brand))] text-[#FBF3EE]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-20 text-center">
          <h2 className="font-display max-w-2xl text-3xl font-medium leading-tight sm:text-5xl">
            One step at a time. <em className="italic">Together.</em>
          </h2>
          <Link
            to={user ? "/home" : LOGIN_PATH}
            className="mt-8 inline-flex min-h-[52px] items-center gap-2 rounded-full bg-[#FBF3EE] px-7 text-base font-medium text-[#1B1916] transition-transform hover:-translate-y-0.5"
          >
            Create your private space
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-sm text-muted-foreground">
          <span className="font-display font-semibold text-foreground">LIFE OS</span>
          <span>Build better days together.</span>
        </div>
      </footer>
    </div>
  );
}
