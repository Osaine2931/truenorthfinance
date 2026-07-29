export const MIN_DEPOSIT = 1000;

export const BONUS_NOTICE =
  "Complete your first deposit of at least $1,000 to unlock investment plans. Your $1,000 Welcome Bonus is for promotional purposes and cannot be used to purchase investments.";

export function formatCurrency(value: number | string | null | undefined, digits = 2) {
  const n = Number(value ?? 0);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatCompact(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return `$${n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
