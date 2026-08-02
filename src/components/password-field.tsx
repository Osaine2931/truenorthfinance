import { getPasswordStrength, getPasswordValidationSummary } from "@/lib/security";

/** Live requirement checklist + strength meter shared by every password form. */
export function PasswordRequirements({ password }: { password: string }) {
  if (!password) return null;
  const { checklist } = getPasswordValidationSummary(password);
  const strength = getPasswordStrength(password);

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border/70 bg-secondary/60 p-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${strength.barClass}`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <span className="font-medium text-foreground">{strength.label}</span>
      </div>
      {checklist.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={item.ok ? "text-emerald-600" : "text-amber-600"}>
            {item.ok ? "●" : "○"}
          </span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
