import { useState } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
              <p className="mt-2 text-sm text-muted-foreground">We’ll email you a password reset link.</p>

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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setError(null);
                    setSuccess(null);
                    if (!email.trim()) return setError("Email is required.");

                    setIsSubmitting(true);
                    const { error: resetError } = await resetPassword({ email });
                    setIsSubmitting(false);

                    if (resetError) {
                      return setError(
                        (resetError as { message?: string })?.message ??
                          "Could not send reset email. Please try again.",
                      );
                    }

                    setSuccess("Check your email for a password reset link.");
                  }}
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <NavLink to="/login" className="text-primary underline underline-offset-4">
                    Back to sign in
                  </NavLink>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ForgotPassword;
