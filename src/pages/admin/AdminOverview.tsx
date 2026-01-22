import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useAdminOverview } from "@/hooks/use-admin-data";

function MetricCard({ title, value, subtext }: { title: string; value: string; subtext?: string }) {
  return (
    <Card className="pp-surface rounded-xl border p-5">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
      {subtext ? <div className="mt-2 text-xs text-muted-foreground">{subtext}</div> : null}
    </Card>
  );
}

export default function AdminOverview() {
  const q = useAdminOverview();

  return (
    <section aria-label="Admin overview">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">Platform health and activity.</p>
      </div>

      <div className="mt-6">
        {q.isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full" />
            ))}
          </div>
        ) : q.isError ? (
          <Alert className="border-border bg-background">
            <div className="text-sm">Couldn’t load overview.</div>
            <div className="mt-2">
              <Button variant="outline" size="sm" onClick={() => q.refetch()}>
                Try again
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Users"
              value={q.data ? q.data.total_users.toLocaleString() : "—"}
              subtext={
                q.data
                  ? `Free: ${(q.data.users_by_tier.free ?? 0).toLocaleString()} • Pro: ${(q.data.users_by_tier.pro ?? 0).toLocaleString()}`
                  : undefined
              }
            />
            <MetricCard
              title="Analyses Today"
              value={q.data ? q.data.analyses_today.toLocaleString() : "—"}
              subtext={
                q.data
                  ? `Yesterday: ${q.data.analyses_yesterday.toLocaleString()} • Template: ${(q.data.analyses_today_by_method.template ?? 0).toLocaleString()}`
                  : undefined
              }
            />
            <MetricCard title="Revenue" value={"$0"} subtext="Stripe not connected" />
            <MetricCard title="System Health" value={"Healthy"} subtext="API/DB checks: MVP" />
          </div>
        )}
      </div>

      <div className="mt-6">
        <Card className="pp-surface rounded-xl border p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">Real-time activity</div>
              <div className="mt-1 text-xs text-muted-foreground">Auto-refreshes about every 30s.</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => q.refetch()}>
              Refresh
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {q.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : q.isError ? (
              <div className="text-sm text-muted-foreground">Couldn’t load activity.</div>
            ) : q.data?.activity?.length ? (
              q.data.activity.slice(0, 20).map((e, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-muted-foreground">{e.message}</div>
                    <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">No recent activity.</div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
}
