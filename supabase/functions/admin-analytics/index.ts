import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { assertAdmin, corsHeaders } from "../_shared/admin.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminResult = await assertAdmin(req);
    if (!adminResult.ok) {
      return new Response(JSON.stringify(adminResult.body), {
        status: adminResult.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = adminResult.adminClient;
    const { tab, days = 30 } = await req.json();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    if (tab === "users") {
      // User metrics from usage_analytics table
      const { data: analyticsData } = await supabase
        .from("usage_analytics")
        .select("*")
        .gte("date", formatDate(startDate))
        .order("date", { ascending: true });

      // Current user counts
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { count: proUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tier", "pro");

      const { count: freeUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("tier", "free");

      // Signups in last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: newSignups7d } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo.toISOString());

      // Active users (analyzed in last 7 days)
      const { data: activeData } = await supabase
        .from("prompt_analysis_log")
        .select("user_id")
        .gte("created_at", sevenDaysAgo.toISOString());

      const activeUsers = new Set(activeData?.map((r) => r.user_id) || []).size;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total_users: totalUsers || 0,
            pro_users: proUsers || 0,
            free_users: freeUsers || 0,
            new_signups_7d: newSignups7d || 0,
            active_users_7d: activeUsers,
            dau_mau_ratio: totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0,
            trend: analyticsData || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tab === "engagement") {
      // Analyses per user - calculate manually instead of RPC
      const { data: allAnalyses } = await supabase
        .from("prompt_analysis_log")
        .select("user_id")
        .gte("created_at", formatDate(startDate));

      const userAnalysisCounts: Record<string, number> = {};
      (allAnalyses || []).forEach((row) => {
        userAnalysisCounts[row.user_id] = (userAnalysisCounts[row.user_id] || 0) + 1;
      });
      const userCount = Object.keys(userAnalysisCounts).length;
      const totalAnalyses = allAnalyses?.length || 0;
      const avgAnalysesPerUser = userCount > 0 ? totalAnalyses / userCount : 0;

      // Usage by day of week
      const { data: byDayOfWeek } = await supabase
        .from("prompt_analysis_log")
        .select("created_at")
        .gte("created_at", formatDate(startDate));

      const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
      const hourCounts = Array(24).fill(0);

      (byDayOfWeek || []).forEach((row) => {
        const d = new Date(row.created_at);
        dayOfWeekCounts[d.getDay()]++;
        hourCounts[d.getHours()]++;
      });

      // Recent trend
      const { data: trendData } = await supabase
        .from("usage_analytics")
        .select("date, total_analyses, active_users, new_users")
        .gte("date", formatDate(startDate))
        .order("date", { ascending: true });

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            avg_analyses_per_user: avgAnalysesPerUser,
            by_day_of_week: dayOfWeekCounts,
            by_hour: hourCounts,
            trend: trendData || [],
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tab === "quality") {
      // Score distribution
      const { data: scoreData } = await supabase
        .from("prompt_analysis_log")
        .select("score, grade, violations, ai_platform")
        .gte("created_at", formatDate(startDate));

      const gradeDistribution: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
      const platformScores: Record<string, { total: number; count: number }> = {};
      const violationCounts: Record<string, number> = {};
      let totalScore = 0;

      (scoreData || []).forEach((row) => {
        totalScore += row.score;
        if (row.grade) gradeDistribution[row.grade] = (gradeDistribution[row.grade] || 0) + 1;

        const platform = row.ai_platform || "other";
        if (!platformScores[platform]) platformScores[platform] = { total: 0, count: 0 };
        platformScores[platform].total += row.score;
        platformScores[platform].count++;

        const violations = row.violations as Array<{ principle?: string }>;
        if (Array.isArray(violations)) {
          violations.forEach((v) => {
            const key = v.principle || "Unknown";
            violationCounts[key] = (violationCounts[key] || 0) + 1;
          });
        }
      });

      const avgScore = scoreData?.length ? (totalScore / scoreData.length).toFixed(1) : "0";

      const platformAvgScores = Object.entries(platformScores).map(([platform, data]) => ({
        platform,
        avg_score: (data.total / data.count).toFixed(1),
        count: data.count,
      }));

      const topViolations = Object.entries(violationCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([principle, count]) => ({ principle, count }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            avg_score: avgScore,
            total_analyses: scoreData?.length || 0,
            grade_distribution: gradeDistribution,
            platform_scores: platformAvgScores,
            top_violations: topViolations,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tab === "technical") {
      // Processing times
      const { data: perfData } = await supabase
        .from("prompt_analysis_log")
        .select("processing_time_ms, llm_cost_cents, analysis_method, created_at")
        .gte("created_at", formatDate(startDate))
        .not("processing_time_ms", "is", null)
        .order("created_at", { ascending: true });

      const times = (perfData || []).map((r) => r.processing_time_ms).filter(Boolean).sort((a, b) => a - b);
      const p50 = times[Math.floor(times.length * 0.5)] || 0;
      const p95 = times[Math.floor(times.length * 0.95)] || 0;
      const p99 = times[Math.floor(times.length * 0.99)] || 0;

      const totalCost = (perfData || []).reduce((sum, r) => sum + (r.llm_cost_cents || 0), 0);
      const llmCount = (perfData || []).filter((r) => r.analysis_method === "llm").length;

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            response_times: { p50, p95, p99 },
            total_llm_cost_cents: totalCost,
            llm_analysis_count: llmCount,
            avg_cost_per_llm: llmCount ? (totalCost / llmCount).toFixed(2) : "0",
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid tab" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("Unauthorized") || message.includes("Forbidden") ? 403 : 500;
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
