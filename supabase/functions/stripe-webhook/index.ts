import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Stripe event types we handle
type RelevantEvent = 
  | "checkout.session.completed"
  | "customer.subscription.created"
  | "customer.subscription.updated"
  | "customer.subscription.deleted"
  | "invoice.paid"
  | "invoice.payment_failed";

// Map Stripe price IDs to our tier system
// You'll need to add these to Supabase secrets after creating products in Stripe
const PRICE_TO_TIER: Record<string, { tier: string; packageId?: string }> = {
  // These will be populated from Stripe dashboard price IDs
  // Example: "price_xxx": { tier: "pro", packageId: "package-uuid" }
  // Example: "price_yyy": { tier: "unlimited" }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  // Check if Stripe is configured
  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.log("Stripe not configured yet - webhook received but ignored");
    return new Response(
      JSON.stringify({ 
        received: true, 
        message: "Stripe not configured - add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to Supabase secrets" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing Stripe event: ${event.type}`);

    // Handle different event types
    switch (event.type as RelevantEvent) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, stripe, session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabase, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/**
 * Handle checkout.session.completed
 * This is triggered when a customer completes the checkout flow
 */
async function handleCheckoutCompleted(
  supabase: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.user_id;
  const customerId = session.customer as string;

  if (!userId) {
    console.error("No user_id in session metadata");
    return;
  }

  console.log(`Checkout completed for user ${userId}, customer ${customerId}`);

  // Update user profile with Stripe customer ID
  await supabase
    .from("profiles")
    .update({
      stripe_customer_id: customerId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // If this was a subscription checkout, the subscription events will handle the rest
  // If it was a one-time payment (credit pack), handle it here
  if (session.mode === "payment") {
    const creditPackageId = session.metadata?.credit_package_id;
    const creditsAmount = parseInt(session.metadata?.credits_amount ?? "0", 10);

    if (creditsAmount > 0) {
      // Add credits to user account
      const { data: currentCredits } = await supabase
        .from("rewrite_credits")
        .select("credits_remaining")
        .eq("user_id", userId)
        .maybeSingle();

      const newBalance = (currentCredits?.credits_remaining ?? 0) + creditsAmount;

      await supabase
        .from("rewrite_credits")
        .upsert({
          user_id: userId,
          credits_remaining: newBalance,
          updated_at: new Date().toISOString(),
        });

      // Log transaction
      await supabase.from("rewrite_transactions").insert({
        user_id: userId,
        transaction_type: "purchase",
        credits_amount: creditsAmount,
        balance_after: newBalance,
        metadata: {
          stripe_session_id: session.id,
          credit_package_id: creditPackageId,
        },
      });
    }
  }
}

/**
 * Handle subscription created/updated
 */
async function handleSubscriptionChange(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;

  // Find user by Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) {
    console.error(`No user found for customer ${customerId}`);
    return;
  }

  const userId = profile.id;

  // Determine tier from price ID
  const tierInfo = PRICE_TO_TIER[priceId] ?? { tier: "pro" };
  const newTier = tierInfo.tier;

  // Map Stripe status to our status
  const statusMap: Record<string, string> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    unpaid: "inactive",
    incomplete: "inactive",
    incomplete_expired: "inactive",
    paused: "inactive",
  };

  const ourStatus = statusMap[status] ?? "inactive";

  console.log(`Updating user ${userId} to tier: ${newTier}, status: ${ourStatus}`);

  // Update profile
  await supabase
    .from("profiles")
    .update({
      tier: newTier,
      subscription_status: ourStatus,
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  // Update user_subscriptions
  await supabase
    .from("user_subscriptions")
    .upsert({
      user_id: userId,
      tier_name: newTier,
      status: ourStatus,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      billing_cycle: subscription.items.data[0]?.price.recurring?.interval === "year" ? "yearly" : "monthly",
      credit_package_id: tierInfo.packageId ?? null,
      updated_at: new Date().toISOString(),
    });

  // If becoming active, allocate credits
  if (ourStatus === "active" || ourStatus === "trialing") {
    await allocateCreditsForTier(supabase, userId, newTier, tierInfo.packageId);
  }
}

/**
 * Handle subscription canceled
 */
async function handleSubscriptionCanceled(
  supabase: any,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) return;

  console.log(`Subscription canceled for user ${profile.id}`);

  // Downgrade to free
  await supabase.rpc("change_user_tier", {
    user_uuid: profile.id,
    new_tier: "free",
    new_credit_package_id: null,
    new_billing_cycle: "monthly",
  });
}

/**
 * Handle successful invoice payment (subscription renewal)
 */
async function handleInvoicePaid(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return; // One-time payment, handled elsewhere

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tier")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) return;

  console.log(`Invoice paid for user ${profile.id}, refreshing credits`);

  // Get subscription info to find package
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("credit_package_id, tier_name")
    .eq("user_id", profile.id)
    .maybeSingle();

  // Refresh credits for the billing period
  await allocateCreditsForTier(
    supabase, 
    profile.id, 
    subscription?.tier_name ?? profile.tier,
    subscription?.credit_package_id
  );
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!profile) return;

  console.log(`Payment failed for user ${profile.id}`);

  // Update status to past_due
  await supabase
    .from("profiles")
    .update({
      subscription_status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  await supabase
    .from("user_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", profile.id);
}

/**
 * Allocate credits based on tier
 */
async function allocateCreditsForTier(
  supabase: any,
  userId: string,
  tier: string,
  creditPackageId?: string | null
) {
  let creditsToAllocate = 10; // Free tier default

  if (tier === "unlimited") {
    creditsToAllocate = 999999; // Effectively unlimited
  } else if (tier === "pro" && creditPackageId) {
    // Get credits from package
    const { data: pkg } = await supabase
      .from("credit_packages")
      .select("credits_amount")
      .eq("id", creditPackageId)
      .maybeSingle();
    
    creditsToAllocate = pkg?.credits_amount ?? 200;
  } else if (tier === "pro") {
    creditsToAllocate = 200; // Default Pro credits
  }

  // Get current credits for rollover calculation
  const { data: currentCredits } = await supabase
    .from("rewrite_credits")
    .select("credits_remaining, rollover_credits")
    .eq("user_id", userId)
    .maybeSingle();

  // Calculate rollover (max 200 for pro, 0 for free)
  const maxRollover = tier === "pro" ? 200 : 0;
  const rollover = Math.min(currentCredits?.credits_remaining ?? 0, maxRollover);

  // Update credits
  await supabase
    .from("rewrite_credits")
    .upsert({
      user_id: userId,
      credits_remaining: creditsToAllocate + rollover,
      credits_used_this_period: 0,
      rollover_credits: rollover,
      last_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  // Log transaction
  await supabase.from("rewrite_transactions").insert({
    user_id: userId,
    transaction_type: "allocation",
    credits_amount: creditsToAllocate,
    balance_after: creditsToAllocate + rollover,
    metadata: {
      tier,
      credit_package_id: creditPackageId,
      rollover,
    },
  });
}
