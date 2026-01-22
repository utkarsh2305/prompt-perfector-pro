import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";

export default function DashboardSettings() {
  const { user, profile } = useAuth();

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
          <p className="mt-2 text-sm text-muted-foreground">Account basics (more settings coming soon).</p>
        </div>

        <DashboardNav className="mt-6" />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="pp-surface rounded-xl border p-5">
            <div className="text-sm font-semibold">Account</div>
            <div className="mt-3 text-sm text-muted-foreground">Email: {user?.email ?? "—"}</div>
            <div className="mt-1 text-sm text-muted-foreground">Tier: {String(profile?.tier ?? "free")}</div>
          </Card>

          <Card className="pp-surface rounded-xl border p-5">
            <div className="text-sm font-semibold">Privacy</div>
            <p className="mt-3 text-sm text-muted-foreground">Your analyses are protected by Supabase Auth + RLS.</p>
          </Card>
        </div>
      </div>
    </section>
  );
}
