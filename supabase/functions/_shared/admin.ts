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

/**
 * Sanitizes search input for use in ILIKE queries.
 * Escapes special SQL LIKE characters and limits length.
 */
export function sanitizeSearchInput(input: string, maxLength = 100): string {
  if (!input || typeof input !== "string") return "";
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, maxLength);
  
  // Escape SQL LIKE special characters: %, _, \
  sanitized = sanitized
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
  
  return sanitized;
}

export async function assertAdmin(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
  
  if (!url || !anonKey) {
    console.error("Admin check failed: missing configuration");
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  const auth = req.headers.get("Authorization") ?? "";
  
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  const user = userData?.user;
  
  if (userErr || !user) {
    console.warn("Admin check failed: authentication required");
    return { ok: false as const, status: 401, body: { error: "Unauthorized" } };
  }

  const { data: isRoleAdmin, error: roleErr } = await supabase.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  
  if (roleErr || !isRoleAdmin) {
    console.warn("Admin check failed: insufficient role");
    return { ok: false as const, status: 403, body: { error: "Forbidden - no admin role" } };
  }

  const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle();
  const email = (profile?.email ?? user.email ?? "").toLowerCase();

  const adminEmailsRaw = Deno.env.get("ADMIN_EMAILS");
  const allowlist = parseAllowlist(adminEmailsRaw);
  const allowlisted = allowlist.includes(email);
  
  if (!allowlisted) {
    console.warn("Admin check failed: email not in allowlist");
    return { ok: false as const, status: 403, body: { error: "Forbidden - email not allowlisted" } };
  }

  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRole) {
    console.error("Admin check failed: missing service role key");
    return { ok: false as const, status: 500, body: { error: "Misconfigured server" } };
  }

  const adminClient = createClient(url, serviceRole);
  return { ok: true as const, user, email, adminClient };
}
