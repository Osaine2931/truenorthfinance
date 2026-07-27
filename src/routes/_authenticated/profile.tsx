import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { useProfile, useUpdateProfile, useWallet, formatCurrency, formatDate } from "@/lib/api";
import { PageHeader, SectionCard, Field, inputClass, btnPrimary } from "@/components/ui-kit";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — TrueNorth Financial" },
      { name: "description", content: "Manage your investor profile and contact details." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const profile = useProfile();
  const wallet = useWallet();
  const update = useUpdateProfile();
  const [form, setForm] = useState({ full_name: "", phone: "", country: "" });

  useEffect(() => {
    if (profile.data) {
      setForm({
        full_name: profile.data.full_name ?? "",
        phone: profile.data.phone ?? "",
        country: profile.data.country ?? "",
      });
    }
  }, [profile.data]);

  async function save() {
    try {
      await update.mutateAsync(form);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  }

  const initials = (form.full_name || profile.data?.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader title="Profile" subtitle="Your investor identity at TrueNorth Financial." />

      <SectionCard>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-16 place-items-center rounded-2xl bg-royal text-lg font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-display text-xl font-semibold text-navy">{form.full_name || "Investor"}</p>
            <p className="truncate text-sm text-muted-foreground">{profile.data?.email}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
              <ShieldCheck className="size-3" /> Verified member since {formatDate(profile.data?.created_at)}
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
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Country">
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Referral code">
            <input value={profile.data?.referral_code ?? ""} readOnly className={`${inputClass} bg-secondary`} />
          </Field>
        </div>
        <button onClick={save} disabled={update.isPending} className={`${btnPrimary} mt-5`}>
          {update.isPending && <Loader2 className="size-4 animate-spin" />} Save changes
        </button>
      </SectionCard>
    </div>
  );
}
