import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserAnalytics } from "@/hooks/use-admin-analytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Users, UserPlus, TrendingUp, Activity } from "lucide-react";

const COLORS = ["hsl(217, 91%, 60%)", "hsl(258, 90%, 66%)", "hsl(142, 76%, 36%)"];

interface Props {
  days: number;
}

export default function AnalyticsUsers({ days }: Props) {
  const { data, isLoading } = useUserAnalytics(days);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
        <Skeleton className="col-span-full h-64 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: "Free", value: data.free_users },
    { name: "Pro", value: data.pro_users },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Total Users"
          value={data.total_users.toLocaleString()}
          sub={`Pro: ${data.pro_users}`}
        />
        <MetricCard
          icon={UserPlus}
          label="New Signups (7d)"
          value={data.new_signups_7d.toLocaleString()}
          sub="Last 7 days"
        />
        <MetricCard
          icon={Activity}
          label="Active Users (7d)"
          value={data.active_users_7d.toLocaleString()}
          sub="With analyses"
        />
        <MetricCard
          icon={TrendingUp}
          label="DAU/MAU Ratio"
          value={`${data.dau_mau_ratio}%`}
          sub="Engagement indicator"
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Growth Chart */}
        <Card className="col-span-2 p-4">
          <h3 className="mb-4 text-sm font-medium">User Growth</h3>
          <ChartContainer config={{ users: { label: "Users", color: "hsl(var(--primary))" } }} className="h-64">
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
                dataKey="total_users"
                name="Total Users"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="new_users"
                name="New Users"
                stroke="hsl(var(--accent))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </Card>

        {/* Pie Chart */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Tier Distribution</h3>
          <div className="flex h-64 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
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
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </Card>
  );
}
