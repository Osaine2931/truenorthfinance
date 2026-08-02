export function sanitizeInput(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 && code !== 127 && char !== "<" && char !== ">";
    })
    .join("")
    .trim();
}

export function validatePassword(password: string) {
  const reasons: string[] = [];
  if (password.length < 8) reasons.push("Use at least 8 characters.");
  if (!/[A-Z]/.test(password)) reasons.push("Include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) reasons.push("Include at least one lowercase letter.");
  if (!/\d/.test(password)) reasons.push("Include at least one number.");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    reasons.push("Include at least one special character.");
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}

export function getPasswordValidationSummary(password: string) {
  const checklist = [
    { label: "8+ characters", ok: password.length >= 8 },
    { label: "Uppercase", ok: /[A-Z]/.test(password) },
    { label: "Lowercase", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /\d/.test(password) },
    { label: "Special character", ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ];

  return {
    valid: checklist.every((item) => item.ok),
    checklist,
  };
}

/** Strength meter shared by registration, reset and change-password forms. */
export function getPasswordStrength(password: string) {
  const { checklist } = getPasswordValidationSummary(password);
  let score = checklist.filter((item) => item.ok).length;
  if (password.length >= 14) score += 1;
  const percent = Math.min(100, Math.round((score / 6) * 100));
  if (score <= 2) return { score, percent, label: "Weak", barClass: "bg-destructive" };
  if (score <= 4) return { score, percent, label: "Fair", barClass: "bg-amber-500" };
  if (score === 5) return { score, percent, label: "Strong", barClass: "bg-emerald-500" };
  return { score, percent, label: "Excellent", barClass: "bg-emerald-600" };
}


export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) && email.length <= 255;
}

/**
 * Client-side throttle for repeated failed sign-in attempts.
 * Defence-in-depth only — the auth service enforces the authoritative limits.
 */
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const STORE_KEY = "tnf.login.attempts";

type AttemptRecord = { count: number; lockedUntil?: number };

function readStore(): Record<string, AttemptRecord> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORE_KEY) ?? "{}") as Record<
      string,
      AttemptRecord
    >;
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, AttemptRecord>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable */
  }
}

export function getLoginLock(email: string) {
  const record = readStore()[email];
  const lockedUntil = record?.lockedUntil ?? 0;
  const locked = lockedUntil > Date.now();
  return {
    locked,
    minutesRemaining: locked ? Math.ceil((lockedUntil - Date.now()) / 60000) : 0,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - (record?.count ?? 0)),
  };
}

export function recordFailedLogin(email: string) {
  const store = readStore();
  const count = (store[email]?.count ?? 0) + 1;
  const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MS : undefined;
  store[email] = { count: lockedUntil ? 0 : count, lockedUntil };
  writeStore(store);
  return {
    locked: Boolean(lockedUntil),
    minutesRemaining: lockedUntil ? Math.ceil(LOCK_MS / 60000) : 0,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - count),
  };
}

export function clearLoginAttempts(email: string) {
  const store = readStore();
  delete store[email];
  writeStore(store);
}
