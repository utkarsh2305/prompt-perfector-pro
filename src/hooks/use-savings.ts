import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface UserSavingsStats {
  id: string;
  user_id: string;
  total_prompts_analyzed: number;
  total_prompts_rewritten: number;
  total_tokens_saved: number;
  total_money_saved_cents: number;
  total_retries_avoided: number;
  total_time_saved_minutes: number;
  avg_score_before: number;
  avg_score_after: number;
  current_month_tokens_saved: number;
  current_month_money_saved_cents: number;
  preferred_ai_platform: string;
  last_calculated_at: string | null;
  created_at: string;
  updated_at: string;
}

export const AI_PLATFORMS = [
  { value: "claude-sonnet", label: "Claude Sonnet", rate: "$0.003/1K" },
  { value: "claude-opus", label: "Claude Opus", rate: "$0.015/1K" },
  { value: "gpt-4o", label: "GPT-4o", rate: "$0.005/1K" },
  { value: "gpt-4", label: "GPT-4", rate: "$0.03/1K" },
  { value: "gemini-pro", label: "Gemini Pro", rate: "$0.00125/1K" },
] as const;

export function useUserSavings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-savings", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_savings_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserSavingsStats | null;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useUpdatePreferredPlatform() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (platform: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check if record exists
      const { data: existing } = await supabase
        .from("user_savings_stats")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("user_savings_stats")
          .update({ preferred_ai_platform: platform })
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Create new record with just the platform preference
        const { error } = await supabase
          .from("user_savings_stats")
          .insert({
            user_id: user.id,
            preferred_ai_platform: platform,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-savings"] });
    },
  });
}

export function useSavingsHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["savings-history", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get last 30 days of analyses with savings data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("prompt_analysis_log")
        .select("created_at, score, tokens_saved, money_saved_cents, ai_platform")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

// Helper functions for formatting
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1) {
    return `$${dollars.toFixed(2)}`;
  }
  return `${cents}¢`;
}

export function formatTime(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000000) {
    return `${(tokens / 1000000).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
