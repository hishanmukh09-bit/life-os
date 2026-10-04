import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** SVG progress ring — signature element for daily progress. */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  label,
  sub,
  className,
}: {
  value: number; // 0-100
  size?: number;
  stroke?: number;
  label?: string;
  sub?: string;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(pct)} percent complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: "hsl(var(--muted))" }}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (c * pct) / 100}
          style={{ stroke: "hsl(var(--brand))", transition: "stroke-dashoffset 600ms ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {label != null && (
          <span className="font-display font-semibold" style={{ fontSize: size / 4 }}>
            {label}
          </span>
        )}
        {sub && <span className="eyebrow mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("eyebrow", className)}>{children}</div>;
}

export function SectionTitle({
  children,
  eyebrow,
  title,
  right,
  className,
}: {
  children?: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  if (eyebrow || title) {
    return (
      <div className={cn("flex items-end justify-between gap-3 mb-3", className)}>
        <div>
          {eyebrow && <p className="eyebrow eyebrow-accent">{eyebrow}</p>}
          {title && <h2 className="font-display mt-0.5 text-lg font-semibold">{title}</h2>}
        </div>
        {right}
      </div>
    );
  }
  return (
    <div className={cn("flex items-end justify-between gap-3 mb-3", className)}>
      <h2 className="eyebrow">{children}</h2>
      {right}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  body,
  action,
}: {
  title: string;
  hint?: string;
  body?: string;
  action?: ReactNode;
}) {
  hint = hint ?? body;
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-8 text-center">
      <p className="font-display text-lg">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
}) {
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="mt-1 font-display text-xl font-medium leading-none">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** Soft chip / badge */
export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "success" | "warning" | "danger" | "info";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-secondary-foreground",
    brand: "bg-brand-soft text-brand-ink",
    success: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
    warning: "bg-[hsl(var(--warning)/0.14)] text-[hsl(var(--warning))]",
    danger: "bg-[hsl(var(--destructive)/0.12)] text-[hsl(var(--destructive))]",
    info: "bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
