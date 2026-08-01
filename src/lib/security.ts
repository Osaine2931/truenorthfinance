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

  return {
    valid: reasons.length === 0,
    reasons,
  };
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
