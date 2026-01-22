import { assertAdmin } from "../_shared/admin.ts";

type Body = { q?: string; platform?: string; method?: string; page?: number; pageSize?: number };

Deno.serve(async (req) => {
  const auth = await assertAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: auth.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const q = (body.q ?? "").trim();
  const platform = body.platform ?? "all";
  const method = body.method ?? "all";
  const pageSize = Math.min(200, Math.max(1, Number(body.pageSize ?? 25)));
  const page = Math.max(1, Number(body.page ?? 1));

  let query = auth.adminClient
    .from("prompt_analysis_log")
    .select(
      "id,created_at,user_id,original_prompt,score,grade,ai_platform,analysis_method,processing_time_ms,llm_cost_cents",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (platform !== "all") query = query.eq("ai_platform", platform);
  if (method !== "all") query = query.eq("analysis_method", method);
  if (q) query = query.ilike("original_prompt", `%${q}%`);

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) {
    return new Response(JSON.stringify({ success: false, error: "Query failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userIds = Array.from(new Set((data ?? []).map((r: any) => r.user_id).filter(Boolean)));
  const profiles = userIds.length
    ? await auth.adminClient.from("profiles").select("id,email").in("id", userIds)
    : { data: [] as Array<{ id: string; email: string | null }> };
  const emailById = new Map((profiles.data ?? []).map((p) => [p.id, p.email]));

  const rows = (data ?? []).map((r: any) => ({
    ...r,
    user_email: emailById.get(r.user_id) ?? null,
  }));

  return new Response(JSON.stringify({ rows, total: count ?? 0 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
