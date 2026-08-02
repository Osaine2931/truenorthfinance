import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/brand";
import { PasswordRequirements } from "@/components/password-field";
import { updatePassword } from "@/lib/api/auth";
import { getPasswordValidationSummary, validatePassword } from "@/lib/security";


export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — TrueNorth Financial" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordValidation = getPasswordValidationSummary(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.reasons[0]);
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      toast.success("Password updated");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <BrandLockup className="mb-6" />
        <h1 className="font-display text-3xl font-semibold text-navy">Set a new password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose a strong password to secure your account.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="New password"
          />
          <PasswordRequirements password={password} />

          <button
            type="submit"
            disabled={loading || !passwordValidation.valid}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-royal px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="size-4 animate-spin" />}
            Update password
          </button>
        </form>
      </div>
    </div>
  );
}
