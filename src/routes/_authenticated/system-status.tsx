import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  CircleDollarSign,
  Database,
  Download,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { PageHeader, SectionCard, btnGhost, btnPrimary } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/system-status")({
  head: () => ({
    meta: [
      { title: "System Status — TrueNorth Financial" },
      { name: "description", content: "Monitor external service health and diagnostics." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SystemStatusPage,
});

function StatusDot({ state }: { state: "ok" | "warn" | "error" }) {
  const classes = {
    ok: "bg-emerald-500",
    warn: "bg-amber-500",
    error: "bg-rose-500",
  }[state];

  return <span className={`inline-block size-2.5 rounded-full ${classes}`} />;
}

function SystemStatusPage() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/monitoring");
      const payload = await response.json();
      setSnapshot(payload.snapshot ?? payload);
      toast.success("Diagnostics refreshed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to refresh diagnostics");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const filteredLogs = useMemo(() => {
    const logs = snapshot?.logs ?? [];
    if (!query) return logs;
    return logs.filter((entry: any) =>
      JSON.stringify(entry).toLowerCase().includes(query.toLowerCase()),
    );
  }, [snapshot, query]);

  const serviceCards = [
    {
      label: "Database",
      value: snapshot?.databaseStatus ?? "Checking",
      state:
        snapshot?.databaseStatus === "Connected"
          ? "ok"
          : snapshot?.databaseStatus === "Checking"
            ? "warn"
            : "error",
      icon: Database,
    },
    {
      label: "Authentication",
      value: snapshot?.apiStatus ?? "Checking",
      state: snapshot?.apiStatus === "Operational" ? "ok" : "warn",
      icon: ShieldCheck,
    },
    {
      label: "Email",
      value: snapshot?.smtpConnected ? "Connected" : "Failed",
      state: snapshot?.smtpConnected ? "ok" : "error",
      icon: Mail,
    },
    {
      label: "Payments",
      value: snapshot?.paymentsConnected ? "Connected" : "Failed",
      state: snapshot?.paymentsConnected ? "ok" : "error",
      icon: CircleDollarSign,
    },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="System Status"
        subtitle="Live service health, diagnostics, and operational logs."
        action={
          <button
            onClick={() => void refresh()}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <RefreshCw className="size-4" /> Run Diagnostics
          </button>
        }
      />

      <SectionCard title="Service health">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {serviceCards.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-navy">
                    <Icon className="size-4 text-royal" />
                    {item.label}
                  </div>
                  <StatusDot state={item.state as "ok" | "warn" | "error"} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{item.value}</p>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Diagnostics details">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Activity className="size-4 text-royal" />
              Environment
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>Build version: {snapshot?.buildVersion ?? "dev"}</li>
              <li>Environment: {snapshot?.deploymentEnvironment ?? "development"}</li>
              <li>Uptime: {snapshot?.uptimeSeconds ?? 0}s</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Mail className="size-4 text-royal" />
              Email & payments
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>SMTP connected: {snapshot?.smtpConnected ? "Yes" : "No"}</li>
              <li>SMTP error: {snapshot?.smtpLastError ?? "None"}</li>
              <li>NOWPayments connected: {snapshot?.paymentsConnected ? "Yes" : "No"}</li>
            </ul>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Operational logs" bodyClassName="p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            <Search className="size-4 text-royal" />
            Logs
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search logs"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
            />
            <button
              className={`${btnGhost} inline-flex items-center gap-2`}
              onClick={() => {
                const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = "system-logs.json";
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="size-4" />
              Export
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-auto p-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : filteredLogs.length ? (
            filteredLogs.map((entry: any) => (
              <div
                key={entry.id}
                className="mb-3 rounded-xl border border-border/70 bg-card px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-navy">{entry.category}</span>
                  <span className="text-xs text-muted-foreground">{entry.timestamp}</span>
                </div>
                <p className="mt-1 text-muted-foreground">{entry.message}</p>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No logs available.</div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
