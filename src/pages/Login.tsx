import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NavLink } from "@/components/NavLink";
import { Alert } from "@/components/ui/alert";

const Login = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-md">
            <Card className="pp-surface rounded-xl border p-6">
              <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Auth will be powered by Lovable Cloud once connected.
              </p>

              <div className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" />
                </div>

                <Button variant="hero" size="xl" className="w-full" type="button">
                  Sign in
                </Button>

                <Alert className="border-border bg-background">
                  <div className="text-sm text-muted-foreground">
                    For now this is UI-only. After connecting Lovable Cloud, we’ll wire up email/password auth and protect
                    the dashboard.
                  </div>
                </Alert>

                <div className="text-center text-sm text-muted-foreground">
                  Want to test the app without auth?{" "}
                  <NavLink to="/dashboard" className="text-primary underline underline-offset-4">
                    Go to dashboard
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
