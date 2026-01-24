import { assertAdmin, sanitizeSearchInput, corsHeaders } from "../_shared/admin.ts";

type Body = { q?: string; tier?: string; status?: string; page?: number; pageSize?: number };

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
  const status = body.status ?? "all";
  const pageSize = Math.min(200, Math.max(1, Number(body.pageSize ?? 50)));
  const page = Math.max(1, Number(body.page ?? 1));

  let query = auth.adminClient
    .from("profiles")
    .select("id,email,full_name,tier,subscription_status,total_analyses_count,created_at,last_login_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // Use sanitized input in OR clause
    query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);
  }
  if (tier !== "all") query = query.eq("tier", tier);
  if (status !== "all") query = query.eq("subscription_status", status);

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
