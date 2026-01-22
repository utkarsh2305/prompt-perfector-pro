import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink } from "@/components/NavLink";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Login = () => {
  const { signIn } = useAuth();
  const { trackAuth, trackError } = useAnalytics();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const handleLogin = async () => {
    setError(null);
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setIsSubmitting(true);
    const { error: signInError } = await signIn({ email, password });
    setIsSubmitting(false);

    if (signInError) {
      const errorMessage = (signInError as { message?: string })?.message ?? "Sign in failed";
      trackError("error_encountered", {
        error_code: "auth_error",
        error_message: errorMessage,
        location: "login",
      });
      return setError(errorMessage);
    }

    trackAuth("user_logged_in", { method: "email" });
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to your Prompt Perfector account.
              </p>

              <div className="mt-5 space-y-4">
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
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleLogin}
                >
                  {isSubmitting ? "Signing in…" : "Sign in"}
                </Button>

                {error ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">{error}</div>
                  </Alert>
                ) : null}

                <div className="text-center text-sm text-muted-foreground">
                  <NavLink to="/forgot-password" className="text-primary underline underline-offset-4">
                    Forgot password?
                  </NavLink>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  Don't have an account?{" "}
                  <NavLink to="/signup" className="text-primary underline underline-offset-4">
                    Create one
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

export default Login;
