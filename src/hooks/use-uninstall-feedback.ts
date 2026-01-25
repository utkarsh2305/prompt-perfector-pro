import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UninstallFeedbackItem {
  id: string;
  user_id: string | null;
  reason: string;
  additional_comments: string | null;
  user_tier: string | null;
  days_used: number | null;
  browser: string | null;
  created_at: string;
}

export interface UninstallFeedbackStats {
  total_count: number;
  by_reason: Array<{ reason: string; count: number }>;
  by_tier: Array<{ tier: string; count: number }>;
  recent_with_comments: UninstallFeedbackItem[];
  trend: Array<{ date: string; count: number }>;
}

const REASON_LABELS: Record<string, string> = {
  not_useful: "Not useful",
  too_distracting: "Too distracting",
  inaccurate_scores: "Inaccurate scores",
  pricing: "Pricing issues",
  better_alternative: "Better alternative",
  performance: "Performance issues",
  privacy: "Privacy concerns",
  temporary: "Temporary removal",
  other: "Other",
};

export function getReasonLabel(reason: string): string {
  return REASON_LABELS[reason] || reason;
}

export function useUninstallFeedback(params: {
  days: number;
  tier: string;
}) {
  const { session, isLoading: authLoading } = useAuth();

  return useQuery({
    queryKey: ["admin", "uninstall-feedback", params],
    queryFn: async (): Promise<UninstallFeedbackStats> => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - params.days);
      const startDateStr = startDate.toISOString().split("T")[0];

      // Build query for all feedback in date range
      let query = supabase
        .from("uninstall_feedback")
        .select("*")
        .gte("created_at", startDateStr)
        .order("created_at", { ascending: false });

      // Filter by tier if not "all"
      if (params.tier !== "all") {
        query = query.eq("user_tier", params.tier);
      }

      const { data: feedbackData, error } = await query;

      if (error) throw error;

      const items = (feedbackData || []) as UninstallFeedbackItem[];

      // Calculate stats
      const byReasonMap = new Map<string, number>();
      const byTierMap = new Map<string, number>();
      const byDateMap = new Map<string, number>();
      const recentWithComments: UninstallFeedbackItem[] = [];

      for (const item of items) {
        // By reason
        const reasonCount = byReasonMap.get(item.reason) || 0;
        byReasonMap.set(item.reason, reasonCount + 1);

        // By tier
        const tierKey = item.user_tier || "anonymous";
        const tierCount = byTierMap.get(tierKey) || 0;
        byTierMap.set(tierKey, tierCount + 1);

        // By date
        const dateKey = item.created_at.split("T")[0];
        const dateCount = byDateMap.get(dateKey) || 0;
        byDateMap.set(dateKey, dateCount + 1);

        // Recent with comments (max 20)
        if (item.additional_comments && recentWithComments.length < 20) {
          recentWithComments.push(item);
        }
      }

      // Convert maps to arrays
      const by_reason = Array.from(byReasonMap.entries())
        .map(([reason, count]) => ({ reason, count }))
        .sort((a, b) => b.count - a.count);

      const by_tier = Array.from(byTierMap.entries())
        .map(([tier, count]) => ({ tier, count }))
        .sort((a, b) => b.count - a.count);

      const trend = Array.from(byDateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        total_count: items.length,
        by_reason,
        by_tier,
        recent_with_comments: recentWithComments,
        trend,
      };
    },
    staleTime: 30_000,
    enabled: !authLoading && !!session,
  });
}
