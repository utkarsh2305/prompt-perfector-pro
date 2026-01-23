import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Clock,
  Zap,
  TrendingUp,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import {
  useUserSavings,
  useUpdatePreferredPlatform,
  AI_PLATFORMS,
  formatMoney,
  formatTime,
  formatTokens,
} from "@/hooks/use-savings";
import { SavingsBreakdownModal } from "./SavingsBreakdownModal";

export function SavingsCard() {
  const { data: savings, isLoading } = useUserSavings();
  const updatePlatform = useUpdatePreferredPlatform();
  const [modalOpen, setModalOpen] = useState(false);
  const [showPlatformSelector, setShowPlatformSelector] = useState(false);

  const handlePlatformChange = async (platform: string) => {
    try {
      await updatePlatform.mutateAsync(platform);
      toast.success("AI platform updated");
      setShowPlatformSelector(false);
    } catch (err) {
      toast.error("Failed to update platform");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-24" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default values if no stats yet
  const stats = savings || {
    current_month_money_saved_cents: 0,
    current_month_tokens_saved: 0,
    total_money_saved_cents: 0,
    total_tokens_saved: 0,
    total_time_saved_minutes: 0,
    total_retries_avoided: 0,
    avg_score_before: 0,
    avg_score_after: 0,
    preferred_ai_platform: "claude-sonnet",
    total_prompts_rewritten: 0,
  };

  const scoreImprovement = stats.avg_score_after - stats.avg_score_before;
  const improvementPercent =
    stats.avg_score_before > 0
      ? Math.round((scoreImprovement / stats.avg_score_before) * 100)
      : 0;

  const currentPlatform = AI_PLATFORMS.find(
    (p) => p.value === stats.preferred_ai_platform
  );

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Your Savings</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => setShowPlatformSelector(!showPlatformSelector)}
            title="Change AI platform"
          >
            <Settings2 className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Platform Selector */}
          {showPlatformSelector && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">
                Select your primary AI platform for accurate cost calculations:
              </p>
              <Select
                value={stats.preferred_ai_platform}
                onValueChange={handlePlatformChange}
                disabled={updatePlatform.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PLATFORMS.map((platform) => (
                    <SelectItem key={platform.value} value={platform.value}>
                      <span className="flex items-center gap-2">
                        {platform.label}
                        <span className="text-xs text-muted-foreground">
                          {platform.rate}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Main Savings Number */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-green-600">
              {formatMoney(stats.current_month_money_saved_cents)}
            </span>
            <span className="text-sm text-muted-foreground">saved this month</span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card p-3 text-center">
              <Clock className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">
                {formatTime(stats.total_time_saved_minutes)}
              </p>
              <p className="text-xs text-muted-foreground">Time saved</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <Zap className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">
                {formatTokens(stats.current_month_tokens_saved)}
              </p>
              <p className="text-xs text-muted-foreground">Tokens optimized</p>
            </div>
            <div className="rounded-lg border bg-card p-3 text-center">
              <TrendingUp className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-semibold">
                {improvementPercent > 0 ? `+${improvementPercent}%` : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Score boost</p>
            </div>
          </div>

          {/* All-time Stats */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm">
                All-time:{" "}
                <span className="font-semibold text-green-600">
                  {formatMoney(stats.total_money_saved_cents)}
                </span>
              </span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {stats.total_prompts_rewritten} rewrites
            </Badge>
          </div>

          {/* See Details Button */}
          <Button
            variant="ghost"
            className="w-full justify-between"
            onClick={() => setModalOpen(true)}
          >
            See detailed breakdown
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <SavingsBreakdownModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
