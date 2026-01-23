import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Platform rates: $ per 1K tokens
const PLATFORM_RATES: Record<string, { input: number; output: number }> = {
  "claude-sonnet": { input: 0.003, output: 0.015 },
  "claude-opus": { input: 0.015, output: 0.075 },
  "gpt-4o": { input: 0.005, output: 0.015 },
  "gpt-4": { input: 0.03, output: 0.06 },
  "gemini-pro": { input: 0.00125, output: 0.005 },
};

const AVG_RESPONSE_TOKENS = 500;
const MINUTES_PER_RETRY = 2;

function estimateTokens(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words * 1.3);
}

function estimateRetries(score: number): number {
  if (score < 50) return 3;
  if (score < 70) return 2;
  if (score < 85) return 1;
  return 0;
}

function calculateMoneySaved(
  tokensSaved: number,
  retriesAvoided: number,
  tokensOriginal: number,
  platform: string
): number {
  const rates = PLATFORM_RATES[platform] || PLATFORM_RATES["claude-sonnet"];

  // Savings from shorter prompt
  const inputSavings = (tokensSaved / 1000) * rates.input;

  // Savings from avoided retries (both input + output tokens)
  const retryInputSavings = ((retriesAvoided * tokensOriginal) / 1000) * rates.input;
  const retryOutputSavings = ((retriesAvoided * AVG_RESPONSE_TOKENS) / 1000) * rates.output;

  const totalDollars = inputSavings + retryInputSavings + retryOutputSavings;
  return Math.round(totalDollars * 100); // Return cents as integer
}

function calculateRunningAverage(
  currentAvg: number,
  newValue: number,
  count: number
): number {
  return (currentAvg * count + newValue) / (count + 1);
}

interface UpdateSavingsRequest {
  user_id: string;
  analysis_id: string;
  original_prompt: string;
  rewritten_prompt: string;
  score_before: number;
  score_after: number;
  ai_platform?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: UpdateSavingsRequest = await req.json();
    const {
      user_id,
      analysis_id,
      original_prompt,
      rewritten_prompt,
      score_before,
      score_after,
      ai_platform: requestPlatform,
    } = body;

    if (!user_id || !original_prompt || !rewritten_prompt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Calculate token counts
    const tokensOriginal = estimateTokens(original_prompt);
    const tokensRewritten = estimateTokens(rewritten_prompt);
    const promptTokensSaved = Math.max(0, tokensOriginal - tokensRewritten);

    // Step 2: Estimate retries avoided
    const retriesBefore = estimateRetries(score_before);
    const retriesAfter = estimateRetries(score_after);
    const retriesAvoided = Math.max(0, retriesBefore - retriesAfter);

    // Step 3: Calculate total tokens saved (including avoided retries)
    const retryTokensSaved = retriesAvoided * (tokensOriginal + AVG_RESPONSE_TOKENS);
    const totalTokensSaved = promptTokensSaved + retryTokensSaved;

    // Get user's preferred platform or use passed platform
    let aiPlatform = requestPlatform || "claude-sonnet";
    
    // Try to get user's preferred platform from existing stats
    const { data: existingStats } = await supabase
      .from("user_savings_stats")
      .select("preferred_ai_platform")
      .eq("user_id", user_id)
      .single();

    if (existingStats?.preferred_ai_platform && !requestPlatform) {
      aiPlatform = existingStats.preferred_ai_platform;
    }

    // Step 4: Calculate money saved
    const moneySavedCents = calculateMoneySaved(
      promptTokensSaved,
      retriesAvoided,
      tokensOriginal,
      aiPlatform
    );

    // Step 5: Calculate time saved
    const timeSavedMinutes = retriesAvoided * MINUTES_PER_RETRY;

    // Step 6: Update prompt_analysis_log record if analysis_id provided
    if (analysis_id) {
      await supabase
        .from("prompt_analysis_log")
        .update({
          estimated_tokens_original: tokensOriginal,
          estimated_tokens_rewritten: tokensRewritten,
          tokens_saved: totalTokensSaved,
          money_saved_cents: moneySavedCents,
          retries_avoided: retriesAvoided,
        })
        .eq("id", analysis_id);
    }

    // Step 7: Upsert user_savings_stats
    const { data: existing } = await supabase
      .from("user_savings_stats")
      .select("*")
      .eq("user_id", user_id)
      .single();

    if (existing) {
      // Update existing stats
      await supabase
        .from("user_savings_stats")
        .update({
          total_prompts_rewritten: existing.total_prompts_rewritten + 1,
          total_tokens_saved: existing.total_tokens_saved + totalTokensSaved,
          total_money_saved_cents: existing.total_money_saved_cents + moneySavedCents,
          total_retries_avoided: existing.total_retries_avoided + retriesAvoided,
          total_time_saved_minutes: existing.total_time_saved_minutes + timeSavedMinutes,
          current_month_tokens_saved: existing.current_month_tokens_saved + totalTokensSaved,
          current_month_money_saved_cents: existing.current_month_money_saved_cents + moneySavedCents,
          avg_score_before: calculateRunningAverage(
            existing.avg_score_before,
            score_before,
            existing.total_prompts_rewritten
          ),
          avg_score_after: calculateRunningAverage(
            existing.avg_score_after,
            score_after,
            existing.total_prompts_rewritten
          ),
          last_calculated_at: new Date().toISOString(),
        })
        .eq("user_id", user_id);
    } else {
      // Insert new stats record
      await supabase.from("user_savings_stats").insert({
        user_id,
        total_prompts_analyzed: 1,
        total_prompts_rewritten: 1,
        total_tokens_saved: totalTokensSaved,
        total_money_saved_cents: moneySavedCents,
        total_retries_avoided: retriesAvoided,
        total_time_saved_minutes: timeSavedMinutes,
        current_month_tokens_saved: totalTokensSaved,
        current_month_money_saved_cents: moneySavedCents,
        avg_score_before: score_before,
        avg_score_after: score_after,
        preferred_ai_platform: aiPlatform,
        last_calculated_at: new Date().toISOString(),
      });
    }

    const result = {
      tokens_saved: totalTokensSaved,
      money_saved_cents: moneySavedCents,
      retries_avoided: retriesAvoided,
      time_saved_minutes: timeSavedMinutes,
      score_improvement: score_after - score_before,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Update savings error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
