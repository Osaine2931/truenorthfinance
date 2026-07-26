import { useState, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, Bell, Search, LogOut, Plus } from "lucide-react";
import { primaryNav, bottomNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Route as AuthRoute } from "@/routes/_authenticated/route";

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = AuthRoute.useRouteContext();

  const initials = (user.user_metadata?.full_name ?? user.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const displayName = (user.user_metadata?.full_name as string) ?? user.email ?? "Investor";

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <div className="grid size-8 place-items-center rounded-md bg-white/10">
            <div className="size-3 rotate-45 border-2 border-gold" />
          </div>
          <span className="font-display text-xl font-semibold text-white">TrueNorth Financial</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {primaryNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-white/10 font-medium text-white"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
                {active && <span className="ml-auto size-1 rounded-full bg-gold" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-medium text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-white/50">Premium account</p>
            </div>
            <button
              onClick={handleSignOut}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-royal/60" onClick={() => setMobileNav(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2">
                <div className="grid size-8 place-items-center rounded-md bg-white/10">
                  <div className="size-3 rotate-45 border-2 border-gold" />
                </div>
                <span className="font-display text-xl font-semibold text-white">TrueNorth Financial</span>
              </div>
              <button
                onClick={() => setMobileNav(false)}
                className="grid size-8 place-items-center rounded-lg text-white/60 hover:bg-white/10"
              >
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {primaryNav.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileNav(false)}
                    className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
                      active ? "bg-white/10 font-medium text-white" : "text-white/60"
                    }`}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={handleSignOut}
              className="m-4 flex items-center justify-center gap-2 rounded-lg bg-white/10 py-2.5 text-sm font-medium text-white"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileNav(true)}
              className="grid size-9 place-items-center rounded-lg border border-border bg-card lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="hidden min-w-0 items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 md:flex">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search plans, transactions..."
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="col-start-2 md:hidden" />
            <div className="flex items-center gap-2">
              <Link
                to="/notifications"
                className="relative grid size-9 place-items-center rounded-lg border border-border bg-card text-foreground hover:bg-accent"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-gold" />
              </Link>
              <Link
                to="/deposit"
                className="hidden items-center gap-1.5 rounded-lg bg-royal px-3 py-2 text-sm font-medium text-white hover:opacity-90 sm:inline-flex"
              >
                <Plus className="size-4" />
                Deposit
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/60 bg-background/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        {bottomNav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium ${
                active ? "text-royal" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
