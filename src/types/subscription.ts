export interface SubscriptionTier {
  id: string;
  name: "free" | "pro" | "unlimited";
  base_monthly_price: number;
  base_yearly_price: number;
  base_rewrite_credits: number;
  max_rollover: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreditPackage {
  id: string;
  credits_amount: number;
  monthly_price: number;
  yearly_price: number;
  cost_per_rewrite: number;
  is_default: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  tier_name: "free" | "pro" | "unlimited";
  credit_package_id: string | null;
  billing_cycle: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string;
  status: "active" | "cancelled" | "past_due" | "trialing";
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RewriteCredits {
  id: string;
  user_id: string;
  credits_remaining: number;
  credits_used_this_period: number;
  rollover_credits: number;
  last_reset_at: string;
  updated_at: string;
}

export interface RewriteTransaction {
  id: string;
  user_id: string;
  transaction_type: "usage" | "purchase" | "rollover" | "reset" | "bonus" | "tier_change" | "package_change";
  credits_amount: number;
  balance_after: number;
  prompt_analysis_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface UserSubscriptionInfo {
  tier_name: string;
  billing_cycle: string;
  credits_remaining: number;
  credits_used: number;
  rollover_credits: number;
  is_unlimited: boolean;
  period_end: string;
  credit_package_credits: number | null;
}
