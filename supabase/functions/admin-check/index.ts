import { assertAdmin } from "../_shared/admin.ts";

Deno.serve(async (req) => {
  const res = await assertAdmin(req);
  if (!res.ok) {
    return new Response(JSON.stringify({ is_admin: false }), {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ is_admin: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
