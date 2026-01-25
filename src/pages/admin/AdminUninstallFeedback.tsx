import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import { useUninstallFeedback, getReasonLabel } from "@/hooks/use-uninstall-feedback";
import { UserMinus, MessageSquare, TrendingDown, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

const TIER_OPTIONS = [
  { value: "all", label: "All tiers" },
  { value: "free", label: "Free" },
  { value: "pro", label: "Pro" },
  { value: "unlimited", label: "Unlimited" },
];

const PIE_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
  "hsl(200, 80%, 50%)",
  "hsl(280, 70%, 50%)",
  "hsl(180, 60%, 45%)",
  "hsl(60, 70%, 50%)",
];

const TIER_COLORS: Record<string, string> = {
  free: "hsl(var(--muted-foreground))",
  pro: "hsl(var(--primary))",
  unlimited: "hsl(var(--accent))",
  anonymous: "hsl(var(--border))",
};

export default function AdminUninstallFeedback() {
  const [days, setDays] = useState(30);
  const [tier, setTier] = useState("all");

  const { data, isLoading } = useUninstallFeedback({ days, tier });

  return (
    <section aria-label="Uninstall feedback analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Uninstall Feedback</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Understand why users uninstall the extension.
          </p>
        </div>

        <div className="flex gap-2">
          <Select value={tier} onValueChange={setTier}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? <LoadingSkeleton /> : data ? <FeedbackContent data={data} /> : null}
    </section>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

function FeedbackContent({
  data,
}: {
  data: {
    total_count: number;
    by_reason: Array<{ reason: string; count: number }>;
    by_tier: Array<{ tier: string; count: number }>;
    recent_with_comments: Array<{
      id: string;
      reason: string;
      additional_comments: string | null;
      user_tier: string | null;
      days_used: number | null;
      created_at: string;
    }>;
    trend: Array<{ date: string; count: number }>;
  };
}) {
  const commentsCount = data.recent_with_comments.length;
  const avgDaysUsed =
    data.recent_with_comments.filter((f) => f.days_used !== null).length > 0
      ? Math.round(
          data.recent_with_comments
            .filter((f) => f.days_used !== null)
            .reduce((sum, f) => sum + (f.days_used || 0), 0) /
            data.recent_with_comments.filter((f) => f.days_used !== null).length
        )
      : null;

  const pieData = data.by_reason.map((item) => ({
    name: getReasonLabel(item.reason),
    value: item.count,
  }));

  const barData = data.trend.map((item) => ({
    date: item.date,
    count: item.count,
  }));

  return (
    <div className="mt-6 space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={UserMinus}
          label="Total Uninstalls"
          value={data.total_count.toLocaleString()}
          sub="With feedback submitted"
        />
        <MetricCard
          icon={MessageSquare}
          label="With Comments"
          value={commentsCount.toLocaleString()}
          sub={`${data.total_count > 0 ? Math.round((commentsCount / data.total_count) * 100) : 0}% left comments`}
        />
        <MetricCard
          icon={Calendar}
          label="Avg Days Used"
          value={avgDaysUsed !== null ? `${avgDaysUsed}` : "N/A"}
          sub="Before uninstalling"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Reasons Pie Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uninstall Reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {pieData.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={PIE_COLORS[idx % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trend Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Uninstalls Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length > 0 ? (
              <ChartContainer
                config={{ count: { label: "Uninstalls", color: "hsl(var(--destructive))" } }}
                className="h-72"
              >
                <BarChart data={barData}>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    name="Uninstalls"
                    fill="hsl(var(--destructive))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-72 items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tier Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">By User Tier</CardTitle>
        </CardHeader>
        <CardContent>
          {data.by_tier.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {data.by_tier.map((item) => (
                <div
                  key={item.tier}
                  className="flex items-center gap-2 rounded-lg border p-3"
                >
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        TIER_COLORS[item.tier] || "hsl(var(--muted-foreground))",
                    }}
                  />
                  <span className="text-sm font-medium capitalize">{item.tier}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No tier data available</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Comments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Recent Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recent_with_comments.length > 0 ? (
            <div className="space-y-4">
              {data.recent_with_comments.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border bg-muted/30 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{getReasonLabel(item.reason)}</Badge>
                    {item.user_tier && (
                      <Badge
                        variant="secondary"
                        className="capitalize"
                      >
                        {item.user_tier}
                      </Badge>
                    )}
                    {item.days_used !== null && (
                      <span className="text-xs text-muted-foreground">
                        Used {item.days_used} days
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">
                    "{item.additional_comments}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No comments submitted yet
            </p>
          )}
        </CardContent>
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
      <div className="rounded-lg bg-destructive/10 p-2.5">
        <Icon className="h-5 w-5 text-destructive" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Card>
  );
}
