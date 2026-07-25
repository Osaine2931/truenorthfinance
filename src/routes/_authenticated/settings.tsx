import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Aurelian" }] }),
  component: Settings,
});

function Settings() {
  const [twoFa, setTwoFa] = useState(false);
  const [emails, setEmails] = useState(true);
  const [dark, setDark] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Settings</h1>
      </div>
      <div className="surface-card divide-y divide-border">
        <Toggle
          label="Two-factor authentication"
          desc="Add an extra layer of security to your account."
          value={twoFa}
          onChange={(v) => {
            setTwoFa(v);
            toast.success(v ? "2FA enabled" : "2FA disabled");
          }}
        />
        <Toggle
          label="Email notifications"
          desc="Portfolio updates, dividends, and account activity."
          value={emails}
          onChange={setEmails}
        />
        <Toggle
          label="Dark mode"
          desc="Use a darker theme in low-light environments."
          value={dark}
          onChange={(v) => {
            setDark(v);
            document.documentElement.classList.toggle("dark", v);
          }}
        />
      </div>
    </div>
  );
}

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? "bg-royal" : "bg-muted"
        }`}
        aria-pressed={value}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            value ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
