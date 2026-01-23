import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all users with active subscriptions that need reset
    const { data: subscriptions, error: subError } = await supabase
      .from("user_subscriptions")
      .select(`
        user_id,
        tier_name,
        credit_package_id,
        credit_packages (credits_amount)
      `)
      .eq("status", "active")
      .lte("current_period_end", new Date().toISOString());

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    const results = {
      processed: 0,
      errors: [] as string[],
    };

    for (const sub of subscriptions ?? []) {
      try {
        // Skip unlimited tier - no credits to reset
        if (sub.tier_name === "unlimited") {
          continue;
        }

        // Determine new credits based on tier
        let newCredits = 10; // Free tier default
        if (sub.tier_name === "pro" && sub.credit_packages) {
          const pkg = sub.credit_packages as unknown as { credits_amount: number };
          newCredits = pkg.credits_amount;
        }

        // Get current credits for rollover calculation
        const { data: currentCredits, error: creditsError } = await supabase
          .from("rewrite_credits")
          .select("credits_remaining")
          .eq("user_id", sub.user_id)
          .single();

        if (creditsError) {
          console.error(`Error fetching credits for user ${sub.user_id}:`, creditsError);
          results.errors.push(`User ${sub.user_id}: ${creditsError.message}`);
          continue;
        }

        // Calculate rollover (max 200 for pro, 0 for free)
        const maxRollover = sub.tier_name === "pro" ? 200 : 0;
        const rollover = Math.min(currentCredits?.credits_remaining ?? 0, maxRollover);
        const totalNewCredits = newCredits + rollover;

        // Update credits
        const { error: updateError } = await supabase
          .from("rewrite_credits")
          .update({
            credits_remaining: totalNewCredits,
            credits_used_this_period: 0,
            rollover_credits: rollover,
            last_reset_at: new Date().toISOString(),
          })
          .eq("user_id", sub.user_id);

        if (updateError) {
          console.error(`Error updating credits for user ${sub.user_id}:`, updateError);
          results.errors.push(`User ${sub.user_id}: ${updateError.message}`);
          continue;
        }

        // Log rollover transaction if any
        if (rollover > 0) {
          await supabase.from("rewrite_transactions").insert({
            user_id: sub.user_id,
            transaction_type: "rollover",
            credits_amount: rollover,
            balance_after: totalNewCredits,
            metadata: { from_previous_period: true },
          });
        }

        // Log reset transaction
        await supabase.from("rewrite_transactions").insert({
          user_id: sub.user_id,
          transaction_type: "reset",
          credits_amount: newCredits,
          balance_after: totalNewCredits,
          metadata: { tier: sub.tier_name },
        });

        // Update subscription period
        const newPeriodEnd = new Date();
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
        
        await supabase
          .from("user_subscriptions")
          .update({
            current_period_start: new Date().toISOString(),
            current_period_end: newPeriodEnd.toISOString(),
          })
          .eq("user_id", sub.user_id);

        results.processed++;
      } catch (userError) {
        console.error(`Error processing user ${sub.user_id}:`, userError);
        results.errors.push(`User ${sub.user_id}: ${String(userError)}`);
      }
    }

    console.log("Monthly credit reset completed:", results);

    return new Response(JSON.stringify({ success: true, ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Monthly credit reset error:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
