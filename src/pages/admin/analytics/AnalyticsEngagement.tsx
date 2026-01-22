import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEngagementAnalytics } from "@/hooks/use-admin-analytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line } from "recharts";
import { BarChart3, Clock, Calendar } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface Props {
  days: number;
}

export default function AnalyticsEngagement({ days }: Props) {
  const { data, isLoading } = useEngagementAnalytics(days);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const dayOfWeekData = data.by_day_of_week.map((count, idx) => ({
    day: DAYS[idx],
    count,
  }));

  const peakDay = dayOfWeekData.reduce((a, b) => (a.count > b.count ? a : b), dayOfWeekData[0]);
  const peakHour = data.by_hour.indexOf(Math.max(...data.by_hour));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={BarChart3}
          label="Avg Analyses/User"
          value={data.avg_analyses_per_user.toFixed(1)}
        />
        <MetricCard
          icon={Calendar}
          label="Peak Day"
          value={peakDay.day}
        />
        <MetricCard
          icon={Clock}
          label="Peak Hour"
          value={`${peakHour}:00`}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* By Day of Week */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Usage by Day of Week</h3>
          <ChartContainer config={{ count: { label: "Analyses", color: "hsl(var(--primary))" } }} className="h-56">
            <BarChart data={dayOfWeekData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>

        {/* Hourly Heatmap-style bar */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Usage by Hour (24h)</h3>
          <ChartContainer config={{ count: { label: "Analyses", color: "hsl(var(--accent))" } }} className="h-56">
            <BarChart
              data={data.by_hour.map((count, hour) => ({ hour: `${hour}`, count }))}
            >
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 9 }}
                interval={2}
                tickFormatter={(v) => `${v}h`}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--accent))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      {/* Trend */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-medium">Daily Analyses Trend</h3>
        <ChartContainer
          config={{
            analyses: { label: "Analyses", color: "hsl(var(--primary))" },
            active: { label: "Active Users", color: "hsl(var(--accent))" },
          }}
          className="h-56"
        >
          <LineChart data={data.trend}>
            <XAxis
              dataKey="date"
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              tick={{ fontSize: 10 }}
            />
            <YAxis tick={{ fontSize: 10 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="monotone"
              dataKey="total_analyses"
              name="Analyses"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="active_users"
              name="Active Users"
              stroke="hsl(var(--accent))"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <div className="rounded-lg bg-accent/10 p-2.5">
        <Icon className="h-5 w-5 text-accent" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
