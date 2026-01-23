import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  SubscriptionTier, 
  CreditPackage, 
  UserSubscription, 
  RewriteCredits,
  UserSubscriptionInfo 
} from "@/types/subscription";

export function useSubscriptionTiers() {
  return useQuery({
    queryKey: ["subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .eq("is_active", true)
        .order("base_monthly_price", { ascending: true });
      
      if (error) throw error;
      return data as SubscriptionTier[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useCreditPackages() {
  return useQuery({
    queryKey: ["credit-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) throw error;
      return data as CreditPackage[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useUserSubscription(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserSubscription | null;
    },
    enabled: !!userId,
  });
}

export function useRewriteCredits(userId: string | undefined) {
  return useQuery({
    queryKey: ["rewrite-credits", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from("rewrite_credits")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      
      if (error) throw error;
      return data as RewriteCredits | null;
    },
    enabled: !!userId,
  });
}

export function useUserSubscriptionInfo(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-subscription-info", userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .rpc("get_user_subscription_info", { user_uuid: userId });
      
      if (error) throw error;
      return (data as UserSubscriptionInfo[])?.[0] ?? null;
    },
    enabled: !!userId,
  });
}

export function useCheckRewriteCredits(userId: string | undefined) {
  return useQuery({
    queryKey: ["check-rewrite-credits", userId],
    queryFn: async () => {
      if (!userId) return { can_rewrite: false, credits_remaining: 0, is_unlimited: false };
      
      const { data, error } = await supabase
        .rpc("check_rewrite_credits", { user_uuid: userId });
      
      if (error) throw error;
      const result = (data as { can_rewrite: boolean; credits_remaining: number; is_unlimited: boolean }[])?.[0];
      return result ?? { can_rewrite: false, credits_remaining: 0, is_unlimited: false };
    },
    enabled: !!userId,
  });
}

export function useConsumeRewriteCredit() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, analysisId }: { userId: string; analysisId?: string }) => {
      const { data, error } = await supabase
        .rpc("consume_rewrite_credit", { 
          user_uuid: userId, 
          analysis_id: analysisId ?? null 
        });
      
      if (error) throw error;
      const result = (data as { success: boolean; new_balance: number; is_unlimited: boolean }[])?.[0];
      return result ?? { success: false, new_balance: 0, is_unlimited: false };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rewrite-credits", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["check-rewrite-credits", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["user-subscription-info", variables.userId] });
    },
  });
}
