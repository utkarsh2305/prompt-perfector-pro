import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Model configurations with pricing
const MODELS: Record<string, {
  provider: string;
  model: string;
  gatewayModel?: string; // For Lovable AI Gateway
  inputCostPer1M: number;
  outputCostPer1M: number;
}> = {
  "gemini-flash": {
    provider: "lovable-gateway",
    model: "gemini-1.5-flash",
    gatewayModel: "google/gemini-2.5-flash",
    inputCostPer1M: 0.075,
    outputCostPer1M: 0.30,
  },
  "gemini-pro": {
    provider: "lovable-gateway",
    model: "gemini-pro",
    gatewayModel: "google/gemini-3-flash-preview",
    inputCostPer1M: 0.125,
    outputCostPer1M: 0.50,
  },
  "gpt4o-mini": {
    provider: "lovable-gateway",
    model: "gpt-4o-mini",
    gatewayModel: "openai/gpt-5-mini",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  "gpt4o": {
    provider: "lovable-gateway",
    model: "gpt-4o",
    gatewayModel: "openai/gpt-5",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
  },
};

interface ScoreResult {
  score: number;
  grade: string;
  failed: string[];
  breakdown: Array<{
    ruleId: string;
    ruleName: string;
    category: string | null;
    weight: number;
    score: number;
    suggestion: string | null;
  }>;
}

interface RewriteInput {
  prompt: string;
  score_result: ScoreResult;
  model?: string;
}

interface RewriteResponse {
  rewritten_prompt: string;
  model_used: string;
  score_before: number;
  score_after: number;
  credits_remaining: number;
  tokens_used: { input: number; output: number };
  cost_cents: number;
  analysis_id?: string;
}

// Build system prompt with failed rules
function buildSystemPrompt(failedRules: Array<{ ruleName: string; suggestion: string | null }>): string {
  const rulesList = failedRules
    .filter((r) => r.suggestion)
    .map((r) => `- ${r.ruleName}: ${r.suggestion}`)
    .join("\n");

  return `You are a prompt engineering expert. Improve the user's prompt based on these issues:

Failed rules:
${rulesList || "No specific issues detected, but improve clarity and specificity."}

Requirements:
- Keep the original intent intact
- Make minimal changes to fix the issues
- Don't add unnecessary complexity
- Maintain the same language as the original prompt
- Return ONLY the improved prompt, no explanation or commentary`;
}

// Call Lovable AI Gateway
async function callLovableGateway(
  systemPrompt: string,
  userPrompt: string,
  modelConfig: typeof MODELS[string]
): Promise<{ content: string; inputTokens: number; outputTokens: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelConfig.gatewayModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable Gateway error:", response.status, errorText);

    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
    if (response.status === 402) {
      throw new Error("Payment required. Please add funds to your workspace.");
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};

  return {
    content: content.trim(),
    inputTokens: usage.prompt_tokens || Math.ceil(systemPrompt.length / 4) + Math.ceil(userPrompt.length / 4),
    outputTokens: usage.completion_tokens || Math.ceil(content.length / 4),
  };
}

// Calculate cost in cents
function calculateCost(
  inputTokens: number,
  outputTokens: number,
  modelConfig: typeof MODELS[string]
): number {
  const inputCost = (inputTokens / 1_000_000) * modelConfig.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * modelConfig.outputCostPer1M;
  return Math.round((inputCost + outputCost) * 100); // Convert to cents
}

// Re-score a prompt (simplified version of score-prompt logic)
async function rescorePrompt(
  supabase: any,
  prompt: string,
  userTier: string
): Promise<number> {
  const allowedTiers = ["free"];
  if (userTier === "pro" || userTier === "enterprise") {
    allowedTiers.push("pro");
  }
  if (userTier === "enterprise") {
    allowedTiers.push("enterprise");
  }

  const { data: rules } = await supabase
    .from("framework_rules")
    .select("weight, detection_keywords, detection_patterns")
    .eq("is_active", true)
    .in("tier_required", allowedTiers);

  if (!rules || rules.length === 0) return 50;

  const promptLower = prompt.toLowerCase();
  let maxPossible = 0;
  let actualScore = 0;

  for (const rule of rules as any[]) {
    const weight = Number(rule.weight) || 1;
    maxPossible += weight;

    let ruleScore = 0;

    // Check keywords
    const keywords = (rule.detection_keywords || []) as string[];
    const keywordMatches = keywords.filter((kw: string) =>
      promptLower.includes(kw.toLowerCase())
    );
    if (keywordMatches.length > 0) ruleScore += 0.5;

    // Check patterns
    const patterns = (rule.detection_patterns || []) as string[];
    if (patterns.length > 0) {
      const patternMatches = patterns.some((pattern: string) => {
        try {
          return new RegExp(pattern, "i").test(prompt);
        } catch {
          return false;
        }
      });
      if (patternMatches) ruleScore = 1;
    }

    actualScore += Math.min(ruleScore, 1) * weight;
  }

  return maxPossible > 0 ? Math.round((actualScore / maxPossible) * 100) : 50;
}

// Estimate tokens saved and calculate savings
function calculateSavings(
  originalPrompt: string,
  rewrittenPrompt: string,
  scoreBefore: number,
  scoreAfter: number,
  aiPlatform: string = "claude-sonnet"
): { tokensSaved: number; moneySavedCents: number; retriesAvoided: number } {
  // Token estimation (1.3x word count)
  const originalTokens = Math.ceil(originalPrompt.split(/\s+/).length * 1.3);
  const rewrittenTokens = Math.ceil(rewrittenPrompt.split(/\s+/).length * 1.3);

  // Retries avoided based on score improvement
  let retriesAvoided = 0;
  if (scoreBefore < 50) retriesAvoided = 3;
  else if (scoreBefore < 70) retriesAvoided = 2;
  else if (scoreBefore < 85) retriesAvoided = 1;

  // Token savings from better prompts = retries * average response tokens
  const avgResponseTokens = 500;
  const tokensSaved = retriesAvoided * (originalTokens + avgResponseTokens);

  // Cost per 1000 tokens by platform
  const platformCosts: Record<string, number> = {
    "claude-sonnet": 0.015,
    "claude-opus": 0.075,
    "gpt-4": 0.03,
    "gpt-4o": 0.01,
    "gemini-pro": 0.00125,
    "gemini-flash": 0.000075,
  };

  const costPer1k = platformCosts[aiPlatform] || 0.01;
  const moneySavedCents = Math.round((tokensSaved / 1000) * costPer1k * 100);

  return { tokensSaved, moneySavedCents, retriesAvoided };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    // Check rate limit (10 requests per minute)
    const rateLimitResult = await checkRateLimit(user.id, "rewrite-prompt", supabase);
    if (!rateLimitResult.allowed) {
      return rateLimitResponse(rateLimitResult, corsHeaders);
    }

    // Parse request body
    const { prompt, score_result, model = "gemini-flash" }: RewriteInput = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'prompt' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!score_result) {
      return new Response(
        JSON.stringify({ error: "Missing 'score_result' field. Run score-prompt first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get model config
    const modelConfig = MODELS[model] || MODELS["gemini-flash"];
    const modelUsed = model in MODELS ? model : "gemini-flash";

    // Check credits
    const { data: creditCheck } = await supabase.rpc("check_rewrite_credits", {
      user_uuid: user.id,
    });

    const canRewrite = creditCheck?.[0]?.can_rewrite ?? false;
    const isUnlimited = creditCheck?.[0]?.is_unlimited ?? false;
    let creditsRemaining = creditCheck?.[0]?.credits_remaining ?? 0;

    if (!canRewrite && !isUnlimited) {
      return new Response(
        JSON.stringify({ error: "No rewrite credits remaining", credits_remaining: 0 }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user profile for tier info
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle();

    const userTier = profile?.tier || "free";

    // Build failed rules list for system prompt
    const failedRules = score_result.breakdown
      .filter((b) => b.score < 1 && b.suggestion)
      .map((b) => ({ ruleName: b.ruleName, suggestion: b.suggestion }));

    const systemPrompt = buildSystemPrompt(failedRules);

    // Call AI to rewrite
    const { content: rewrittenPrompt, inputTokens, outputTokens } = await callLovableGateway(
      systemPrompt,
      `Please improve this prompt:\n\n${prompt}`,
      modelConfig
    );

    // Calculate cost
    const costCents = calculateCost(inputTokens, outputTokens, modelConfig);

    // Consume credit (if not unlimited)
    if (!isUnlimited) {
      const { data: consumeResult } = await supabase.rpc("consume_rewrite_credit", {
        user_uuid: user.id,
      });
      creditsRemaining = consumeResult?.[0]?.new_balance ?? creditsRemaining - 1;
    }

    // Re-score the rewritten prompt
    const scoreAfter = await rescorePrompt(supabase, rewrittenPrompt, userTier);
    const scoreBefore = score_result.score;

    // Calculate savings
    const savings = calculateSavings(
      prompt,
      rewrittenPrompt,
      scoreBefore,
      scoreAfter,
      "claude-sonnet" // Default platform for savings calculation
    );

    // Update the prompt_analysis_log with the rewrite
    const { data: analysis } = await supabase
      .from("prompt_analysis_log")
      .insert({
        user_id: user.id,
        original_prompt: prompt,
        prompt_length: prompt.length,
        score: scoreBefore,
        max_score: 100,
        grade: score_result.grade?.replace("+", "") as "A" | "B" | "C" | "D" | "F" || "C",
        violations: score_result.breakdown
          .filter((b) => b.score < 1)
          .map((b) => ({
            rule_id: b.ruleId,
            section: b.category || "General",
            principle: b.ruleName,
            issue: b.score === 0 ? "Rule not followed" : "Partially followed",
            severity: b.weight >= 4 ? "critical" : b.weight >= 3 ? "major" : "minor",
            penalty: Math.round((1 - b.score) * b.weight),
            suggestion: b.suggestion || "",
          })),
        analysis_method: "template",
        llm_model: modelConfig.model,
        improved_prompt: rewrittenPrompt,
        llm_tokens_input: inputTokens,
        llm_tokens_output: outputTokens,
        llm_cost_cents: costCents,
        processing_time_ms: Date.now() - startTime,
        estimated_tokens_original: Math.ceil(prompt.split(/\s+/).length * 1.3),
        estimated_tokens_rewritten: Math.ceil(rewrittenPrompt.split(/\s+/).length * 1.3),
        tokens_saved: savings.tokensSaved,
        money_saved_cents: savings.moneySavedCents,
        retries_avoided: savings.retriesAvoided,
      })
      .select("id")
      .maybeSingle();

    // Update user savings stats (fire and forget)
    supabase.functions.invoke("update-user-savings", {
      body: { user_id: user.id },
    }).catch((err) => console.error("Failed to update savings:", err));

    // Build response
    const response: RewriteResponse = {
      rewritten_prompt: rewrittenPrompt,
      model_used: modelUsed,
      score_before: scoreBefore,
      score_after: scoreAfter,
      credits_remaining: isUnlimited ? -1 : creditsRemaining,
      tokens_used: { input: inputTokens, output: outputTokens },
      cost_cents: costCents,
      analysis_id: analysis?.id,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("rewrite-prompt error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";

    // Check for rate limit or payment errors
    if (message.includes("Rate limit")) {
      return new Response(
        JSON.stringify({ error: message }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.includes("Payment required")) {
      return new Response(
        JSON.stringify({ error: message }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
