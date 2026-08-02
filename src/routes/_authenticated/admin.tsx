import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  Receipt,
  Megaphone,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  Power,
  ShieldAlert,
  BarChart3,
  Search,
  Wallet as WalletIcon,
  ScrollText,
  Send,
  Gift,
  Ban,
  CheckCircle2,
  PauseCircle,
} from "lucide-react";
import {
  useAdminUsers,
  useAdminWallets,
  useAdminDeposits,
  useAdminWithdrawals,
  useAdminTransactions,
  useAdminInvestments,
  useAdminReferrals,
  useAdminAnnouncements,
  useAdminSettings,
  useAuditLogs,
  useSavePlan,
  useDeletePlan,
  useTogglePlan,
  useReviewDeposit,
  useReviewWithdrawal,
  useSaveAnnouncement,
  useSaveSetting,
  useSetUserStatus,
  useUpdateUserDetails,
  useDeleteUser,
  useAdjustWallet,
  useSetReferralStatus,
  useRewardReferral,
  useBroadcastNotification,
  type UserStatus,
  type WalletField,
} from "@/lib/api/admin";
import {
  useIsAdmin,
  usePlans,
  formatCurrency,
  formatDateTime,
  type Plan,
  type Profile,
} from "@/lib/api";
import type { MonitoringSnapshot } from "@/lib/automation";
import {
  PageHeader,
  SectionCard,
  StatCard,
  StatusPill,
  EmptyState,
  RowsSkeleton,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — TrueNorth Financial" },
      {
        name: "description",
        content: "Administer users, wallets, deposits, withdrawals and investment plans.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  beforeLoad: async ({ context }) => {
    if (!context.isAdmin) throw new Error("Administrator access required");
  },
  component: AdminPage,
});

const TABS = [
  "Overview",
  "Users",
  "Wallets",
  "Deposits",
  "Withdrawals",
  "Plans",
  "Transactions",
  "Referrals",
  "Notifications",
  "Announcements",
  "Audit log",
  "System status",
  "Settings",
] as const;
type Tab = (typeof TABS)[number];

function AdminPage() {
  const isAdmin = useIsAdmin();
  const [tab, setTab] = useState<Tab>("Overview");

  if (isAdmin.isLoading) {
    return <RowsSkeleton rows={5} />;
  }

  if (!isAdmin.data) {
    return (
      <SectionCard>
        <EmptyState
          icon={ShieldAlert}
          title="Administrator access required"
          description="Your account does not have the admin role."
        />
      </SectionCard>
    );
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Admin Dashboard"
        subtitle="Operate TrueNorth Financial without touching code."
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t
                ? "bg-royal text-white"
                : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview />}
      {tab === "Users" && <UsersTab />}
      {tab === "Wallets" && <WalletsTab />}
      {tab === "Deposits" && <DepositsTab />}
      {tab === "Withdrawals" && <WithdrawalsTab />}
      {tab === "Plans" && <PlansTab />}
      {tab === "Transactions" && <TransactionsTab />}
      {tab === "Referrals" && <ReferralsTab />}
      {tab === "Notifications" && <NotificationsTab />}
      {tab === "Announcements" && <AnnouncementsTab />}
      {tab === "Audit log" && <AuditTab />}
      {tab === "System status" && <SystemStatusTab />}
      {tab === "Settings" && <SettingsTab />}
    </div>
  );
}

/* ---------------- Overview / reports ---------------- */

function Overview() {
  const users = useAdminUsers();
  const wallets = useAdminWallets();
  const deposits = useAdminDeposits();
  const withdrawals = useAdminWithdrawals();
  const investments = useAdminInvestments();
  const referrals = useAdminReferrals();
  const plans = usePlans(false);
  const [monitoring, setMonitoring] = useState<MonitoringSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/monitoring");
        const payload = (await response.json()) as { snapshot?: MonitoringSnapshot };
        if (!cancelled && payload.snapshot) {
          setMonitoring(payload.snapshot);
        }
      } catch {
        if (!cancelled) {
          setMonitoring({
            apiStatus: "Degraded",
            databaseStatus: "Checking",
            activeSessions: 0,
            onlineUsers: 0,
            apiResponseTime: 0,
            failedLoginAttempts: 0,
            failedPaymentAttempts: 0,
            failedEmailDeliveries: 0,
            recentErrors: 0,
            scheduledJobsStatus: "Checking",
          });
        }
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const w = wallets.data ?? [];
  const totalDeposited = w.reduce((s, x) => s + Number(x.total_deposited), 0);
  const totalBalances = w.reduce((s, x) => s + Number(x.available_balance), 0);
  const totalBonus = w.reduce((s, x) => s + Number(x.welcome_bonus), 0);
  const totalInvested = (investments.data ?? []).reduce((s, i) => s + Number(i.amount), 0);
  const paidWithdrawals = (withdrawals.data ?? [])
    .filter((x) => x.status === "approved")
    .reduce((s, x) => s + Number(x.amount), 0);
  const pendingDeposits = (deposits.data ?? []).filter((d) => d.status === "pending").length;
  const pendingWithdrawals = (withdrawals.data ?? []).filter((x) => x.status === "pending").length;
  const activeUsers = (users.data ?? []).filter((u) => (u.status ?? "active") === "active").length;
  const revenue = totalDeposited - paidWithdrawals;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total users"
          value={String(users.data?.length ?? 0)}
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Active users"
          value={String(activeUsers)}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Total deposits"
          value={formatCurrency(totalDeposited)}
          icon={ArrowDownToLine}
        />
        <StatCard
          label="Total withdrawals"
          value={formatCurrency(paidWithdrawals)}
          icon={ArrowUpFromLine}
        />
        <StatCard label="Total invested" value={formatCurrency(totalInvested)} icon={Layers} />
        <StatCard
          label="Platform revenue"
          value={formatCurrency(revenue)}
          icon={BarChart3}
          tone="primary"
        />
        <StatCard label="Held balances" value={formatCurrency(totalBalances)} icon={WalletIcon} />
        <StatCard label="Welcome bonuses" value={formatCurrency(totalBonus)} icon={Gift} />
        <StatCard label="Pending deposits" value={String(pendingDeposits)} icon={ArrowDownToLine} />
        <StatCard
          label="Pending withdrawals"
          value={String(pendingWithdrawals)}
          icon={ArrowUpFromLine}
        />
        <StatCard label="Referrals" value={String(referrals.data?.length ?? 0)} icon={Users} />
        <StatCard
          label="Active plans"
          value={`${(plans.data ?? []).filter((p) => p.is_active).length}/${plans.data?.length ?? 0}`}
          icon={Layers}
          tone="success"
        />
      </div>

      <SectionCard title="System health monitoring" description="Auto-refreshing operational overview for the launch environment.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            ["API status", monitoring?.apiStatus ?? "Checking"],
            ["Database", monitoring?.databaseStatus ?? "Checking"],
            ["Active sessions", String(monitoring?.activeSessions ?? 0)],
            ["Online users", String(monitoring?.onlineUsers ?? 0)],
            ["Response time", `${monitoring?.apiResponseTime ?? 0} ms`],
            ["Failed logins", String(monitoring?.failedLoginAttempts ?? 0)],
            ["Failed payments", String(monitoring?.failedPaymentAttempts ?? 0)],
            ["Failed emails", String(monitoring?.failedEmailDeliveries ?? 0)],
            ["Recent errors", String(monitoring?.recentErrors ?? 0)],
            ["Scheduled jobs", monitoring?.scheduledJobsStatus ?? "Checking"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-border/70 bg-secondary/50 p-3">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 font-semibold text-navy">{value}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ---------------- Users ---------------- */

function UsersTab() {
  const users = useAdminUsers();
  const wallets = useAdminWallets();
  const setStatus = useSetUserStatus();
  const updateUser = useUpdateUserDetails();
  const deleteUser = useDeleteUser();
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const walletFor = (uid: string) => (wallets.data ?? []).find((w) => w.user_id === uid);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = users.data ?? [];
    if (!q) return list;
    return list.filter(
      (u) =>
        (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q),
    );
  }, [users.data, query]);

  return (
    <SectionCard
      title="User management"
      description="Search, edit, activate, ban or remove members."
      bodyClassName="p-0"
    >
      <div className="border-b border-border/60 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      {users.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : filtered.length ? (
        <ul>
          {filtered.map((u) => {
            const w = walletFor(u.user_id);
            const status = (u.status ?? "active") as UserStatus;
            const open = openId === u.id;
            return (
              <li key={u.id} className="border-b border-border/60 px-5 py-4 last:border-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    className="min-w-0 text-left"
                    onClick={() => setOpenId(open ? null : u.id)}
                  >
                    <p className="truncate font-medium text-navy">{u.full_name ?? "Investor"}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email} · ref {u.referral_code}
                    </p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusPill status={status} />
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(w?.available_balance)} · bonus{" "}
                      {formatCurrency(w?.welcome_bonus, 0)}
                    </span>
                    <button onClick={() => setOpenId(open ? null : u.id)} className={btnGhost}>
                      {open ? "Close" : "Manage"}
                    </button>
                  </div>
                </div>

                {open && (
                  <div className="mt-4 grid gap-4 rounded-2xl bg-muted/40 p-4 lg:grid-cols-2">
                    <UserDetailsForm
                      user={u}
                      onSave={(patch) =>
                        updateUser.mutate(
                          { user: u, patch },
                          { onSuccess: () => toast.success("Profile updated") },
                        )
                      }
                    />
                    <WalletAdjustForm user={u} />
                    <div className="lg:col-span-2 flex flex-wrap gap-2">
                      {(["active", "suspended", "banned"] as UserStatus[]).map((s) => (
                        <button
                          key={s}
                          disabled={status === s}
                          onClick={() =>
                            setStatus.mutate(
                              { user: u, status: s },
                              { onSuccess: () => toast.success(`Account ${s}`) },
                            )
                          }
                          className={`${btnGhost} disabled:opacity-40`}
                        >
                          {s === "active" ? (
                            <CheckCircle2 className="size-4" />
                          ) : s === "suspended" ? (
                            <PauseCircle className="size-4" />
                          ) : (
                            <Ban className="size-4" />
                          )}
                          {s === "active" ? "Activate" : s === "suspended" ? "Suspend" : "Ban"}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          if (
                            !window.confirm(`Permanently delete ${u.email}? This cannot be undone.`)
                          )
                            return;
                          deleteUser.mutate(u, {
                            onSuccess: () => toast.success("Account deleted"),
                            onError: (e) =>
                              toast.error(e instanceof Error ? e.message : "Delete failed"),
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs font-semibold text-destructive"
                      >
                        <Trash2 className="size-4" /> Delete account
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try a different search term."
        />
      )}
    </SectionCard>
  );
}

function UserDetailsForm({
  user,
  onSave,
}: {
  user: Profile;
  onSave: (patch: Partial<Pick<Profile, "full_name" | "phone" | "country" | "email">>) => void;
}) {
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    country: user.country ?? "",
  });

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Profile details
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Full name">
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Email">
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Country">
          <input
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className={inputClass}
          />
        </Field>
      </div>
      <button onClick={() => onSave(form)} className={btnGhost}>
        Save details
      </button>
    </div>
  );
}

function WalletAdjustForm({ user }: { user: Profile }) {
  const adjust = useAdjustWallet();
  const [field, setField] = useState<WalletField>("available_balance");
  const [direction, setDirection] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Manual wallet adjustment
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Field label="Fund">
          <select
            value={field}
            onChange={(e) => setField(e.target.value as WalletField)}
            className={inputClass}
          >
            <option value="available_balance">Available balance</option>
            <option value="welcome_bonus">Welcome bonus</option>
          </select>
        </Field>
        <Field label="Action">
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "credit" | "debit")}
            className={inputClass}
          >
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>
        </Field>
        <Field label="Amount (USD)">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className={inputClass}
          />
        </Field>
        <Field label="Reason" hint="Recorded in the audit log">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <button
        disabled={adjust.isPending}
        onClick={() =>
          adjust.mutate(
            { user, field, direction, amount, reason },
            {
              onSuccess: () => {
                toast.success("Wallet adjusted");
                setAmount(0);
                setReason("");
              },
              onError: (e) => toast.error(e instanceof Error ? e.message : "Adjustment failed"),
            },
          )
        }
        className={btnPrimary}
      >
        <WalletIcon className="size-4" /> Apply adjustment
      </button>
    </div>
  );
}

/* ---------------- Wallets ---------------- */

function WalletsTab() {
  const users = useAdminUsers();
  const wallets = useAdminWallets();
  const nameFor = (uid: string) => (users.data ?? []).find((u) => u.user_id === uid);

  return (
    <SectionCard
      title="Wallets"
      description="Every member wallet with deposited funds and promotional bonus."
      bodyClassName="p-0"
    >
      {wallets.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : wallets.data?.length ? (
        <ul>
          {wallets.data.map((w) => {
            const u = nameFor(w.user_id);
            return (
              <li
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{u?.full_name ?? "Investor"}</p>
                  <p className="truncate text-xs text-muted-foreground">{u?.email}</p>
                </div>
                <div className="flex flex-wrap gap-4 text-right text-xs">
                  <Metric label="Balance" value={formatCurrency(w.available_balance)} />
                  <Metric label="Bonus" value={formatCurrency(w.welcome_bonus)} />
                  <Metric label="Deposited" value={formatCurrency(w.total_deposited)} />
                  <Metric label="Invested" value={formatCurrency(w.total_invested)} />
                  <Metric label="Profit" value={formatCurrency(w.total_profit)} />
                  <Metric label="Referrals" value={formatCurrency(w.referral_earnings)} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={WalletIcon} title="No wallets yet" />
      )}
    </SectionCard>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-semibold text-navy">{value}</p>
    </div>
  );
}

/* ---------------- Deposits ---------------- */

function DepositsTab() {
  const deposits = useAdminDeposits();
  const review = useReviewDeposit();
  const [filter, setFilter] = useState("all");

  const rows = (deposits.data ?? []).filter((d) => filter === "all" || d.status === filter);

  return (
    <SectionCard
      title="Deposits"
      description="Approving a deposit credits the member's wallet."
      bodyClassName="p-0"
    >
      <FilterBar
        value={filter}
        onChange={setFilter}
        options={["all", "pending", "approved", "rejected"]}
      />
      {deposits.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : rows.length ? (
        <ul>
          {rows.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-navy">
                  {formatCurrency(d.amount)} · {d.crypto_symbol} {d.network ? `(${d.network})` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {formatDateTime(d.created_at)} · {d.tx_hash ?? "no tx hash"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={d.status} />
                {d.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        review.mutate(
                          { deposit: d, status: "approved" },
                          { onSuccess: () => toast.success("Deposit approved") },
                        )
                      }
                      className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        review.mutate(
                          { deposit: d, status: "rejected" },
                          { onSuccess: () => toast.success("Deposit rejected") },
                        )
                      }
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ArrowDownToLine} title="No deposits" />
      )}
    </SectionCard>
  );
}

function FilterBar({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-border/60 p-4">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
            value === o ? "bg-royal text-white" : "border border-border text-muted-foreground"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------------- Withdrawals ---------------- */

function WithdrawalsTab() {
  const withdrawals = useAdminWithdrawals();
  const review = useReviewWithdrawal();
  const [filter, setFilter] = useState("all");
  const rows = (withdrawals.data ?? []).filter((w) => filter === "all" || w.status === filter);

  return (
    <SectionCard title="Withdrawals" bodyClassName="p-0">
      <FilterBar
        value={filter}
        onChange={setFilter}
        options={["all", "pending", "approved", "rejected"]}
      />
      {withdrawals.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : rows.length ? (
        <ul>
          {rows.map((w) => (
            <li
              key={w.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="font-medium text-navy">
                  {formatCurrency(w.amount)} · {w.crypto_symbol}
                </p>
                <p className="truncate text-xs text-muted-foreground">{w.destination_address}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={w.status} />
                {w.status === "pending" && (
                  <>
                    <button
                      onClick={() =>
                        review.mutate(
                          { withdrawal: w, status: "approved" },
                          { onSuccess: () => toast.success("Withdrawal approved") },
                        )
                      }
                      className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        review.mutate(
                          { withdrawal: w, status: "rejected" },
                          { onSuccess: () => toast.success("Withdrawal rejected") },
                        )
                      }
                      className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-semibold text-destructive"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ArrowUpFromLine} title="No withdrawal requests" />
      )}
    </SectionCard>
  );
}

/* ---------------- Plans ---------------- */

const emptyPlan = {
  name: "",
  description: "",
  category: "Balanced",
  min_amount: 1000,
  max_amount: null as number | null,
  roi_percent: 2,
  roi_period: "monthly" as Plan["roi_period"],
  duration_days: 90,
  risk_level: "Moderate",
  is_active: true,
  featured: false,
};

function PlansTab() {
  const plans = usePlans(false);
  const savePlan = useSavePlan();
  const deletePlan = useDeletePlan();
  const togglePlan = useTogglePlan();
  const [draft, setDraft] = useState<typeof emptyPlan & { id?: string }>(emptyPlan);

  async function save() {
    if (!draft.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    try {
      await savePlan.mutateAsync(draft as Partial<Plan> & { name: string });
      toast.success(draft.id ? "Plan updated" : "Plan created");
      setDraft(emptyPlan);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
      <SectionCard title={draft.id ? "Edit plan" : "Create plan"}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name">
            <input
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <input
              value={draft.category ?? ""}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Minimum investment">
            <input
              type="number"
              value={draft.min_amount}
              onChange={(e) => setDraft({ ...draft, min_amount: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Maximum investment" hint="Leave 0 for unlimited">
            <input
              type="number"
              value={draft.max_amount ?? 0}
              onChange={(e) => setDraft({ ...draft, max_amount: Number(e.target.value) || null })}
              className={inputClass}
            />
          </Field>
          <Field label="ROI %">
            <input
              type="number"
              step="0.01"
              value={draft.roi_percent}
              onChange={(e) => setDraft({ ...draft, roi_percent: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="ROI period">
            <select
              value={draft.roi_period}
              onChange={(e) =>
                setDraft({ ...draft, roi_period: e.target.value as Plan["roi_period"] })
              }
              className={inputClass}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </Field>
          <Field label="Duration (days)">
            <input
              type="number"
              value={draft.duration_days}
              onChange={(e) => setDraft({ ...draft, duration_days: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Risk level">
            <input
              value={draft.risk_level ?? ""}
              onChange={(e) => setDraft({ ...draft, risk_level: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            rows={2}
            value={draft.description ?? ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            className={inputClass}
          />
        </Field>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
            />
            Featured
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={save} disabled={savePlan.isPending} className={btnPrimary}>
            <Plus className="size-4" /> {draft.id ? "Update plan" : "Create plan"}
          </button>
          {draft.id && (
            <button onClick={() => setDraft(emptyPlan)} className={btnGhost}>
              Cancel
            </button>
          )}
        </div>
      </SectionCard>

      <SectionCard title="All plans" bodyClassName="p-0">
        {plans.isLoading ? (
          <div className="p-5">
            <RowsSkeleton />
          </div>
        ) : plans.data?.length ? (
          <ul>
            {plans.data.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {Number(p.roi_percent)}% {p.roi_period} · {p.duration_days}d · min{" "}
                    {formatCurrency(p.min_amount, 0)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusPill status={p.is_active ? "active" : "inactive"} />
                  <button
                    onClick={() =>
                      setDraft({
                        id: p.id,
                        name: p.name,
                        description: p.description ?? "",
                        category: p.category ?? "",
                        min_amount: Number(p.min_amount),
                        max_amount: p.max_amount ? Number(p.max_amount) : null,
                        roi_percent: Number(p.roi_percent),
                        roi_period: p.roi_period,
                        duration_days: p.duration_days,
                        risk_level: p.risk_level ?? "",
                        is_active: p.is_active,
                        featured: p.featured,
                      })
                    }
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => togglePlan.mutate({ id: p.id, is_active: !p.is_active })}
                    className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground"
                    aria-label="Toggle plan"
                  >
                    <Power className="size-3.5" />
                  </button>
                  <button
                    onClick={() =>
                      deletePlan.mutate(p.id, { onSuccess: () => toast.success("Plan deleted") })
                    }
                    className="grid size-8 place-items-center rounded-lg bg-destructive/10 text-destructive"
                    aria-label="Delete plan"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Layers} title="No plans yet" />
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Transactions ---------------- */

function TransactionsTab() {
  const transactions = useAdminTransactions();
  const users = useAdminUsers();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");

  const emailFor = (uid: string) => (users.data ?? []).find((u) => u.user_id === uid)?.email ?? "";

  const rows = (transactions.data ?? []).filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return emailFor(t.user_id).toLowerCase().includes(q) || t.type.toLowerCase().includes(q);
  });

  return (
    <SectionCard title="Platform transactions" bodyClassName="p-0">
      <FilterBar
        value={status}
        onChange={setStatus}
        options={["all", "pending", "completed", "failed"]}
      />
      <div className="border-b border-border/60 p-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by member email or type"
          className={inputClass}
        />
      </div>
      {transactions.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : rows.length ? (
        <ul>
          {rows.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{t.type}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {emailFor(t.user_id)} · {formatDateTime(t.created_at)}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${t.direction === "in" ? "text-success" : "text-navy"}`}
                >
                  {formatCurrency(t.amount)}
                </p>
                <StatusPill status={t.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Receipt} title="No transactions" />
      )}
    </SectionCard>
  );
}

/* ---------------- Referrals ---------------- */

function ReferralsTab() {
  const referrals = useAdminReferrals();
  const users = useAdminUsers();
  const setStatus = useSetReferralStatus();
  const reward = useRewardReferral();
  const [amounts, setAmounts] = useState<Record<string, number>>({});

  const emailFor = (uid: string) =>
    (users.data ?? []).find((u) => u.user_id === uid)?.email ?? "Member";

  return (
    <SectionCard
      title="Referral programme"
      description="Reward or suspend referral relationships."
      bodyClassName="p-0"
    >
      {referrals.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : referrals.data?.length ? (
        <ul>
          {referrals.data.map((r) => {
            const status = (r.status ?? "active") as "active" | "suspended";
            return (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {emailFor(r.referrer_id)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    referred {emailFor(r.referred_id)} · earned {formatCurrency(r.earnings)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill status={status} />
                  <input
                    type="number"
                    value={amounts[r.id] ?? 0}
                    onChange={(e) => setAmounts({ ...amounts, [r.id]: Number(e.target.value) })}
                    className={`${inputClass} w-28`}
                  />
                  <button
                    onClick={() =>
                      reward.mutate(
                        { referral: r, amount: amounts[r.id] ?? 0 },
                        {
                          onSuccess: () => {
                            toast.success("Referral rewarded");
                            setAmounts({ ...amounts, [r.id]: 0 });
                          },
                          onError: (e) =>
                            toast.error(e instanceof Error ? e.message : "Reward failed"),
                        },
                      )
                    }
                    className={btnGhost}
                  >
                    <Gift className="size-4" /> Reward
                  </button>
                  <button
                    onClick={() =>
                      setStatus.mutate(
                        { referral: r, status: status === "active" ? "suspended" : "active" },
                        { onSuccess: () => toast.success("Referral updated") },
                      )
                    }
                    className={btnGhost}
                  >
                    {status === "active" ? "Suspend" : "Reactivate"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Users} title="No referrals yet" />
      )}
    </SectionCard>
  );
}

/* ---------------- Notifications ---------------- */

function NotificationsTab() {
  const users = useAdminUsers();
  const broadcast = useBroadcastNotification();
  const [form, setForm] = useState({ title: "", body: "", kind: "info" });
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (uid: string) =>
    setSelected((prev) => (prev.includes(uid) ? prev.filter((x) => x !== uid) : [...prev, uid]));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard
        title="Send notification"
        description="Leave recipients empty to notify every member."
      >
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Message">
          <textarea
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Type">
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            className={inputClass}
          >
            <option value="info">Information</option>
            <option value="success">Success</option>
            <option value="warning">Maintenance / warning</option>
            <option value="error">Critical</option>
          </select>
        </Field>
        <button
          disabled={broadcast.isPending}
          onClick={() =>
            broadcast.mutate(
              { ...form, userIds: selected },
              {
                onSuccess: (count) => {
                  toast.success(`Sent to ${count} member${count === 1 ? "" : "s"}`);
                  setForm({ title: "", body: "", kind: "info" });
                  setSelected([]);
                },
                onError: (e) => toast.error(e instanceof Error ? e.message : "Send failed"),
              },
            )
          }
          className={`${btnPrimary} mt-4`}
        >
          <Send className="size-4" />{" "}
          {selected.length ? `Send to ${selected.length} selected` : "Send to all members"}
        </button>
      </SectionCard>

      <SectionCard
        title="Recipients"
        description="Optional — pick specific members."
        bodyClassName="p-0"
      >
        {users.isLoading ? (
          <div className="p-5">
            <RowsSkeleton />
          </div>
        ) : (
          <ul className="max-h-[420px] overflow-y-auto">
            {(users.data ?? []).map((u) => (
              <li
                key={u.id}
                className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(u.user_id)}
                  onChange={() => toggle(u.user_id)}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy">
                    {u.full_name ?? "Investor"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Announcements ---------------- */

function AnnouncementsTab() {
  const announcements = useAdminAnnouncements();
  const save = useSaveAnnouncement();
  const [form, setForm] = useState({ title: "", body: "" });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="New announcement">
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Message">
          <textarea
            rows={4}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            className={inputClass}
          />
        </Field>
        <button
          onClick={() =>
            save.mutate(form, {
              onSuccess: () => {
                toast.success("Announcement published");
                setForm({ title: "", body: "" });
              },
            })
          }
          className={`${btnPrimary} mt-4`}
        >
          <Megaphone className="size-4" /> Publish
        </button>
      </SectionCard>
      <SectionCard title="Published" bodyClassName="p-0">
        {announcements.data?.length ? (
          <ul>
            {announcements.data.map((a) => (
              <li key={a.id} className="border-b border-border/60 px-5 py-4 last:border-0">
                <p className="font-medium text-navy">{a.title}</p>
                <p className="text-sm text-muted-foreground">{a.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatDateTime(a.created_at)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={Megaphone} title="No announcements" />
        )}
      </SectionCard>
    </div>
  );
}

/* ---------------- Audit log ---------------- */

function AuditTab() {
  const logs = useAuditLogs();
  return (
    <SectionCard
      title="Administrator audit log"
      description="Every manual action, who performed it and why."
      bodyClassName="p-0"
    >
      {logs.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : logs.data?.length ? (
        <ul>
          {logs.data.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy">{l.action}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {l.admin_email ?? "admin"} → {l.target_email ?? l.target_user_id ?? "platform"}
                  {l.reason ? ` · ${l.reason}` : ""}
                </p>
              </div>
              <div className="text-right">
                {l.amount != null && (
                  <p className="text-sm font-semibold text-navy">{formatCurrency(l.amount)}</p>
                )}
                <p className="text-[11px] text-muted-foreground">{formatDateTime(l.created_at)}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={ScrollText} title="No admin actions recorded yet" />
      )}
    </SectionCard>
  );
}

/* ---------------- Settings ---------------- */

function SystemStatusTab() {
  return (
    <div className="space-y-4">
      <SectionCard title="System status" description="Live diagnostics and service health.">
        <div className="rounded-2xl border border-border/70 bg-secondary/40 p-4 text-sm text-muted-foreground">
          Open the dedicated system status experience for live checks, logs, SMTP diagnostics, and NOWPayments health.
        </div>
      </SectionCard>
    </div>
  );
}

function SettingsTab() {
  const settings = useAdminSettings();
  const save = useSaveSetting();
  const [edits, setEdits] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <ClearDevelopmentUsersCard />
      <SectionCard title="Site settings" description="Platform-wide values used across the app.">

      {settings.isLoading ? (
        <RowsSkeleton rows={3} />
      ) : (
        <div className="space-y-3">
          {(settings.data ?? []).map((s) => (
            <div key={s.key} className="flex flex-wrap items-end gap-2">
              <Field label={s.key}>
                <input
                  value={edits[s.key] ?? s.value ?? ""}
                  onChange={(e) => setEdits({ ...edits, [s.key]: e.target.value })}
                  className={inputClass}
                />
              </Field>
              <button
                onClick={() =>
                  save.mutate(
                    { key: s.key, value: edits[s.key] ?? s.value ?? "" },
                    { onSuccess: () => toast.success(`${s.key} saved`) },
                  )
                }
                className={btnGhost}
              >
                <SettingsIcon className="size-4" /> Save
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
