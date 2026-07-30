import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-navy sm:text-3xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  className,
  bodyClassName,
  children,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("surface-card overflow-hidden rounded-2xl", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-base font-semibold text-navy">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "default",
  loading,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "primary" | "success";
  loading?: boolean;
}) {
  return (
    <div
      className={cn(
        "hover-lift surface-card rounded-2xl p-4 sm:p-5",
        tone === "primary" && "border-royal/25 bg-royal-soft/60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            tone === "success" ? "bg-success/10 text-success" : "bg-royal-soft text-royal",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-7 w-28 rounded-lg" />
      ) : (
        <p
          className={cn(
            "mt-2 font-display text-2xl font-semibold tracking-tight text-navy",
            tone === "success" && "text-success",
          )}
        >
          {value}
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone =
    status === "approved" || status === "completed" || status === "active"
      ? "bg-success/10 text-success"
      : status === "rejected" || status === "failed"
        ? "bg-destructive/10 text-destructive"
        : "bg-warning/10 text-warning";
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        tone,
      )}
    >
      {status}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-royal-soft text-royal">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="font-medium text-navy">{title}</p>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function RowsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded-xl" />
      ))}
    </div>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-royal focus:ring-2 focus:ring-ring";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_var(--color-royal)] transition hover:-translate-y-0.5 hover:opacity-95 disabled:pointer-events-none disabled:opacity-50";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-navy transition hover:border-royal disabled:opacity-50";
