import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseAllowlist(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function assertAdmin(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  
  console.log("assertAdmin: SUPABASE_URL exists:", !!url);
  console.log("assertAdmin: anonKey exists:", !!anonKey);
  
  if (!url || !anonKey) {
    console.error("Missing SUPABASE_URL or anonKey");
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  const auth = req.headers.get("Authorization") ?? "";
  console.log("assertAdmin: Auth header present:", !!auth);
  
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  console.log("assertAdmin: User found:", !!user, "Error:", userErr?.message);
  
  if (userErr || !user) {
    return { ok: false as const, status: 401, body: { error: "Unauthorized" } };
  }

  console.log("assertAdmin: User ID:", user.id, "Email:", user.email);

  const { data: isRoleAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  console.log("assertAdmin: has_role result:", isRoleAdmin, "Error:", roleErr?.message);
  
  if (roleErr || !isRoleAdmin) {
    console.log("assertAdmin: User does not have admin role");
    return { ok: false as const, status: 403, body: { error: "Forbidden - no admin role" } };
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  const email = (profile?.email ?? user.email ?? "").toLowerCase();
  console.log("assertAdmin: Profile email:", profile?.email, "Final email:", email);

  const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS");
  console.log("assertAdmin: ADMIN_EMAILS raw:", adminEmailsRaw);
  
  const allowlist = parseAllowlist(adminEmailsRaw);
  console.log("assertAdmin: Allowlist parsed:", allowlist);
  
  const allowlisted = allowlist.includes(email);
  console.log("assertAdmin: Email in allowlist:", allowlisted);
  
  if (!allowlisted) {
    return { ok: false as const, status: 403, body: { error: "Forbidden - email not allowlisted" } };
  }

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRole) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  console.log("assertAdmin: Admin check passed for:", email);
  const adminClient = createClient(url, serviceRole);
  return { ok: true as const, user, email, adminClient };
}
