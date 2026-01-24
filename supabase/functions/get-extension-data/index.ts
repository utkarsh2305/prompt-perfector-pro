import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtensionDataResponse {
  user: {
    id: string;
    email: string | null;
    name: string | null;
    tier: string;
  };
  credits: {
    remaining: number;
    total: number;
    isUnlimited: boolean;
    resetDate: string | null;
  };
  stats: {
    monthSaved: number;
    monthTimeSaved: number;
    monthPrompts: number;
    avgScoreBefore: number;
    avgScoreAfter: number;
  };
  weakestRules: Array<{
    ruleId: string;
    ruleName: string;
    category: string | null;
    failCount: number;
  }>;
  preferences: {
    analysisMode: string;
    activePlatforms: string[];
    primaryAiPlatform: string;
    showScoreBadge: boolean;
    showHoverSuggestions: boolean;
    autoReplaceOnRewrite: boolean;
    // Snooze preferences
    defaultSnoozeMinutes: number;
    autoUnsnoozeEnabled: boolean;
    showRewriteConfirmation: boolean;
    snoozeAnalyticsEnabled: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all data in parallel
    const [
      profileResult,
      creditsResult,
      subscriptionResult,
      savingsResult,
      weakRulesResult,
      preferencesResult,
    ] = await Promise.all([
      // Get user profile
      supabase
        .from("profiles")
        .select("id, email, full_name, tier")
        .eq("id", user.id)
        .maybeSingle(),

      // Get credits
      supabase
        .from("rewrite_credits")
        .select("credits_remaining, credits_used_this_period, last_reset_at")
        .eq("user_id", user.id)
        .maybeSingle(),

      // Get subscription info
      supabase
        .from("user_subscriptions")
        .select("tier_name, current_period_end, credit_package_id")
        .eq("user_id", user.id)
        .maybeSingle(),

      // Get savings stats
      supabase
        .from("user_savings_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),

      // Get weakest rules (top 5 by fail count)
      supabase
        .from("user_weak_rules")
        .select(`
          rule_id,
          fail_count,
          framework_rules (
            rule_name,
            rule_categories (name)
          )
        `)
        .eq("user_id", user.id)
        .order("fail_count", { ascending: false })
        .limit(5),

      // Get or create user preferences
      supabase.rpc("get_or_create_user_preferences", { p_user_id: user.id }),
    ]);

    // Build response
    const profile = profileResult.data;
    const credits = creditsResult.data;
    const subscription = subscriptionResult.data;
    const savings = savingsResult.data;
    const weakRules = weakRulesResult.data || [];
    const preferences = preferencesResult.data?.[0];

    // Calculate total credits based on tier
    const isUnlimited = subscription?.tier_name === "unlimited";
    let totalCredits = 10; // Default free tier
    if (subscription?.tier_name === "pro") {
      // Get from credit package or default
      totalCredits = 200;
    } else if (isUnlimited) {
      totalCredits = -1; // Unlimited
    }

    const response: ExtensionDataResponse = {
      user: {
        id: user.id,
        email: profile?.email || user.email || null,
        name: profile?.full_name || null,
        tier: profile?.tier || subscription?.tier_name || "free",
      },
      credits: {
        remaining: isUnlimited ? -1 : (credits?.credits_remaining ?? 10),
        total: totalCredits,
        isUnlimited,
        resetDate: subscription?.current_period_end || null,
      },
      stats: {
        monthSaved: savings?.current_month_money_saved_cents ?? 0,
        monthTimeSaved: Math.round((savings?.current_month_tokens_saved ?? 0) / 100), // Rough estimate
        monthPrompts: savings?.total_prompts_rewritten ?? 0,
        avgScoreBefore: Number(savings?.avg_score_before ?? 0),
        avgScoreAfter: Number(savings?.avg_score_after ?? 0),
      },
      weakestRules: weakRules.map((wr: any) => ({
        ruleId: wr.rule_id,
        ruleName: wr.framework_rules?.rule_name || "Unknown Rule",
        category: wr.framework_rules?.rule_categories?.name || null,
        failCount: wr.fail_count,
      })),
      preferences: {
        analysisMode: preferences?.analysis_mode || "realtime",
        activePlatforms: preferences?.active_platforms || ["chatgpt", "claude", "gemini"],
        primaryAiPlatform: preferences?.primary_ai_platform || "claude-sonnet",
        showScoreBadge: preferences?.show_score_badge ?? true,
        showHoverSuggestions: preferences?.show_hover_suggestions ?? true,
        autoReplaceOnRewrite: preferences?.auto_replace_on_rewrite ?? false,
        // Snooze preferences
        defaultSnoozeMinutes: preferences?.default_snooze_minutes ?? 30,
        autoUnsnoozeEnabled: preferences?.auto_unsnooze_enabled ?? true,
        showRewriteConfirmation: preferences?.show_rewrite_confirmation ?? true,
        snoozeAnalyticsEnabled: preferences?.snooze_analytics_enabled ?? true,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-extension-data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
