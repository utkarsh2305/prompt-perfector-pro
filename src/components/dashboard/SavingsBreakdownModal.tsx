import { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DollarSign, Clock, Zap, Target, TrendingUp } from "lucide-react";
import {
  useUserSavings,
  useSavingsHistory,
  formatMoney,
  formatTime,
  formatTokens,
  AI_PLATFORMS,
} from "@/hooks/use-savings";

interface SavingsBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SavingsBreakdownModal({
  open,
  onOpenChange,
}: SavingsBreakdownModalProps) {
  const { data: savings, isLoading: savingsLoading } = useUserSavings();
  const { data: history = [], isLoading: historyLoading } = useSavingsHistory();

  // Process history for charts
  const chartData = useMemo(() => {
    // Group by date for trend chart
    const byDate: Record<string, { date: string; score: number; count: number; savings: number }> = {};

    history.forEach((item) => {
      const date = new Date(item.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      if (!byDate[date]) {
        byDate[date] = { date, score: 0, count: 0, savings: 0 };
      }
      byDate[date].score += item.score || 0;
      byDate[date].count += 1;
      byDate[date].savings += item.money_saved_cents || 0;
    });

    const trendData = Object.values(byDate).map((d) => ({
      date: d.date,
      score: Math.round(d.score / d.count),
      savings: d.savings,
    }));

    // Group by platform for bar chart
    const byPlatform: Record<string, number> = {};
    history.forEach((item) => {
      const platform = item.ai_platform || "unknown";
      byPlatform[platform] = (byPlatform[platform] || 0) + (item.money_saved_cents || 0);
    });

    const platformData = Object.entries(byPlatform)
      .map(([platform, savings]) => {
        const platformInfo = AI_PLATFORMS.find((p) => p.value === platform);
        return {
          name: platformInfo?.label || platform,
          savings: savings / 100, // Convert to dollars
        };
      })
      .sort((a, b) => b.savings - a.savings);

    return { trendData, platformData };
  }, [history]);

  const isLoading = savingsLoading || historyLoading;

  const stats = savings || {
    current_month_money_saved_cents: 0,
    current_month_tokens_saved: 0,
    total_money_saved_cents: 0,
    total_tokens_saved: 0,
    total_time_saved_minutes: 0,
    total_retries_avoided: 0,
    avg_score_before: 0,
    avg_score_after: 0,
    total_prompts_rewritten: 0,
  };

  const scoreImprovement = stats.avg_score_after - stats.avg_score_before;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Savings Breakdown</DialogTitle>
          <DialogDescription>
            Detailed view of your prompt optimization savings
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Comparison Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  This Month
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Money Saved
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatMoney(stats.current_month_money_saved_cents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-600" />
                      Tokens Saved
                    </span>
                    <span className="font-semibold">
                      {formatTokens(stats.current_month_tokens_saved)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  All Time
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Money Saved
                    </span>
                    <span className="font-semibold text-green-600">
                      {formatMoney(stats.total_money_saved_cents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      Time Saved
                    </span>
                    <span className="font-semibold">
                      {formatTime(stats.total_time_saved_minutes)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm flex items-center gap-2">
                      <Target className="h-4 w-4 text-purple-600" />
                      Retries Avoided
                    </span>
                    <span className="font-semibold">
                      {stats.total_retries_avoided}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Score Improvement */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium">Average Score Improvement</h4>
                <Badge variant="secondary" className="text-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{scoreImprovement.toFixed(1)} points
                </Badge>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Before</span>
                    <span>{stats.avg_score_before.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${stats.avg_score_before * 10}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>After</span>
                    <span>{stats.avg_score_after.toFixed(1)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${stats.avg_score_after * 10}%` }}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Score Trend Chart */}
            {chartData.trendData.length > 0 && (
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">
                  Score Improvement Trend (Last 30 Days)
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))", r: 3 }}
                        name="Avg Score"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Savings by Platform */}
            {chartData.platformData.length > 0 && (
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-4">Savings by AI Platform</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.platformData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 12 }}
                        width={100}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Saved"]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar
                        dataKey="savings"
                        fill="hsl(142 76% 36%)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            )}

            {/* Empty State */}
            {chartData.trendData.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No savings data yet.</p>
                <p className="text-sm">Start rewriting prompts to track your savings!</p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
