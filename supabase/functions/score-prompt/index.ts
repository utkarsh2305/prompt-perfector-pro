import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FrameworkRule {
  id: string;
  rule_number: number;
  rule_name: string;
  rule_description: string | null;
  category_id: string | null;
  weight: number;
  detection_keywords: string[];
  detection_patterns: string[];
  improvement_template: string | null;
  tier_required: string;
  rule_categories?: { name: string }[] | { name: string } | null;
}

interface RuleBreakdown {
  ruleId: string;
  ruleName: string;
  category: string | null;
  weight: number;
  score: number; // 0, 0.5, or 1
  suggestion: string | null;
}

interface ScoreResponse {
  score: number;
  grade: string;
  gradeLabel: string;
  breakdown: RuleBreakdown[];
  passed: string[];
  partial: string[];
  failed: string[];
  topImprovements: string[];
  strengths: string[];
}

// Check if a prompt follows a rule
function checkRule(prompt: string, rule: FrameworkRule): number {
  const promptLower = prompt.toLowerCase();
  let score = 0;

  // Check keywords (partial match)
  const keywordMatches = (rule.detection_keywords || []).filter((kw) =>
    promptLower.includes(kw.toLowerCase())
  );
  if (keywordMatches.length > 0) {
    score += 0.5;
  }

  // Check regex patterns (if any match, full score)
  const patterns = rule.detection_patterns || [];
  if (patterns.length > 0) {
    const patternMatches = patterns.some((pattern) => {
      try {
        return new RegExp(pattern, "i").test(prompt);
      } catch {
        // Invalid regex, skip
        return false;
      }
    });
    if (patternMatches) {
      score = 1;
    }
  }

  return Math.min(score, 1); // Cap at 1
}

// Determine grade from percentage
function getGrade(percentage: number): { grade: string; label: string } {
  if (percentage >= 90) return { grade: "A", label: "Excellent" };
  if (percentage >= 80) return { grade: "B+", label: "Great" };
  if (percentage >= 70) return { grade: "B", label: "Good" };
  if (percentage >= 60) return { grade: "C", label: "Needs Work" };
  if (percentage >= 50) return { grade: "D", label: "Poor" };
  return { grade: "F", label: "Rewrite Recommended" };
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

    // Parse request body
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'prompt' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (prompt.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Prompt too long. Maximum 10,000 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user tier to filter rules
    const { data: profile } = await supabase
      .from("profiles")
      .select("tier")
      .eq("id", user.id)
      .maybeSingle();

    const userTier = profile?.tier || "free";
    const allowedTiers = ["free"];
    if (userTier === "pro" || userTier === "enterprise") {
      allowedTiers.push("pro");
    }
    if (userTier === "enterprise") {
      allowedTiers.push("enterprise");
    }

    // Fetch all active rules
    const { data: rules, error: rulesError } = await supabase
      .from("framework_rules")
      .select(`
        id,
        rule_number,
        rule_name,
        rule_description,
        category_id,
        weight,
        detection_keywords,
        detection_patterns,
        improvement_template,
        tier_required,
        rule_categories (name)
      `)
      .eq("is_active", true)
      .in("tier_required", allowedTiers)
      .order("rule_number", { ascending: true });

    if (rulesError) {
      throw new Error(`Failed to fetch rules: ${rulesError.message}`);
    }

    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active rules found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Score each rule
    const breakdown: RuleBreakdown[] = [];
    const passed: string[] = [];
    const partial: string[] = [];
    const failed: string[] = [];
    let maxPossible = 0;
    let actualScore = 0;

    for (const rule of rules as FrameworkRule[]) {
      const ruleScore = checkRule(prompt, rule);
      const weight = Number(rule.weight) || 1;

      maxPossible += weight;
      actualScore += ruleScore * weight;

      // Handle rule_categories which can be array or object from join
      const categoryName = Array.isArray(rule.rule_categories)
        ? rule.rule_categories[0]?.name || null
        : rule.rule_categories?.name || null;

      const item: RuleBreakdown = {
        ruleId: rule.id,
        ruleName: rule.rule_name,
        category: categoryName,
        weight,
        score: ruleScore,
        suggestion: ruleScore < 1 ? rule.improvement_template : null,
      };

      breakdown.push(item);

      if (ruleScore === 1) {
        passed.push(rule.id);
      } else if (ruleScore === 0.5) {
        partial.push(rule.id);
      } else {
        failed.push(rule.id);
      }
    }

    // Calculate percentage score
    const percentage = maxPossible > 0 ? Math.round((actualScore / maxPossible) * 100) : 0;
    const { grade, label } = getGrade(percentage);

    // Get top 3 improvements from failed rules (sorted by weight)
    const failedRules = breakdown
      .filter((b) => b.score === 0 && b.suggestion)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((b) => b.suggestion!);

    // Get top 3 strengths from passed rules
    const strengths = breakdown
      .filter((b) => b.score === 1)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map((b) => b.ruleName);

    // Update user_weak_rules for failed rules
    const failedRulePromises = failed.map((ruleId) =>
      supabase.rpc("increment_weak_rule", {
        p_user_id: user.id,
        p_rule_id: ruleId,
      })
    );

    // Also update effectiveness tracking for all rules
    const effectivenessPromises = breakdown.map((b) =>
      supabase.rpc("update_rule_effectiveness", {
        p_rule_id: b.ruleId,
        p_was_triggered: true,
        p_was_followed: b.score === 1,
      })
    );

    // Log to prompt_analysis_log
    const processingTimeMs = Date.now() - startTime;

    // Build violations array for storage
    const violations = breakdown
      .filter((b) => b.score < 1)
      .map((b) => ({
        rule_id: b.ruleId,
        section: b.category || "General",
        principle: b.ruleName,
        issue: b.score === 0 ? "Rule not followed" : "Rule partially followed",
        severity: b.weight >= 4 ? "critical" : b.weight >= 3 ? "major" : "minor",
        penalty: Math.round((1 - b.score) * b.weight),
        suggestion: b.suggestion || "",
      }));

    const logPromise = supabase.from("prompt_analysis_log").insert({
      user_id: user.id,
      original_prompt: prompt,
      prompt_length: prompt.length,
      score: percentage,
      max_score: 100,
      grade: grade.replace("+", "") as "A" | "B" | "C" | "D" | "F", // Supabase enum doesn't have B+
      violations,
      analysis_method: "template",
      improved_prompt: "", // Will be filled by rewrite function
      processing_time_ms: processingTimeMs,
    });

    // Execute all background operations in parallel (don't wait for them)
    Promise.all([
      ...failedRulePromises,
      ...effectivenessPromises,
      logPromise,
    ]).catch((err) => console.error("Background operations failed:", err));

    // Build response
    const response: ScoreResponse = {
      score: percentage,
      grade,
      gradeLabel: label,
      breakdown,
      passed,
      partial,
      failed,
      topImprovements: failedRules,
      strengths,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("score-prompt error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
