import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RecentAnalysis = {
  id: string;
  original_prompt: string;
  score: number;
  grade: string | null;
  ai_platform: string | null;
  violations: unknown;
  improved_prompt: string;
  created_at: string;
};

export type TrendPoint = { date: string; avgScore: number; count: number };
export type CommonIssue = { key: string; label: string; count: number };

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function useRecentAnalyses(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["recent-analyses", userId, limit],
    enabled: Boolean(userId),
    queryFn: async (): Promise<RecentAnalysis[]> => {
      const { data, error } = await supabase
        .from("prompt_analysis_log")
        .select("id,original_prompt,score,grade,ai_platform,violations,improved_prompt,created_at")
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as RecentAnalysis[];
    },
  });
}

export function useTrend30d(userId: string | undefined) {
  return useQuery({
    queryKey: ["trend-30d", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<TrendPoint[]> => {
      const since = isoDaysAgo(30);
      const { data, error } = await supabase
        .from("prompt_analysis_log")
        .select("created_at,score")
        .eq("user_id", userId as string)
        .gte("created_at", since)
        .order("created_at", { ascending: true });
      if (error) throw error;

      const byDay = new Map<string, { sum: number; count: number }>();
      for (const row of data ?? []) {
        const date = new Date(row.created_at as string).toISOString().slice(0, 10);
        const cur = byDay.get(date) ?? { sum: 0, count: 0 };
        cur.sum += Number(row.score ?? 0);
        cur.count += 1;
        byDay.set(date, cur);
      }

      return Array.from(byDay.entries()).map(([date, v]) => ({
        date,
        avgScore: v.count ? Math.round((v.sum / v.count) * 10) / 10 : 0,
        count: v.count,
      }));
    },
  });
}

export function useCommonIssues30d(userId: string | undefined) {
  return useQuery({
    queryKey: ["common-issues-30d", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<CommonIssue[]> => {
      const since = isoDaysAgo(30);
      const { data, error } = await supabase
        .from("prompt_analysis_log")
        .select("violations")
        .eq("user_id", userId as string)
        .gte("created_at", since);
      if (error) throw error;

      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const violations = (row.violations as unknown as Array<{ issue?: string; principle?: string }>) ?? [];
        for (const v of violations) {
          const label = v.issue ?? v.principle ?? "Issue";
          counts.set(label, (counts.get(label) ?? 0) + 1);
        }
      }

      return Array.from(counts.entries())
        .map(([label, count]) => ({ key: label, label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
  });
}

export function useWeeklyDelta(userId: string | undefined) {
  const thisWeekSince = useMemo(() => isoDaysAgo(7), []);
  const lastWeekSince = useMemo(() => isoDaysAgo(14), []);
  const lastWeekUntil = useMemo(() => isoDaysAgo(7), []);

  return useQuery({
    queryKey: ["weekly-delta", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<{ thisWeek: number; lastWeek: number; delta: number }> => {
      const [thisWeek, lastWeek] = await Promise.all([
        supabase
          .from("prompt_analysis_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId as string)
          .gte("created_at", thisWeekSince),
        supabase
          .from("prompt_analysis_log")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId as string)
          .gte("created_at", lastWeekSince)
          .lt("created_at", lastWeekUntil),
      ]);

      if (thisWeek.error) throw thisWeek.error;
      if (lastWeek.error) throw lastWeek.error;

      const thisCount = thisWeek.count ?? 0;
      const lastCount = lastWeek.count ?? 0;
      return { thisWeek: thisCount, lastWeek: lastCount, delta: thisCount - lastCount };
    },
  });
}
