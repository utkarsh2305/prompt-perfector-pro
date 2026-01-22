import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTechnicalAnalytics } from "@/hooks/use-admin-analytics";
import { Gauge, DollarSign, Zap, Server } from "lucide-react";

interface Props {
  days: number;
}

export default function AnalyticsTechnical({ days }: Props) {
  const { data, isLoading } = useTechnicalAnalytics(days);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Zap}
          label="p50 Response"
          value={`${data.response_times.p50}ms`}
          sub="Median"
        />
        <MetricCard
          icon={Gauge}
          label="p95 Response"
          value={`${data.response_times.p95}ms`}
          sub="95th percentile"
        />
        <MetricCard
          icon={Server}
          label="LLM Analyses"
          value={data.llm_analysis_count.toLocaleString()}
          sub={`Avg $${data.avg_cost_per_llm}`}
        />
        <MetricCard
          icon={DollarSign}
          label="Total LLM Cost"
          value={`$${(data.total_llm_cost_cents / 100).toFixed(2)}`}
          sub={`${days} days`}
        />
      </div>

      {/* Response Time Breakdown */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-medium">Response Time Percentiles</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <PercentileBadge label="p50" value={data.response_times.p50} />
          <PercentileBadge label="p95" value={data.response_times.p95} />
          <PercentileBadge label="p99" value={data.response_times.p99} />
        </div>
      </Card>

      {/* Placeholder for future charts */}
      <Card className="p-6 text-center text-muted-foreground">
        <p className="text-sm">
          Additional technical metrics (error rates, slow endpoints) will appear after more data is collected.
        </p>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <div className="rounded-lg bg-accent/10 p-2.5">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Card>
  );
}

function PercentileBadge({ label, value }: { label: string; value: number }) {
  const color =
    value < 200
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : value < 500
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  return (
    <div className={`rounded-lg p-4 text-center ${color}`}>
      <p className="text-xs font-medium uppercase">{label}</p>
      <p className="text-xl font-bold">{value}ms</p>
    </div>
  );
}
