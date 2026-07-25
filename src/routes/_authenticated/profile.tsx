import { createFileRoute } from "@tanstack/react-router";
import { Route as AuthRoute } from "@/routes/_authenticated/route";
import { ShieldCheck, Mail, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Aurelian" }] }),
  component: Profile,
});

function Profile() {
  const { user } = AuthRoute.useRouteContext();
  const name = (user.user_metadata?.full_name as string) ?? "Investor";
  const initials = name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-navy sm:text-4xl">Profile</h1>
      </div>
      <div className="surface-card p-6">
        <div className="flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-navy font-display text-2xl font-semibold text-white">
            {initials}
          </div>
          <div>
            <p className="font-display text-2xl font-semibold text-navy">{name}</p>
            <p className="text-sm text-muted-foreground">Premium account · Verified</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Field icon={UserIcon} label="Full name" value={name} />
          <Field icon={Mail} label="Email" value={user.email ?? "—"} />
          <Field icon={ShieldCheck} label="KYC status" value="Verified" />
          <Field icon={ShieldCheck} label="2FA" value="Not enabled" />
        </div>
      </div>
    </div>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </p>
      <p className="mt-1 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}
