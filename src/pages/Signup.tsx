import { useState } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { Alert } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
              <p className="mt-2 text-sm text-muted-foreground">Create your Prompt Perfector account.</p>

              <div className="mt-5 space-y-4">
                {error ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">{error}</div>
                  </Alert>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Alex Johnson"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm password</Label>
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
                  disabled={isSubmitting}
                  onClick={async () => {
                    setError(null);
                    if (!fullName.trim()) return setError("Full name is required.");
                    if (!email.trim()) return setError("Email is required.");
                    if (password.length < 8) return setError("Password must be at least 8 characters.");
                    if (password !== confirmPassword) return setError("Passwords do not match.");

                    setIsSubmitting(true);
                    const { error: signUpError } = await signUp({ email, password, fullName });
                    setIsSubmitting(false);
                    if (signUpError) return setError((signUpError as { message?: string })?.message ?? "Sign up failed");

                    navigate("/dashboard");
                  }}
                >
                  {isSubmitting ? "Creating account…" : "Create account"}
                </Button>

                <Alert className="border-border bg-background">
                  <div className="text-sm text-muted-foreground">
                    If email confirmations are enabled in Supabase, you may need to confirm your email before signing in.
                  </div>
                </Alert>

                <div className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <NavLink to="/login" className="text-primary underline underline-offset-4">
                    Sign in
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

export default Signup;
