import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const ResetPassword = () => {
  const { session, updatePassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If the user lands here without a recovery session, prompt them to request a reset link.
    if (!isLoading && !session) {
      setError("Your reset link is invalid or expired. Please request a new one.");
    }
  }, [isLoading, session]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Set a new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">Choose a strong password (8+ characters).</p>

              <div className="mt-5 space-y-4">
                {error ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">{error}</div>
                  </Alert>
                ) : null}

                {success ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">{success}</div>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm new password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting || !session}
                  onClick={async () => {
                    setError(null);
                    setSuccess(null);

                    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
                    if (newPassword !== confirmPassword) return setError("Passwords do not match.");

                    setIsSubmitting(true);
                    const { error: updateError } = await updatePassword({ newPassword });
                    setIsSubmitting(false);

                    if (updateError) {
                      return setError(
                        (updateError as { message?: string })?.message ??
                          "Could not update password. Please try again.",
                      );
                    }

                    setSuccess("Password updated. Redirecting to dashboard…");
                    window.setTimeout(() => navigate("/dashboard"), 600);
                  }}
                >
                  {isSubmitting ? "Updating…" : "Update password"}
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ResetPassword;
