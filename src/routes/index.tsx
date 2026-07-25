import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, TrendingUp, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aurelian — Private Wealth Investment Platform" },
      {
        name: "description",
        content:
          "Aurelian is a premium long-term investment platform. Curated funds, transparent ROI, private-banker service.",
      },
      { property: "og:title", content: "Aurelian — Private Wealth" },
      {
        property: "og:description",
        content: "Curated funds. Transparent ROI. Private-banker service.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-navy">
              <div className="size-3 rotate-45 border-2 border-gold" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-navy">
              Aurelian
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#plans" className="hover:text-foreground">Plans</a>
            <a href="#why" className="hover:text-foreground">Why Aurelian</a>
            <a href="#security" className="hover:text-foreground">Security</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent sm:inline-flex"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              search={{ mode: "register" } as never}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            >
              Open account
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-28">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold-soft px-3 py-1 text-xs font-medium text-navy">
                <Sparkles className="size-3 text-gold" />
                Private wealth, made accessible
              </div>
              <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-navy md:text-7xl">
                Grow your capital with the calm of a private bank.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-base text-muted-foreground md:text-lg">
                Aurelian curates long-term investment strategies across real estate, blue-chip equities,
                sustainable energy and venture — with transparent ROI and dedicated support.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/auth"
                  search={{ mode: "register" } as never}
                  className="inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white shadow-elevated transition-transform hover:-translate-y-0.5"
                >
                  Start investing
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#plans"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:bg-accent"
                >
                  View plans
                </a>
              </div>
              <div className="gold-hairline mx-auto mt-16 w-40" />
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
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{p.risk} risk</p>
                <h3 className="mt-2 font-display text-2xl font-semibold text-navy">{p.name}</h3>
                <p className="mt-6 text-3xl font-semibold text-royal">{p.roi}</p>
                <p className="text-xs text-muted-foreground">Target annualised ROI</p>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="border-t border-border/60 bg-navy text-white">
          <div className="mx-auto max-w-4xl px-5 py-16 text-center md:py-20">
            <h2 className="font-display text-4xl font-semibold md:text-5xl">
              A quieter way to build wealth.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-white/70">
              Open an account in minutes. No noise, no day-trading — just long-term investment,
              done properly.
            </p>
            <Link
              to="/auth"
              search={{ mode: "register" } as never}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-medium text-navy hover:opacity-90"
            >
              Open your account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Aurelian. All rights reserved.</p>
          <p className="text-xs">Capital at risk. Past performance is not indicative of future returns.</p>
        </div>
      </footer>
    </div>
  );
}
