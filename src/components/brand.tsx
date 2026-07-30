import logo from "@/assets/truenorth-logo.asset.json";
import { cn } from "@/lib/utils";

export const LOGO_URL = logo.url;

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="TrueNorth Financial logo"
      className={cn("size-9 shrink-0 rounded-xl object-contain", className)}
      width={72}
      height={72}
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
      <BrandMark
        className={cn(compact ? "size-9" : "size-12", tone === "invert" && "bg-white/90 p-1")}
      />
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
