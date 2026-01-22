import { useState } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

const Signup = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
              <p className="mt-2 text-sm text-muted-foreground">Coming soon: Supabase-powered signup.</p>

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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  type="button"
                  onClick={() => signUp({ email, password })}
                >
                  Create account
                </Button>

                <Alert className="border-border bg-background">
                  <div className="text-sm text-muted-foreground">
                    This is placeholder UI. Next step is wiring up Supabase auth and profiles.
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
