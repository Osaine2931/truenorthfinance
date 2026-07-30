import { useState } from "react";
import { cn } from "@/lib/utils";

/** Single source of truth for the brand logo asset. Served from /public → works in dev + prod. */
export const LOGO_URL = "/logo.png";

/** Professional fallback used whenever the logo asset fails to load. */
function LogoFallback({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-royal to-sky text-white",
        "font-display text-[0.6em] font-extrabold tracking-tight",
        className,
      )}
    >
      TNF
    </span>
  );
}

export function BrandMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <LogoFallback className={cn("size-9", className)} />;

  return (
    <img
      src={LOGO_URL}
      alt="TrueNorth Financial logo"
      onError={() => setFailed(true)}
      decoding="async"
      className={cn("size-9 shrink-0 object-contain", className)}
      width={512}
      height={512}
    />
  );
}

export function BrandLockup({
  className,
  tone = "default",
  compact = false,
}: {
  className?: string;
  tone?: "default" | "invert";
  compact?: boolean;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className={cn(compact ? "size-9" : "size-12")} />
      <span className="min-w-0 leading-tight">
        <span
          className={cn(
            "block truncate font-display text-[1.15rem] font-bold tracking-tight",
            tone === "invert" ? "text-white" : "text-navy",
          )}
        >
          TRUENORTH
        </span>
        <span
          className={cn(
            "block truncate text-[0.7rem] font-semibold uppercase tracking-[0.22em]",
            tone === "invert" ? "text-white/70" : "text-royal",
          )}
        >
          Financial
        </span>
      </span>
    </span>
  );
}

export function BrandSplash({ label = "Loading your portfolio" }: { label?: string }) {
  return (
    <div className="grid min-h-[60vh] place-items-center px-6">
      <div className="flex flex-col items-center gap-4 text-center animate-fade-up">
        <span className="relative grid place-items-center">
          <span className="absolute size-24 animate-ping rounded-full bg-royal/10" />
          <BrandMark className="relative size-16" />
        </span>
        <p className="font-display text-lg font-semibold text-navy">TRUENORTH FINANCIAL</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
