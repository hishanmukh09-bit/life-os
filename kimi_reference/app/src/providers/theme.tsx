import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export const ACCENTS = [
  { id: "terracotta", label: "Terracotta", swatch: "#C05B3C" },
  { id: "olive", label: "Olive", swatch: "#7A8450" },
  { id: "indigo", label: "Indigo", swatch: "#5B6BB4" },
  { id: "plum", label: "Plum", swatch: "#9A5B78" },
  { id: "amber", label: "Amber", swatch: "#B97E2C" },
  { id: "teal", label: "Teal", swatch: "#4E8A7A" },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];

const AccentContext = createContext<{
  accent: AccentId;
  setAccent: (a: AccentId) => void;
}>({ accent: "terracotta", setAccent: () => {} });

export function useAccent() {
  return useContext(AccentContext);
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentId>(() => {
    const saved = localStorage.getItem("lifeos-accent");
    return (ACCENTS.find((a) => a.id === saved)?.id ?? "terracotta") as AccentId;
  });

  const setAccent = useCallback((a: AccentId) => {
    setAccentState(a);
    localStorage.setItem("lifeos-accent", a);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);

  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <AccentContext.Provider value={{ accent, setAccent }}>
        {children}
      </AccentContext.Provider>
    </NextThemesProvider>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex items-center gap-1 rounded-full border border-border p-1">
      {(["light", "dark", "system"] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          aria-label={`${t} theme`}
          className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors min-h-[32px] ${
            theme === t
              ? "bg-brand-soft text-brand-ink"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
