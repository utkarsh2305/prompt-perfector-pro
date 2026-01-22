export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Violation {
  rule_id: number;
  section: string;
  principle: string;
  issue: string;
  severity: "critical" | "major" | "minor";
  penalty: number;
  suggestion: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  tier: "free" | "pro" | "enterprise";
  subscription_status: "active" | "inactive" | "trialing" | "canceled" | "past_due";
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  daily_usage_count: number;
  last_usage_reset_date: string;
  total_analyses_count: number;
  trial_ends_at: string | null;
  is_trial_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export interface FrameworkPrinciple {
  id: number;
  section_number: number;
  section_name: string;
  principle: string;
  what_to_avoid: string | null;
  why_matters: string;
  better_practice: string;
  example_vague: string | null;
  example_clear: string | null;
  severity_level: "critical" | "major" | "minor";
  default_penalty: number;
  detection_keywords: string[];
  tier_required: "free" | "pro" | "enterprise";
  is_active: boolean;
  display_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface PromptAnalysis {
  id: string;
  user_id: string;
  original_prompt: string;
  prompt_length: number;
  ai_platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "other" | null;
  score: number;
  max_score: number;
  grade: "A" | "B" | "C" | "D" | "F" | null;
  violations: Violation[];
  analysis_method: "template" | "llm";
  llm_model: string | null;
  llm_reasoning: string | null;
  improved_prompt: string;
  improvement_explanation: string | null;
  processing_time_ms: number | null;
  llm_tokens_input: number;
  llm_tokens_output: number;
  llm_cost_cents: number;
  user_rating: number | null;
  user_feedback: string | null;
  improvement_accepted: boolean | null;
  created_at: string;
}

export interface TierFeature {
  id: number;
  tier_name: "free" | "pro" | "enterprise";
  feature_slug: string;
  feature_name: string;
  feature_description: string | null;
  is_enabled: boolean;
  config: Record<string, Json>;
  created_at: string;
  updated_at: string;
}

export interface UsageAnalytics {
  id: number;
  date: string;
  total_users: number;
  free_users: number;
  pro_users: number;
  enterprise_users: number;
  new_users: number;
  active_users: number;
  total_analyses: number;
  template_analyses: number;
  llm_analyses: number;
  avg_score: number | null;
  total_llm_cost_cents: number;
  avg_cost_per_analysis_cents: number;
  chatgpt_analyses: number;
  claude_analyses: number;
  gemini_analyses: number;
  other_analyses: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<
          Profile,
          "created_at" | "updated_at" | "last_login_at" | "daily_usage_count" | "last_usage_reset_date" | "total_analyses_count"
        > & {
          daily_usage_count?: number;
          last_usage_reset_date?: string;
          total_analyses_count?: number;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
        };
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      framework_principles: {
        Row: FrameworkPrinciple;
        Insert: Omit<FrameworkPrinciple, "id" | "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FrameworkPrinciple, "id">>;
      };
      prompt_analysis_log: {
        Row: PromptAnalysis;
        Insert: Omit<PromptAnalysis, "id" | "created_at"> & { id?: string; created_at?: string };
        Update: Partial<Omit<PromptAnalysis, "id" | "user_id" | "created_at">>;
      };
      tier_features: {
        Row: TierFeature;
        Insert: Omit<TierFeature, "id" | "created_at" | "updated_at"> & { created_at?: string; updated_at?: string };
        Update: Partial<Omit<TierFeature, "id">>;
      };
      usage_analytics: {
        Row: UsageAnalytics;
        Insert: Omit<UsageAnalytics, "id" | "created_at"> & { created_at?: string };
        Update: Partial<Omit<UsageAnalytics, "id">>;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "admin" | "moderator" | "user";
        };
        Insert: { id?: string; user_id: string; role: "admin" | "moderator" | "user" };
        Update: Partial<{ role: "admin" | "moderator" | "user" }>;
      };
    };
  };
}
