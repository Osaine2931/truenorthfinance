import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { MarketHeroCanvas } from "@/components/market-hero";
import { useRedirectIfAuthenticated } from "@/hooks/use-session-redirect";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TrueNorth Financial — Private Wealth Investment Platform" },
      {
        name: "description",
        content:
          "TrueNorth Financial is a premium long-term investment platform. Curated funds, transparent ROI, private-banker service.",
      },
      { property: "og:title", content: "TrueNorth Financial — Private Wealth" },
      {
        property: "og:description",
        content: "Curated funds. Transparent ROI. Private-banker service.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  useRedirectIfAuthenticated();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/">
            <BrandLockup />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#plans" className="hover:text-foreground">
              Plans
            </a>
            <a href="#why" className="hover:text-foreground">
              Why TrueNorth
            </a>
            <a href="#security" className="hover:text-foreground">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent sm:inline-flex"
            >
              Login
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" } as never}
              className="inline-flex items-center gap-1.5 rounded-lg bg-royal px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Get Started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#F8FAFC_0%,#FFFFFF_100%)]">
          <div className="pointer-events-none absolute inset-0 animate-[pulse_9s_ease-in-out_infinite] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(124,200,255,0.35),transparent_70%)]" />

          <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-14 text-center md:pt-20">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-royal/20 bg-royal-soft px-3 py-1 text-xs font-medium text-royal">
              <Sparkles className="size-3" />
              Private wealth, made accessible
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl md:text-6xl">
              TRUENORTH FINANCIAL
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground sm:text-base">
              Secure Wealth • Long-Term Investments • Financial Growth
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "register" } as never}
                className="inline-flex items-center gap-2 rounded-xl bg-royal px-7 py-3.5 text-sm font-semibold text-white shadow-[0_20px_40px_-18px_var(--color-royal)] transition-transform hover:-translate-y-0.5"
              >
                Get Started
                <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Animated market visual — decorative branding only */}
          <div className="relative mx-auto max-w-6xl px-5 pb-16 md:pb-20">
            <div className="relative h-[220px] overflow-hidden rounded-[20px] border border-border/70 bg-white/60 shadow-[0_30px_80px_-40px_rgba(77,163,255,0.55)] backdrop-blur-sm sm:h-[280px] md:h-[360px]">
              <MarketHeroCanvas />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.85),transparent_18%,transparent_82%,rgba(255,255,255,0.85))]" />
            </div>
          </div>
        </section>

        <section id="why" className="border-y border-border/60 bg-card">
          <div className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Transparent ROI",
                body: "Every strategy publishes historical performance, target ROI, and lock-up terms.",
              },
              {
                icon: ShieldCheck,
                title: "Regulated custody",
                body: "Client funds are held with tier-one custodians and independently audited quarterly.",
              },
              {
                icon: Sparkles,
                title: "Private-banker care",
                body: "A dedicated relationship manager for every account, from onboarding to withdrawals.",
              },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-background p-6">
                <div className="grid size-10 place-items-center rounded-lg bg-royal-soft text-royal">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-xl font-semibold text-navy">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="plans" className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <div className="mb-10 text-center">
            <h2 className="font-display text-4xl font-semibold text-navy md:text-5xl">
              Curated investment plans
            </h2>
            <p className="mt-3 text-muted-foreground">
              Sign in to view live returns, subscribe, and track progress.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { name: "Blue Chip Reserve", roi: "9–11% p.a.", risk: "Low" },
              { name: "Prime Real Estate", roi: "12–15% p.a.", risk: "Low" },
              { name: "Emerging Tech Venture", roi: "18–24% p.a.", risk: "High" },
            ].map((p) => (
              <div key={p.name} className="surface-card p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {p.risk} risk
                </p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-navy">{p.name}</h3>
                <p className="mt-6 text-3xl font-semibold text-royal">{p.roi}</p>
                <p className="text-xs text-muted-foreground">Target annualised ROI</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="border-t border-border/60 bg-royal text-white">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">
              A quieter way to build wealth.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Open an account in minutes. No noise, no day-trading — just long-term investment, done
              properly.
            </p>
            <Link
              to="/auth"
              search={{ mode: "register" } as never}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-royal hover:opacity-90"
            >
              Open your account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} TrueNorth Financial. All rights reserved.</p>
          <p className="text-xs">
            Capital at risk. Past performance is not indicative of future returns.
          </p>
        </div>
      </footer>
    </div>
  );
}
