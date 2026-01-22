import { assertAdmin } from "../_shared/admin.ts";

type Body = { q?: string; tier?: string; status?: string; page?: number; pageSize?: number };

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
  const tier = body.tier ?? "all";
  const status = body.status ?? "all";
  const pageSize = Math.min(200, Math.max(1, Number(body.pageSize ?? 50)));
  const page = Math.max(1, Number(body.page ?? 1));

  let query = auth.adminClient
    .from("profiles")
    .select("id,email,full_name,tier,subscription_status,total_analyses_count,created_at,last_login_at", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    // simple OR emulation: do two ilike filters with RPC would be nicer, but keep MVP.
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
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ rows: data ?? [], total: count ?? 0 }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
