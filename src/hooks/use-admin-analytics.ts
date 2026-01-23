import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type UserAnalytics = {
  total_users: number;
  pro_users: number;
  free_users: number;
  new_signups_7d: number;
  active_users_7d: number;
  dau_mau_ratio: number;
  trend: Array<{
    date: string;
    total_users: number;
    free_users: number;
    pro_users: number;
    new_users: number;
    active_users: number;
  }>;
};

export type EngagementAnalytics = {
  avg_analyses_per_user: number;
  by_day_of_week: number[];
  by_hour: number[];
  trend: Array<{
    date: string;
    total_analyses: number;
    active_users: number;
    new_users: number;
  }>;
};

export type QualityAnalytics = {
  avg_score: string;
  total_analyses: number;
  grade_distribution: Record<string, number>;
  platform_scores: Array<{ platform: string; avg_score: string; count: number }>;
  top_violations: Array<{ principle: string; count: number }>;
};

export type TechnicalAnalytics = {
  response_times: { p50: number; p95: number; p99: number };
  total_llm_cost_cents: number;
  llm_analysis_count: number;
  avg_cost_per_llm: string;
};

async function fetchAnalytics<T>(tab: string, days: number): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-analytics", {
    body: { tab, days },
  });
  if (error) throw error;
  return data.data as T;
}

export function useUserAnalytics(days = 30) {
  const { session, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ["admin", "analytics", "users", days],
    queryFn: () => fetchAnalytics<UserAnalytics>("users", days),
    staleTime: 60_000,
    enabled: !authLoading && !!session,
  });
}

export function useEngagementAnalytics(days = 30) {
  const { session, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ["admin", "analytics", "engagement", days],
    queryFn: () => fetchAnalytics<EngagementAnalytics>("engagement", days),
    staleTime: 60_000,
    enabled: !authLoading && !!session,
  });
}

export function useQualityAnalytics(days = 30) {
  const { session, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ["admin", "analytics", "quality", days],
    queryFn: () => fetchAnalytics<QualityAnalytics>("quality", days),
    staleTime: 60_000,
    enabled: !authLoading && !!session,
  });
}

export function useTechnicalAnalytics(days = 30) {
  const { session, isLoading: authLoading } = useAuth();
  
  return useQuery({
    queryKey: ["admin", "analytics", "technical", days],
    queryFn: () => fetchAnalytics<TechnicalAnalytics>("technical", days),
    staleTime: 60_000,
    enabled: !authLoading && !!session,
  });
}
