import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Calculate yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split("T")[0];

    console.log(`[aggregate-analytics] Aggregating data for ${dateStr}`);

    // Check if we already have data for this date
    const { data: existing } = await supabase
      .from("usage_analytics")
      .select("id")
      .eq("date", dateStr)
      .maybeSingle();

    if (existing) {
      console.log(`[aggregate-analytics] Data already exists for ${dateStr}, skipping`);
      return new Response(
        JSON.stringify({ success: true, message: "Already aggregated", date: dateStr }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get start and end of yesterday
    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    // Fetch user counts
    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .lte("created_at", endOfDay);

    const { count: freeUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tier", "free")
      .lte("created_at", endOfDay);

    const { count: proUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tier", "pro")
      .lte("created_at", endOfDay);

    const { count: enterpriseUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("tier", "enterprise")
      .lte("created_at", endOfDay);

    // New users on this day
    const { count: newUsers } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    // Fetch analyses for this day
    const { data: analyses } = await supabase
      .from("prompt_analysis_log")
      .select("user_id, score, analysis_method, ai_platform, llm_cost_cents")
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    const analysesArray = analyses || [];
    const totalAnalyses = analysesArray.length;

    // Count by method
    const templateAnalyses = analysesArray.filter((a) => a.analysis_method === "template").length;
    const llmAnalyses = analysesArray.filter((a) => a.analysis_method === "llm").length;

    // Count by platform
    const chatgptAnalyses = analysesArray.filter((a) => a.ai_platform === "chatgpt").length;
    const claudeAnalyses = analysesArray.filter((a) => a.ai_platform === "claude").length;
    const geminiAnalyses = analysesArray.filter((a) => a.ai_platform === "gemini").length;
    const otherAnalyses = analysesArray.filter(
      (a) => a.ai_platform && !["chatgpt", "claude", "gemini"].includes(a.ai_platform)
    ).length;

    // Average score
    const avgScore =
      totalAnalyses > 0
        ? analysesArray.reduce((sum, a) => sum + (a.score || 0), 0) / totalAnalyses
        : null;

    // Active users (distinct users who analyzed)
    const activeUsers = new Set(analysesArray.map((a) => a.user_id)).size;

    // LLM costs
    const totalLlmCostCents = analysesArray.reduce((sum, a) => sum + (a.llm_cost_cents || 0), 0);
    const avgCostPerAnalysisCents = llmAnalyses > 0 ? totalLlmCostCents / llmAnalyses : 0;

    // Insert aggregated data
    const { error: insertError } = await supabase.from("usage_analytics").insert({
      date: dateStr,
      total_users: totalUsers || 0,
      free_users: freeUsers || 0,
      pro_users: proUsers || 0,
      enterprise_users: enterpriseUsers || 0,
      new_users: newUsers || 0,
      active_users: activeUsers,
      total_analyses: totalAnalyses,
      template_analyses: templateAnalyses,
      llm_analyses: llmAnalyses,
      avg_score: avgScore,
      total_llm_cost_cents: totalLlmCostCents,
      avg_cost_per_analysis_cents: avgCostPerAnalysisCents,
      chatgpt_analyses: chatgptAnalyses,
      claude_analyses: claudeAnalyses,
      gemini_analyses: geminiAnalyses,
      other_analyses: otherAnalyses,
    });

    if (insertError) {
      throw new Error(`Insert error: ${insertError.message}`);
    }

    console.log(`[aggregate-analytics] Successfully aggregated data for ${dateStr}`);

    return new Response(
      JSON.stringify({
        success: true,
        date: dateStr,
        metrics: {
          total_users: totalUsers,
          new_users: newUsers,
          active_users: activeUsers,
          total_analyses: totalAnalyses,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[aggregate-analytics] Error: ${message}`);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
