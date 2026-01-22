import { assertAdmin } from "../_shared/admin.ts";

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  const auth = await assertAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: auth.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date();
  const today = isoDay(now);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterday = isoDay(yesterdayDate);

  const db = auth.adminClient;

  const [{ count: totalUsers }, tiers, todayAnalyses, yesterdayAnalyses] = await Promise.all([
    db.from("profiles").select("id", { count: "exact", head: true }),
    db.from("profiles").select("tier", { count: "exact" }),
    db
      .from("prompt_analysis_log")
      .select("analysis_method", { count: "exact" })
      .gte("created_at", `${today}T00:00:00.000Z`)
      .lte("created_at", `${today}T23:59:59.999Z`),
    db
      .from("prompt_analysis_log")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${yesterday}T00:00:00.000Z`)
      .lte("created_at", `${yesterday}T23:59:59.999Z`),
  ]);

  const usersByTier: Record<string, number> = { free: 0, pro: 0, enterprise: 0 };
  if (tiers.data) {
    for (const r of tiers.data as Array<{ tier: string }>) {
      usersByTier[r.tier] = (usersByTier[r.tier] ?? 0) + 1;
    }
  }

  const todayByMethod: Record<string, number> = { template: 0, llm: 0 };
  if (todayAnalyses.data) {
    for (const r of todayAnalyses.data as Array<{ analysis_method: string }>) {
      todayByMethod[r.analysis_method] = (todayByMethod[r.analysis_method] ?? 0) + 1;
    }
  }

  const recent = await db
    .from("prompt_analysis_log")
    .select("id,created_at,user_id,score")
    .order("created_at", { ascending: false })
    .limit(20);

  const userIds = Array.from(new Set((recent.data ?? []).map((r: any) => r.user_id).filter(Boolean)));
  const profiles = userIds.length
    ? await db.from("profiles").select("id,email").in("id", userIds)
    : { data: [] as Array<{ id: string; email: string | null }> };
  const emailById = new Map((profiles.data ?? []).map((p) => [p.id, p.email]));

  const activity = (recent.data ?? []).map((r: any) => {
    const email = emailById.get(r.user_id) ?? r.user_id;
    return {
      type: "analysis" as const,
      message: `📝 Analysis performed by ${email} (score: ${r.score})`,
      created_at: r.created_at,
      href: `/admin/analyses`,
    };
  });

  const body = {
    total_users: totalUsers ?? 0,
    users_by_tier: usersByTier,
    analyses_today: todayAnalyses.count ?? 0,
    analyses_yesterday: yesterdayAnalyses.count ?? 0,
    analyses_today_by_method: todayByMethod,
    activity,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
