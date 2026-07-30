import { useMemo } from "react";
import { cn } from "@/lib/utils";

const FALLBACK_TEXT = "TRUENORTH FINANCIAL";
const FALLBACK_ICON = "TNF";

export function Logo({ className, compact = false, tone = "default" }: { className?: string; compact?: boolean; tone?: "default" | "invert" }) {
  const fallback = useMemo(() => ({ icon: FALLBACK_ICON, text: FALLBACK_TEXT }), []);

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl border border-royal/20 bg-royal-soft font-semibold text-royal", tone === "invert" && "border-white/20 bg-white/15 text-white") }>
        <span className="text-[0.7rem] font-black tracking-[0.22em]">{fallback.icon}</span>
      </div>
      <div className="min-w-0 leading-tight">
        <div className={cn("truncate font-display text-[1rem] font-bold tracking-tight", tone === "invert" ? "text-white" : "text-navy")}>{fallback.text.split(" ")[0]}</div>
        <div className={cn("truncate text-[0.7rem] font-semibold uppercase tracking-[0.22em]", tone === "invert" ? "text-white/70" : "text-royal")}>{fallback.text.split(" ").slice(1).join(" ")}</div>
      </div>
    </div>
  );
}
