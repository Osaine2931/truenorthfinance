import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
} from "lucide-react";
import {
  useAdminUsers,
  useAdminWallets,
  useAdminDeposits,
  useAdminWithdrawals,
  useAdminTransactions,
  useAdminReferrals,
  useAdminAnnouncements,
  useAdminSettings,
  useSavePlan,
  useDeletePlan,
  useTogglePlan,
  useReviewDeposit,
  useReviewWithdrawal,
  useSaveAnnouncement,
  useSaveSetting,
} from "@/lib/admin-api";
import { useIsAdmin, usePlans, formatCurrency, formatDateTime, type Plan } from "@/lib/api";
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
      { name: "description", content: "Administer users, wallets, deposits, withdrawals and investment plans." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  "Overview",
  "Users",
  "Deposits",
  "Withdrawals",
  "Plans",
  "Transactions",
  "Announcements",
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
      <PageHeader title="Admin Dashboard" subtitle="Operate TrueNorth Financial without touching code." />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "bg-royal text-white" : "border border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview />}
      {tab === "Users" && <UsersTab />}
      {tab === "Deposits" && <DepositsTab />}
      {tab === "Withdrawals" && <WithdrawalsTab />}
      {tab === "Plans" && <PlansTab />}
      {tab === "Transactions" && <TransactionsTab />}
      {tab === "Announcements" && <AnnouncementsTab />}
      {tab === "Settings" && <SettingsTab />}
    </div>
  );
}

function Overview() {
  const users = useAdminUsers();
  const wallets = useAdminWallets();
  const deposits = useAdminDeposits();
  const withdrawals = useAdminWithdrawals();
  const referrals = useAdminReferrals();
  const plans = usePlans(false);

  const totalDeposited = (wallets.data ?? []).reduce((s, w) => s + Number(w.total_deposited), 0);
  const totalBalances = (wallets.data ?? []).reduce((s, w) => s + Number(w.available_balance), 0);
  const pendingDeposits = (deposits.data ?? []).filter((d) => d.status === "pending").length;
  const pendingWithdrawals = (withdrawals.data ?? []).filter((w) => w.status === "pending").length;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="Members" value={String(users.data?.length ?? 0)} icon={Users} tone="primary" />
      <StatCard label="Total deposited" value={formatCurrency(totalDeposited)} icon={ArrowDownToLine} />
      <StatCard label="Held balances" value={formatCurrency(totalBalances)} icon={BarChart3} />
      <StatCard label="Referrals" value={String(referrals.data?.length ?? 0)} icon={Users} />
      <StatCard label="Pending deposits" value={String(pendingDeposits)} icon={ArrowDownToLine} />
      <StatCard label="Pending withdrawals" value={String(pendingWithdrawals)} icon={ArrowUpFromLine} />
      <StatCard label="Investment plans" value={String(plans.data?.length ?? 0)} icon={Layers} />
      <StatCard
        label="Active plans"
        value={String((plans.data ?? []).filter((p) => p.is_active).length)}
        icon={Layers}
        tone="success"
      />
    </div>
  );
}

function UsersTab() {
  const users = useAdminUsers();
  const wallets = useAdminWallets();
  const walletFor = (uid: string) => (wallets.data ?? []).find((w) => w.user_id === uid);

  return (
    <SectionCard title="Users & wallets" bodyClassName="p-0">
      {users.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : users.data?.length ? (
        <ul>
          {users.data.map((u) => {
            const w = walletFor(u.user_id);
            return (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0">
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{u.full_name ?? "Investor"}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {u.email} · ref {u.referral_code}
                  </p>
                </div>
                <div className="flex gap-4 text-right text-xs">
                  <div>
                    <p className="text-muted-foreground">Balance</p>
                    <p className="font-semibold text-navy">{formatCurrency(w?.available_balance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Deposited</p>
                    <p className="font-semibold text-navy">{formatCurrency(w?.total_deposited)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bonus</p>
                    <p className="font-semibold text-navy">{formatCurrency(w?.welcome_bonus)}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={Users} title="No members yet" />
      )}
    </SectionCard>
  );
}

function DepositsTab() {
  const deposits = useAdminDeposits();
  const review = useReviewDeposit();

  return (
    <SectionCard title="Deposits" description="Approving a deposit credits the member's wallet." bodyClassName="p-0">
      {deposits.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : deposits.data?.length ? (
        <ul>
          {deposits.data.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0">
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
                        review.mutate({ deposit: d, status: "approved" }, { onSuccess: () => toast.success("Deposit approved") })
                      }
                      className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        review.mutate({ deposit: d, status: "rejected" }, { onSuccess: () => toast.success("Deposit rejected") })
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

function WithdrawalsTab() {
  const withdrawals = useAdminWithdrawals();
  const review = useReviewWithdrawal();

  return (
    <SectionCard title="Withdrawals" bodyClassName="p-0">
      {withdrawals.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : withdrawals.data?.length ? (
        <ul>
          {withdrawals.data.map((w) => (
            <li key={w.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0">
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
                        review.mutate({ withdrawal: w, status: "approved" }, { onSuccess: () => toast.success("Withdrawal approved") })
                      }
                      className="rounded-lg bg-success/10 px-3 py-1.5 text-xs font-semibold text-success"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() =>
                        review.mutate({ withdrawal: w, status: "rejected" }, { onSuccess: () => toast.success("Withdrawal rejected") })
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
  const [draft, setDraft] = useState<(typeof emptyPlan) & { id?: string }>(emptyPlan);

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
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={inputClass} />
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
              onChange={(e) => setDraft({ ...draft, roi_period: e.target.value as Plan["roi_period"] })}
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
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4 last:border-0">
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
                    onClick={() => deletePlan.mutate(p.id, { onSuccess: () => toast.success("Plan deleted") })}
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

function TransactionsTab() {
  const transactions = useAdminTransactions();
  return (
    <SectionCard title="Platform transactions" bodyClassName="p-0">
      {transactions.isLoading ? (
        <div className="p-5">
          <RowsSkeleton />
        </div>
      ) : transactions.data?.length ? (
        <ul>
          {transactions.data.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 last:border-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-navy">{t.type}</p>
                <p className="truncate text-xs text-muted-foreground">{formatDateTime(t.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${t.direction === "in" ? "text-success" : "text-navy"}`}>
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

function AnnouncementsTab() {
  const announcements = useAdminAnnouncements();
  const save = useSaveAnnouncement();
  const [form, setForm] = useState({ title: "", body: "" });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="New announcement">
        <Field label="Title">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Message">
          <textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={inputClass} />
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
                <p className="mt-1 text-[11px] text-muted-foreground">{formatDateTime(a.created_at)}</p>
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

function SettingsTab() {
  const settings = useAdminSettings();
  const save = useSaveSetting();
  const [edits, setEdits] = useState<Record<string, string>>({});

  return (
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
