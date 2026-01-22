import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardAnalytics() {
  const { profile } = useAuth();
  const tier = (profile?.tier as string | undefined) ?? "free";

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analytics</h1>
          <p className="mt-2 text-sm text-muted-foreground">Deeper stats and insights (Pro feature).</p>
        </div>

        <DashboardNav className="mt-6" />

        {tier === "free" ? (
          <Card className="pp-surface mt-6 rounded-xl border p-6 relative overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 opacity-70" style={{ backgroundImage: "var(--gradient-brand)" }} />
            <div className="relative">
              <h2 className="text-lg font-semibold">Upgrade to Pro to unlock analytics</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Get usage patterns, score distributions, platform breakdowns, and personalized insights.
              </p>
              <div className="mt-5">
                <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
                  <NavLink to="/pricing">Upgrade now</NavLink>
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="pp-surface mt-6 rounded-xl border p-6">
            <p className="text-sm text-muted-foreground">Pro analytics UI coming next.</p>
          </Card>
        )}
      </div>
    </section>
  );
}
