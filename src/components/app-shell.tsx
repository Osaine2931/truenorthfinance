import { useState, useEffect, type ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Menu, X, Bell, Search, LogOut, Plus, Moon, Sun, Wallet as WalletIcon } from "lucide-react";
import { primaryNav, bottomNav, adminNav } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Route as AuthRoute } from "@/routes/_authenticated/route";
import { BrandLockup } from "@/components/brand";
import { useWallet, useIsAdmin, useNotifications, formatCurrency } from "@/lib/api";
import { signOut } from "@/lib/api/auth";
import { useInvestmentAutomation, useLiveDataSync } from "@/lib/live-sync";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("tn-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("tn-theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileNav, setMobileNav] = useState(false);
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = AuthRoute.useRouteContext();
  const { dark, toggle } = useTheme();
  const wallet = useWallet();
  const isAdmin = useIsAdmin();
  const notifications = useNotifications(20);
  useLiveDataSync();
  useInvestmentAutomation();

  const unread = (notifications.data ?? []).filter((n) => !n.is_read).length;
  const navItems = isAdmin.data ? [...primaryNav, adminNav] : primaryNav;

  const displayName = (user.user_metadata?.full_name as string) ?? user.email ?? "Investor";
  const initials = displayName
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const navLinks = (onClick?: () => void) => (
    <nav className="flex-1 overflow-y-auto px-3 py-2">
      {navItems.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-200 ${
              active
                ? "bg-royal font-semibold text-white shadow-[0_10px_24px_-14px_var(--color-royal)]"
                : "text-muted-foreground hover:bg-royal-soft hover:text-navy"
            }`}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="truncate">{item.label}</span>
            {item.to === "/notifications" && unread > 0 && (
              <span className="ml-auto rounded-full bg-royal px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <Link to="/dashboard">
            <BrandLockup />
          </Link>
        </div>
        {navLinks()}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3 rounded-xl bg-secondary p-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-royal text-xs font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-navy">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {isAdmin.data ? "Administrator" : "Private client"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              aria-label="Log out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile slide-out drawer */}
      {mobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
            onClick={() => setMobileNav(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[17rem] flex-col bg-sidebar shadow-elevated animate-fade-up">
            <div className="flex items-center justify-between px-4 py-4">
              <BrandLockup compact />
              <button
                onClick={() => setMobileNav(false)}
                className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground"
                aria-label="Close menu"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="mx-4 mb-2 rounded-2xl bg-royal p-4 text-white">
              <p className="text-[10px] uppercase tracking-widest text-white/70">
                Available balance
              </p>
              <p className="font-display text-2xl font-semibold">
                {formatCurrency(wallet.data?.available_balance)}
              </p>
            </div>
            {navLinks(() => setMobileNav(false))}
            <button
              onClick={handleSignOut}
              className="m-3 flex items-center justify-center gap-2 rounded-xl bg-destructive/10 py-3 text-sm font-semibold text-destructive"
            >
              <LogOut className="size-4" />
              Log out
            </button>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-border/70 bg-background/80 backdrop-blur-xl">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6">
            <button
              onClick={() => setMobileNav(true)}
              className="grid size-10 place-items-center rounded-xl border border-border bg-card lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div className="hidden min-w-0 items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2.5 transition-colors focus-within:border-royal md:flex">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search plans, transactions, reports..."
                className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="col-start-2 md:hidden">
              <Link to="/dashboard" className="lg:hidden">
                <BrandLockup compact />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/wallet"
                className="hidden items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold text-navy transition-colors hover:border-royal sm:inline-flex"
              >
                <WalletIcon className="size-4 text-royal" />
                {formatCurrency(wallet.data?.available_balance)}
              </Link>
              <button
                onClick={toggle}
                className="grid size-10 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-navy"
                aria-label="Toggle theme"
              >
                {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
              <Link
                to="/notifications"
                className="relative grid size-10 place-items-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-royal"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-royal ring-2 ring-background" />
                )}
              </Link>
              <Link
                to="/deposit"
                className="hidden items-center gap-1.5 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-16px_var(--color-royal)] transition-transform hover:-translate-y-0.5 sm:inline-flex"
              >
                <Plus className="size-4" />
                Deposit
              </Link>
              <Link
                to="/profile"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-royal-soft text-xs font-semibold text-royal"
                aria-label="Profile"
              >
                {initials}
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border/70 bg-background/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-xl lg:hidden">
        {bottomNav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors ${
                active ? "text-royal" : "text-muted-foreground"
              }`}
            >
              <span
                className={`grid h-8 w-12 place-items-center rounded-xl transition-colors ${
                  active ? "bg-royal-soft" : ""
                }`}
              >
                <item.icon className="size-5" />
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
