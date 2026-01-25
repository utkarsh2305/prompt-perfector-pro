import { assertAdmin, corsHeaders } from "../_shared/admin.ts";

interface ChangeTierBody {
  userId: string;
  newTier: "free" | "pro" | "unlimited";
  creditPackageId?: string;
  reason?: string;
}

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

  try {
    const body = (await req.json()) as ChangeTierBody;
    const { userId, newTier, creditPackageId, reason } = body;

    // Validate inputs
    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newTier || !["free", "pro", "unlimited"].includes(newTier)) {
      return new Response(
        JSON.stringify({ success: false, error: "Valid tier is required (free, pro, unlimited)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For Pro tier, validate credit package if provided
    if (newTier === "pro" && creditPackageId) {
      const { data: pkg, error: pkgError } = await auth.adminClient
        .from("credit_packages")
        .select("id, is_active")
        .eq("id", creditPackageId)
        .single();

      if (pkgError || !pkg?.is_active) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid or inactive credit package" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get current user info for logging
    const { data: currentProfile, error: profileError } = await auth.adminClient
      .from("profiles")
      .select("tier, email")
      .eq("id", userId)
      .single();

    if (profileError || !currentProfile) {
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const oldTier = currentProfile.tier;

    // Use the existing change_user_tier database function
    const { data: result, error: changeError } = await auth.adminClient.rpc("change_user_tier", {
      user_uuid: userId,
      new_tier: newTier,
      new_credit_package_id: newTier === "pro" ? creditPackageId ?? null : null,
      new_billing_cycle: "monthly", // Default to monthly for admin changes
    });

    if (changeError) {
      console.error("Tier change error:", changeError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to change tier" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the admin action in rewrite_transactions with metadata
    await auth.adminClient.from("rewrite_transactions").insert({
      user_id: userId,
      transaction_type: "tier_change",
      credits_amount: 0,
      balance_after: result?.new_credits ?? 0,
      metadata: {
        admin_email: auth.email,
        admin_user_id: auth.user.id,
        old_tier: oldTier,
        new_tier: newTier,
        credit_package_id: creditPackageId ?? null,
        reason: reason ?? null,
        changed_at: new Date().toISOString(),
      },
    });

    console.log(`Admin ${auth.email} changed user ${userId} (${currentProfile.email}) from ${oldTier} to ${newTier}`);

    return new Response(
      JSON.stringify({
        success: true,
        oldTier,
        newTier,
        newCredits: result?.new_credits ?? 0,
        message: `User tier changed from ${oldTier} to ${newTier}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin change tier error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
