import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { useRedirectIfAuthenticated, resolveHomePath } from "@/hooks/use-session-redirect";
import { signIn, signUp } from "@/lib/api/auth";
import {
  sanitizeInput,
  validatePassword,
  isValidEmail,
  getLoginLock,
  recordFailedLogin,
  clearLoginAttempts,
} from "@/lib/security";

type AuthSearch = { mode?: "login" | "register"; redirect?: string; ref?: string };

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): AuthSearch => ({
    mode: search.mode === "register" ? "register" : search.mode === "login" ? "login" : undefined,
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — TrueNorth Financial" },
      {
        name: "description",
        content: "Sign in or open a TrueNorth Financial investment account with email and password.",
      },
      { property: "og:title", content: "Sign in — TrueNorth Financial" },
      {
        property: "og:description",
        content: "Access your TrueNorth Financial portfolio securely.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [referral, setReferral] = useState(search.ref ?? "");
  const [loading, setLoading] = useState(false);
  useRedirectIfAuthenticated();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleanedEmail = sanitizeInput(email).toLowerCase();
    const cleanedName = sanitizeInput(name);
    const cleanedReferral = sanitizeInput(referral).toUpperCase();

    if (!isValidEmail(cleanedEmail)) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (mode === "register") {
      if (cleanedName.length < 2) {
        toast.error("Enter your full name.");
        return;
      }
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        toast.error(passwordCheck.reasons[0]);
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    } else {
      const lock = getLoginLock(cleanedEmail);
      if (lock.locked) {
        toast.error(`Too many failed attempts. Try again in ${lock.minutesRemaining} minute(s).`);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "register") {
        await signUp(cleanedEmail, password, {
          full_name: cleanedName,
          referral_code: cleanedReferral || undefined,
        });
        clearLoginAttempts(cleanedEmail);
        toast.success("Account created", {
          description: "Your wallet is ready and your $1,000 welcome bonus has been credited.",
        });
        navigate({ to: await resolveHomePath(), replace: true });
      } else {
        await signIn(cleanedEmail, password);
        clearLoginAttempts(cleanedEmail);
        toast.success("Welcome back");
        const home = await resolveHomePath();
        navigate({ to: (search.redirect as "/dashboard") ?? home, replace: true });
      }
    } catch (err) {
      if (mode === "login") {
        const state = recordFailedLogin(cleanedEmail);
        if (state.locked) {
          toast.error(`Account temporarily locked. Try again in ${state.minutesRemaining} minute(s).`);
        } else {
          toast.error("Invalid email or password.", {
            description: `${state.attemptsRemaining} attempt(s) remaining before a temporary lock.`,
          });
        }
      } else {
        const raw = err instanceof Error ? err.message : "";
        const duplicate = /already|registered|exists/i.test(raw);
        toast.error(
          duplicate ? "An account with this email already exists." : "Could not create your account.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      {/* Hero panel */}
      <aside className="glass-blue relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
        <Link to="/">
          <BrandLockup tone="invert" />
        </Link>
        <div className="relative">
          <div className="mb-6 h-px w-24 bg-gold" />
          <p className="font-display text-4xl font-medium leading-tight text-white">
            "The best time to plant a tree was twenty years ago. The second best time is today."
          </p>
          <p className="mt-6 text-sm text-white/60">— Ancient proverb, on compounding</p>
        </div>
        <div className="text-xs text-white/40">
          TrueNorth Financial Private Wealth · Capital at risk · Regulated custodians
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex flex-col p-6 sm:p-10">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="lg:hidden">
            <BrandLockup compact />
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl font-semibold text-navy">
            {mode === "login" ? "Welcome back" : "Open your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Sign in to manage your portfolio."
              : "Start investing in minutes. No paperwork."}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-foreground">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  maxLength={100}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Alexander Vance"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-foreground">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-medium text-foreground">
                  Password
                </label>
                {mode === "login" && (
                  <Link
                    to="/forgot-password"
                    className="text-xs font-medium text-royal hover:underline"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <input
                id="password"
                type="password"
                required
                minLength={mode === "register" ? 12 : 8}
                autoComplete={mode === "register" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
              {mode === "register" && (
                <p className="mt-1.5 text-[0.7rem] text-muted-foreground">
                  At least 12 characters with upper and lower case, a number and a symbol.
                </p>
              )}
            </div>

            {mode === "register" && (
              <>
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    minLength={12}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label
                    htmlFor="referral"
                    className="mb-1.5 block text-xs font-medium text-foreground"
                  >
                    Referral code <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <input
                    id="referral"
                    type="text"
                    maxLength={24}
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                    className={`${inputClass} uppercase`}
                    placeholder="TNF1A2B3"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-royal px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              {mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "login" ? "New to TrueNorth Financial?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="font-medium text-royal hover:underline"
            >
              {mode === "login" ? "Open an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
