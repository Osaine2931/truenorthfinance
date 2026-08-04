import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  ShieldCheck,
  UploadCloud,
  BellRing,
  KeyRound,
  MailPlus,
  UserCircle2,
} from "lucide-react";
import {
  useProfile,
  useUpdateProfile,
  useWallet,
  useKyc,
  useSubmitKyc,
  formatCurrency,
  formatDate,
} from "@/lib/api";
import {
  PageHeader,
  SectionCard,
  Field,
  inputClass,
  btnPrimary,
  btnGhost,
} from "@/components/ui-kit";
import { PasswordRequirements } from "@/components/password-field";
import { changePassword, updatePassword } from "@/lib/api/auth";
import { getPasswordValidationSummary } from "@/lib/security";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TrueNorth Financial" },
      { name: "description", content: "Manage your investor profile and contact details." },
      { property: "og:title", content: "Profile — TrueNorth Financial" },
      {
        property: "og:description",
        content: "Manage your investor profile and contact details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useProfile();
  const wallet = useWallet();
  const kyc = useKyc();
  const submitKyc = useSubmitKyc();
  const update = useUpdateProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", country: "" });
  const [kycLevel, setKycLevel] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (profile.data) {
      setForm({
        full_name: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
        country: profile.data.country ?? "",
      });
      setKycLevel(kyc.data?.level ?? 1);
      setNotes(kyc.data?.notes ?? "");
    }
  }, [profile.data, kyc.data]);

  async function save() {
    try {
      await update.mutateAsync(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function submitVerification() {
    try {
      await submitKyc.mutateAsync({ level: kycLevel, notes });
      toast.success("KYC request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "KYC submission failed");
    }
  }

  const initials = (form.full_name || profile.data?.email || "U").slice(0, 2).toUpperCase();
  const kycStatus = kyc.data?.status ?? "not_started";

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Profile" subtitle="Your investor identity at TrueNorth Financial." />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-royal text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-navy">
              {form.full_name || "Investor"}
            </p>
            <p className="truncate text-sm text-muted-foreground">{profile.data?.email}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <ShieldCheck className="size-3" /> Verified member since{" "}
              {formatDate(profile.data?.created_at)}
            </p>
          </div>
          <div className="ml-auto rounded-2xl bg-secondary px-4 py-3 text-right">
            <p className="text-xs text-muted-foreground">Available balance</p>
            <p className="font-display text-xl font-semibold text-navy">
              {formatCurrency(wallet.data?.available_balance)}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
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
          <Field label="Referral code">
            <input
              value={profile.data?.referral_code ?? ""}
              readOnly
              className={`${inputClass} bg-secondary`}
            />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={save} disabled={update.isPending} className={btnPrimary}>
            {update.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
          </button>
          <button className={btnGhost}>
            <MailPlus className="size-4" /> Verify email
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Verification & security">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-border/70 bg-secondary/50 p-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-royal" />
              <p className="text-sm font-semibold text-navy">KYC status: {kycStatus}</p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Complete Level 1 for basic verification, Level 2 with a government ID, and Level 3
              with a selfie.
            </p>
            <div className="mt-4 space-y-3">
              <Field label="Verification level">
                <select
                  value={kycLevel}
                  onChange={(e) => setKycLevel(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value={1}>Level 1 · Basic information</option>
                  <option value={2}>Level 2 · Government ID</option>
                  <option value={3}>Level 3 · Selfie verification</option>
                </select>
              </Field>
              <Field label="Notes">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputClass} min-h-24`}
                  placeholder="Add supporting context for your verification"
                />
              </Field>
            </div>
            <button
              onClick={submitVerification}
              disabled={submitKyc.isPending}
              className={`${btnPrimary} mt-4`}
            >
              {submitKyc.isPending && <Loader2 className="size-4 animate-spin" />} Submit
              verification
            </button>
          </div>
          <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <KeyRound className="size-4 text-royal" /> Security settings
            </div>
            <div className="rounded-xl bg-secondary/70 p-3 text-sm text-muted-foreground">
              Password updates, email verification, and notification preferences are managed from
              this secure profile area.
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 p-3 text-sm text-muted-foreground">
              <BellRing className="size-4 text-royal" /> Alerts enabled for wallet, investment, and
              trade updates
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border/70 p-3 text-sm text-muted-foreground">
              <UploadCloud className="size-4 text-royal" /> Upload support images from the support
              center
            </div>
          </div>
        </div>
      </SectionCard>
      <ProfilePasswordCard />
    </div>
  );
}

function ProfilePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const valid = getPasswordValidationSummary(next).valid;

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const providers = data.user?.app_metadata?.providers;
      setHasPassword(Array.isArray(providers) && providers.includes("email"));
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      if (hasPassword) {
        await changePassword(current, next);
        toast.success("Password changed", {
          description: "All other active sessions have been signed out.",
        });
      } else {
        await updatePassword(next);
        try {
          await supabase.auth.signOut({ scope: "others" });
        } catch (error) {
          console.error("[auth] failed to revoke other sessions", error);
        }
        setHasPassword(true);
        toast.success("Password created", {
          description: "You can now sign in with this email and password.",
        });
      }
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard
      title={hasPassword === false ? "Create a password" : "Change password"}
      description={
        hasPassword === false
          ? "This account was created with Google. Create a password to enable email and password sign-in."
          : "Verify your current password, then choose a new secure password."
      }
    >
      {hasPassword === null ? (
        <div className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Checking sign-in methods…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 p-5 md:max-w-md">
          {hasPassword && (
            <Field label="Current password">
              <input
                type="password"
                required
                autoComplete="current-password"
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
          )}
          <div>
            <Field label={hasPassword ? "New password" : "Password"}>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
            <PasswordRequirements password={next} />
          </div>
          <Field label={hasPassword ? "Confirm new password" : "Confirm password"}>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={inputClass}
              placeholder="••••••••"
            />
          </Field>
          <button
            type="submit"
            disabled={loading || !valid || next !== confirm || (hasPassword && !current)}
            className={`${btnPrimary} justify-center disabled:opacity-50`}
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            {hasPassword ? "Update password" : "Create password"}
          </button>
        </form>
      )}
    </SectionCard>
  );
}
