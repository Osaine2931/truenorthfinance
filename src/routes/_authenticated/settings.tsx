import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { PageHeader, SectionCard, Field, inputClass, btnPrimary } from "@/components/ui-kit";
import { PasswordRequirements } from "@/components/password-field";
import { changePassword } from "@/lib/api/auth";
import { getPasswordValidationSummary } from "@/lib/security";


export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — TrueNorth Financial" }] }),
  component: Settings,
});

function Settings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [language, setLanguage] = useState("en");
  const [emails, setEmails] = useState(true);
  const [security, setSecurity] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("tn-theme") as "light" | "dark" | null;
    if (stored) setTheme(stored === "dark" ? "dark" : "light");
  }, []);

  function updateTheme(value: "light" | "dark" | "system") {
    setTheme(value);
    const resolved = value === "dark" ? "dark" : value === "light" ? "light" : "light";
    document.documentElement.classList.toggle("dark", resolved === "dark");
    localStorage.setItem("tn-theme", resolved);
    toast.success(`Theme set to ${value}`);
  }

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your workspace preferences and security controls."
      />
      <SectionCard title="Preferences">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Theme">
            <select
              value={theme}
              onChange={(e) => updateTheme(e.target.value as "light" | "dark" | "system")}
              className={inputClass}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </Field>
          <Field label="Language">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={inputClass}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </Field>
        </div>
      </SectionCard>
      <SectionCard title="Notifications & security">
        <div className="space-y-3">
          <Toggle
            label="Email notifications"
            desc="Receive updates about wallet changes and investment progress."
            value={emails}
            onChange={setEmails}
          />
          <Toggle
            label="Security alerts"
            desc="Get notified for password changes and unusual activity."
            value={security}
            onChange={setSecurity}
          />
        </div>
      </SectionCard>
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
