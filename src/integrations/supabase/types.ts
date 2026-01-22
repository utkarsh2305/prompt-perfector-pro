export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      framework_principles: {
        Row: {
          better_practice: string
          created_at: string
          default_penalty: number
          detection_keywords: string[]
          display_order: number | null
          example_clear: string | null
          example_vague: string | null
          id: number
          is_active: boolean
          principle: string
          section_name: string
          section_number: number
          severity_level: Database["public"]["Enums"]["severity_level"]
          tier_required: Database["public"]["Enums"]["app_tier"]
          updated_at: string
          what_to_avoid: string | null
          why_matters: string
        }
        Insert: {
          better_practice: string
          created_at?: string
          default_penalty?: number
          detection_keywords?: string[]
          display_order?: number | null
          example_clear?: string | null
          example_vague?: string | null
          id?: number
          is_active?: boolean
          principle: string
          section_name: string
          section_number: number
          severity_level?: Database["public"]["Enums"]["severity_level"]
          tier_required?: Database["public"]["Enums"]["app_tier"]
          updated_at?: string
          what_to_avoid?: string | null
          why_matters: string
        }
        Update: {
          better_practice?: string
          created_at?: string
          default_penalty?: number
          detection_keywords?: string[]
          display_order?: number | null
          example_clear?: string | null
          example_vague?: string | null
          id?: number
          is_active?: boolean
          principle?: string
          section_name?: string
          section_number?: number
          severity_level?: Database["public"]["Enums"]["severity_level"]
          tier_required?: Database["public"]["Enums"]["app_tier"]
          updated_at?: string
          what_to_avoid?: string | null
          why_matters?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_usage_count: number
          email: string | null
          full_name: string | null
          id: string
          is_trial_active: boolean
          last_login_at: string | null
          last_usage_reset_date: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["app_tier"]
          total_analyses_count: number
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_usage_count?: number
          email?: string | null
          full_name?: string | null
          id: string
          is_trial_active?: boolean
          last_login_at?: string | null
          last_usage_reset_date?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["app_tier"]
          total_analyses_count?: number
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_usage_count?: number
          email?: string | null
          full_name?: string | null
          id?: string
          is_trial_active?: boolean
          last_login_at?: string | null
          last_usage_reset_date?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["app_tier"]
          total_analyses_count?: number
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prompt_analysis_log: {
        Row: {
          ai_platform: Database["public"]["Enums"]["ai_platform"] | null
          analysis_method: Database["public"]["Enums"]["analysis_method"]
          created_at: string
          grade: Database["public"]["Enums"]["letter_grade"] | null
          id: string
          improved_prompt: string
          improvement_accepted: boolean | null
          improvement_explanation: string | null
          llm_cost_cents: number
          llm_model: string | null
          llm_reasoning: string | null
          llm_tokens_input: number
          llm_tokens_output: number
          max_score: number
          original_prompt: string
          processing_time_ms: number | null
          prompt_length: number
          score: number
          user_feedback: string | null
          user_id: string
          user_rating: number | null
          violations: Json
        }
        Insert: {
          ai_platform?: Database["public"]["Enums"]["ai_platform"] | null
          analysis_method: Database["public"]["Enums"]["analysis_method"]
          created_at?: string
          grade?: Database["public"]["Enums"]["letter_grade"] | null
          id?: string
          improved_prompt: string
          improvement_accepted?: boolean | null
          improvement_explanation?: string | null
          llm_cost_cents?: number
          llm_model?: string | null
          llm_reasoning?: string | null
          llm_tokens_input?: number
          llm_tokens_output?: number
          max_score?: number
          original_prompt: string
          processing_time_ms?: number | null
          prompt_length: number
          score: number
          user_feedback?: string | null
          user_id: string
          user_rating?: number | null
          violations?: Json
        }
        Update: {
          ai_platform?: Database["public"]["Enums"]["ai_platform"] | null
          analysis_method?: Database["public"]["Enums"]["analysis_method"]
          created_at?: string
          grade?: Database["public"]["Enums"]["letter_grade"] | null
          id?: string
          improved_prompt?: string
          improvement_accepted?: boolean | null
          improvement_explanation?: string | null
          llm_cost_cents?: number
          llm_model?: string | null
          llm_reasoning?: string | null
          llm_tokens_input?: number
          llm_tokens_output?: number
          max_score?: number
          original_prompt?: string
          processing_time_ms?: number | null
          prompt_length?: number
          score?: number
          user_feedback?: string | null
          user_id?: string
          user_rating?: number | null
          violations?: Json
        }
        Relationships: []
      }
      tier_features: {
        Row: {
          config: Json
          created_at: string
          feature_description: string | null
          feature_name: string
          feature_slug: string
          id: number
          is_enabled: boolean
          tier_name: Database["public"]["Enums"]["app_tier"]
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          feature_description?: string | null
          feature_name: string
          feature_slug: string
          id?: number
          is_enabled?: boolean
          tier_name: Database["public"]["Enums"]["app_tier"]
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          feature_description?: string | null
          feature_name?: string
          feature_slug?: string
          id?: number
          is_enabled?: boolean
          tier_name?: Database["public"]["Enums"]["app_tier"]
          updated_at?: string
        }
        Relationships: []
      }
      usage_analytics: {
        Row: {
          active_users: number
          avg_cost_per_analysis_cents: number
          avg_score: number | null
          chatgpt_analyses: number
          claude_analyses: number
          created_at: string
          date: string
          enterprise_users: number
          free_users: number
          gemini_analyses: number
          id: number
          llm_analyses: number
          new_users: number
          other_analyses: number
          pro_users: number
          template_analyses: number
          total_analyses: number
          total_llm_cost_cents: number
          total_users: number
        }
        Insert: {
          active_users?: number
          avg_cost_per_analysis_cents?: number
          avg_score?: number | null
          chatgpt_analyses?: number
          claude_analyses?: number
          created_at?: string
          date: string
          enterprise_users?: number
          free_users?: number
          gemini_analyses?: number
          id?: number
          llm_analyses?: number
          new_users?: number
          other_analyses?: number
          pro_users?: number
          template_analyses?: number
          total_analyses?: number
          total_llm_cost_cents?: number
          total_users?: number
        }
        Update: {
          active_users?: number
          avg_cost_per_analysis_cents?: number
          avg_score?: number | null
          chatgpt_analyses?: number
          claude_analyses?: number
          created_at?: string
          date?: string
          enterprise_users?: number
          free_users?: number
          gemini_analyses?: number
          id?: number
          llm_analyses?: number
          new_users?: number
          other_analyses?: number
          pro_users?: number
          template_analyses?: number
          total_analyses?: number
          total_llm_cost_cents?: number
          total_users?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_user_analyze: {
        Args: { user_uuid: string }
        Returns: {
          can_analyze: boolean
          reason: string
          usage_count: number
          usage_limit: number
        }[]
      }
      get_user_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_tier"]
      }
      get_user_tier_info: {
        Args: { user_uuid: string }
        Returns: {
          daily_usage: number
          features: Json
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["app_tier"]
          total_usage: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_usage: { Args: { user_uuid: string }; Returns: undefined }
      reset_daily_usage: { Args: never; Returns: undefined }
    }
    Enums: {
      ai_platform: "chatgpt" | "claude" | "gemini" | "perplexity" | "other"
      analysis_method: "template" | "llm"
      app_role: "admin" | "moderator" | "user"
      app_tier: "free" | "pro" | "enterprise"
      letter_grade: "A" | "B" | "C" | "D" | "F"
      severity_level: "critical" | "major" | "minor"
      subscription_status:
        | "active"
        | "inactive"
        | "trialing"
        | "canceled"
        | "past_due"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_platform: ["chatgpt", "claude", "gemini", "perplexity", "other"],
      analysis_method: ["template", "llm"],
      app_role: ["admin", "moderator", "user"],
      app_tier: ["free", "pro", "enterprise"],
      letter_grade: ["A", "B", "C", "D", "F"],
      severity_level: ["critical", "major", "minor"],
      subscription_status: [
        "active",
        "inactive",
        "trialing",
        "canceled",
        "past_due",
      ],
    },
  },
} as const
