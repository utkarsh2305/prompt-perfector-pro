import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function assertAdmin(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !anonKey) {
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  const auth = req.headers.get("Authorization") ?? "";
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  if (userErr || !user) {
    return { ok: false as const, status: 401, body: { error: "Unauthorized" } };
  }

  const { data: isRoleAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (roleErr || !isRoleAdmin) {
    return { ok: false as const, status: 403, body: { error: "Forbidden" } };
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  const email = (profile?.email ?? user.email ?? "").toLowerCase();

  const allowlist = parseAllowlist(Deno.env.get("ADMIN_EMAILS"));
  const allowlisted = allowlist.includes(email);
  if (!allowlisted) {
    return { ok: false as const, status: 403, body: { error: "Forbidden" } };
  }

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRole) {
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  const adminClient = createClient(url, serviceRole);
  return { ok: true as const, user, email, adminClient };
}
