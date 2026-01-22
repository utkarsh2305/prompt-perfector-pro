import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AdminOverviewResponse = {
  total_users: number;
  users_by_tier: Record<string, number>;
  analyses_today: number;
  analyses_yesterday: number;
  analyses_today_by_method: Record<string, number>;
  activity: Array<{
    type: "signup" | "analysis" | "rate_limit";
    message: string;
    created_at: string;
    href?: string;
  }>;
};

export type AdminUsersResponse = {
  rows: Array<{
    id: string;
    email: string | null;
    full_name: string | null;
    tier: string;
    subscription_status: string;
    total_analyses_count: number;
    created_at: string;
    last_login_at: string | null;
  }>;
  total: number;
};

export type AdminAnalysesResponse = {
  rows: Array<{
    id: string;
    created_at: string;
    user_id: string;
    user_email: string | null;
    original_prompt: string;
    score: number;
    grade: string | null;
    ai_platform: string | null;
    analysis_method: string;
    processing_time_ms: number | null;
    llm_cost_cents: number;
  }>;
  total: number;
};

export type AdminFrameworkResponse = {
  rows: Array<{
    id: number;
    section_number: number;
    section_name: string;
    principle: string;
    severity_level: string;
    default_penalty: number;
    tier_required: string;
    is_active: boolean;
  }>;
  total: number;
};

async function invoke<T>(functionName: string, params?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: params ?? {},
  });
  if (error) throw error;
  return data as T;
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: () => invoke<AdminOverviewResponse>("admin-overview"),
    staleTime: 30_000,
  });
}

export function useAdminUsers(params: { q: string; tier: string; status: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => invoke<AdminUsersResponse>("admin-users", params),
    staleTime: 10_000,
  });
}

export function useAdminAnalyses(params: { q: string; platform: string; method: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["admin", "analyses", params],
    queryFn: () => invoke<AdminAnalysesResponse>("admin-analyses", params),
    staleTime: 10_000,
  });
}

export function useAdminFramework(params: { q: string; tier: string; active: string; page: number; pageSize: number }) {
  return useQuery({
    queryKey: ["admin", "framework", params],
    queryFn: () => invoke<AdminFrameworkResponse>("admin-framework", params),
    staleTime: 10_000,
  });
}
