import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrialStatus {
  is_trial: boolean;
  status: string;
  tier?: string;
  expires_at?: string;
  days_remaining?: number;
}

export interface TrialExpireResult {
  expired: boolean;
  reason?: string;
  old_tier?: string;
  new_tier?: string;
  new_credits?: number;
  expires_at?: string;
}

export function useTrialStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ["trial-status", userId],
    queryFn: async (): Promise<TrialStatus> => {
      if (!userId) return { is_trial: false, status: "no_user" };
      
      const { data, error } = await supabase.rpc("get_trial_status", { user_uuid: userId });
      
      if (error) {
        console.error("Error fetching trial status:", error);
        return { is_trial: false, status: "error" };
      }
      
      return data as unknown as TrialStatus;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCheckAndExpireTrial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string): Promise<TrialExpireResult> => {
      const { data, error } = await supabase.rpc("check_and_expire_trial", { user_uuid: userId });
      
      if (error) {
        console.error("Error checking trial expiration:", error);
        throw error;
      }
      
      return data as unknown as TrialExpireResult;
    },
    onSuccess: (result, userId) => {
      if (result.expired) {
        // Invalidate all subscription-related queries
        queryClient.invalidateQueries({ queryKey: ["trial-status", userId] });
        queryClient.invalidateQueries({ queryKey: ["user-subscription", userId] });
        queryClient.invalidateQueries({ queryKey: ["rewrite-credits", userId] });
        queryClient.invalidateQueries({ queryKey: ["check-rewrite-credits", userId] });
        queryClient.invalidateQueries({ queryKey: ["user-subscription-info", userId] });
      }
    },
  });
}
