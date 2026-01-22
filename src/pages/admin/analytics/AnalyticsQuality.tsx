import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQualityAnalytics } from "@/hooks/use-admin-analytics";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Star, AlertTriangle, Target } from "lucide-react";

const GRADE_COLORS: Record<string, string> = {
  A: "hsl(142, 76%, 36%)",
  B: "hsl(173, 80%, 40%)",
  C: "hsl(48, 96%, 53%)",
  D: "hsl(25, 95%, 53%)",
  F: "hsl(0, 84%, 60%)",
};

interface Props {
  days: number;
}

export default function AnalyticsQuality({ days }: Props) {
  const { data, isLoading } = useQualityAnalytics(days);

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const gradeData = Object.entries(data.grade_distribution).map(([grade, count]) => ({
    grade,
    count,
    fill: GRADE_COLORS[grade] || "hsl(var(--muted))",
  }));

  const topViolation = data.top_violations[0]?.principle ?? "None";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Star} label="Average Score" value={data.avg_score} />
        <MetricCard icon={Target} label="Total Analyses" value={data.total_analyses.toLocaleString()} />
        <MetricCard icon={AlertTriangle} label="Top Violation" value={topViolation.slice(0, 30)} />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Grade Distribution */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Grade Distribution</h3>
          <div className="flex h-56 items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ grade, percent }) => `${grade} ${(percent * 100).toFixed(0)}%`}
                >
                  {gradeData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Top Violations */}
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Top 10 Violations</h3>
          <ChartContainer config={{ count: { label: "Count", color: "hsl(var(--destructive))" } }} className="h-56">
            <BarChart data={data.top_violations} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="principle"
                width={120}
                tick={{ fontSize: 9 }}
                tickFormatter={(v) => (v.length > 18 ? v.slice(0, 18) + "…" : v)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </Card>
      </div>

      {/* Platform Scores */}
      <Card className="p-4">
        <h3 className="mb-4 text-sm font-medium">Average Score by Platform</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.platform_scores.map((p) => (
            <div
              key={p.platform}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <span className="text-sm font-medium capitalize">{p.platform}</span>
              <div className="text-right">
                <span className="text-lg font-semibold">{p.avg_score}</span>
                <span className="ml-1 text-xs text-muted-foreground">({p.count})</span>
              </div>
            </div>
          ))}
        </div>
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
      <div className="rounded-lg bg-primary/10 p-2.5">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </Card>
  );
}
