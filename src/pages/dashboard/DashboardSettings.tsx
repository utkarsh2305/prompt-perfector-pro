import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Alert } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";

export default function DashboardSettings() {
  const { user, profile, updatePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async () => {
    setError(null);

    if (newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setError("Passwords do not match.");
    }

    setIsSubmitting(true);
    const { error: updateError } = await updatePassword({ newPassword });
    setIsSubmitting(false);

    if (updateError) {
      return setError(
        (updateError as { message?: string })?.message ?? "Could not update password. Please try again."
      );
    }

    toast({
      title: "Password updated",
      description: "Your password has been changed successfully.",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Manage your account settings and password.</p>
        </div>

        <DashboardNav className="mt-6" />

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="pp-surface rounded-xl border p-5">
            <div className="text-sm font-semibold">Account</div>
            <div className="mt-3 text-sm text-muted-foreground">Email: {user?.email ?? "—"}</div>
            <div className="mt-1 text-sm text-muted-foreground">Tier: {String(profile?.tier ?? "free")}</div>
          </Card>

          <Card className="pp-surface rounded-xl border p-5">
            <div className="text-sm font-semibold">Privacy</div>
            <p className="mt-3 text-sm text-muted-foreground">Your analyses are protected by Supabase Auth + RLS.</p>
          </Card>

          <Card className="pp-surface rounded-xl border p-5 lg:col-span-2">
            <div className="text-base font-semibold">Change Password</div>
            <p className="mt-1 text-sm text-muted-foreground">Update your password to keep your account secure.</p>

            <div className="mt-5 space-y-4 max-w-md">
              {error ? (
                <Alert className="border-border bg-background">
                  <div className="text-sm">{error}</div>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New password</Label>
                <PasswordInput
                  id="newPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <PasswordInput
                  id="confirmPassword"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button
                variant="hero"
                size="xl"
                type="button"
                disabled={isSubmitting}
                onClick={handleChangePassword}
              >
                {isSubmitting ? "Updating…" : "Update password"}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
