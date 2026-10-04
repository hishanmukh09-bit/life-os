import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router";
import { useAuth } from "./hooks/useAuth";
import { trpc } from "./providers/trpc";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import MyDay from "./pages/MyDay";
import Tasks from "./pages/Tasks";
import Track from "./pages/Track";
import Workout from "./pages/Workout";
import Food from "./pages/Food";
import Study from "./pages/Study";
import Habits from "./pages/Habits";
import Goals from "./pages/Goals";
import Progress from "./pages/Progress";
import Us from "./pages/Us";
import Journal from "./pages/Journal";
import Memories from "./pages/Memories";
import LifeAdmin from "./pages/LifeAdmin";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

function FullSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-[hsl(var(--brand))]" />
    </div>
  );
}

/** Signed in + belongs to a space → render inside the app shell. */
function Protected({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const spaceQ = trpc.space.get.useQuery(undefined, { enabled: !!user });

  if (isLoading || (user && spaceQ.isLoading)) return <FullSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!spaceQ.data) return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

function Root() {
  const { user, isLoading } = useAuth();
  const spaceQ = trpc.space.get.useQuery(undefined, { enabled: !!user });
  if (isLoading || (user && spaceQ.isLoading)) return <FullSpinner />;
  if (!user) return <Landing />;
  if (!spaceQ.data) return <Navigate to="/onboarding" replace />;
  return <Navigate to="/home" replace />;
}

function OnboardingRoute() {
  const { user, isLoading } = useAuth();
  const spaceQ = trpc.space.get.useQuery(undefined, { enabled: !!user });
  if (isLoading || (user && spaceQ.isLoading)) return <FullSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (spaceQ.data) return <Navigate to="/home" replace />;
  return <Onboarding />;
}

const P = (el: ReactNode) => <Protected>{el}</Protected>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route path="/home" element={P(<Home />)} />
      <Route path="/day" element={P(<MyDay />)} />
      <Route path="/tasks" element={P(<Tasks />)} />
      <Route path="/track" element={P(<Track />)} />
      <Route path="/workout" element={P(<Workout />)} />
      <Route path="/food" element={P(<Food />)} />
      <Route path="/study" element={P(<Study />)} />
      <Route path="/habits" element={P(<Habits />)} />
      <Route path="/goals" element={P(<Goals />)} />
      <Route path="/progress" element={P(<Progress />)} />
      <Route path="/us" element={P(<Us />)} />
      <Route path="/journal" element={P(<Journal />)} />
      <Route path="/memories" element={P(<Memories />)} />
      <Route path="/life-admin" element={P(<LifeAdmin />)} />
      <Route path="/coach" element={P(<Coach />)} />
      <Route path="/settings" element={P(<Settings />)} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
