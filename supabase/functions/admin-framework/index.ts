import { assertAdmin, sanitizeSearchInput, corsHeaders } from "../_shared/admin.ts";

type Body = { q?: string; tier?: string; active?: string; page?: number; pageSize?: number };

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const auth = await assertAdmin(req);
  if (!auth.ok) {
    return new Response(JSON.stringify({ success: false, error: "Forbidden" }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const q = sanitizeSearchInput(body.q ?? "", 100);
  const tier = body.tier ?? "all";
  const active = body.active ?? "all";
  const pageSize = Math.min(200, Math.max(1, Number(body.pageSize ?? 25)));
  const page = Math.max(1, Number(body.page ?? 1));

  let query = auth.adminClient
    .from("framework_principles")
    .select(
      "id,section_number,section_name,principle,severity_level,default_penalty,tier_required,is_active",
      { count: "exact" },
    )
    .order("section_number", { ascending: true })
    .order("display_order", { ascending: true, nullsFirst: true });

  if (q) query = query.ilike("principle", `%${q}%`);
  if (tier !== "all") query = query.eq("tier_required", tier);
  if (active !== "all") query = query.eq("is_active", active === "true");

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, count, error } = await query.range(from, to);
  if (error) {
    return new Response(JSON.stringify({ success: false, error: "Query failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ rows: data ?? [], total: count ?? 0 }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
