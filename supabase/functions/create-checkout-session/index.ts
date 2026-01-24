import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  priceId?: string;
  tier: "pro" | "unlimited";
  billingCycle: "monthly" | "yearly";
  creditPackageId?: string;
  successUrl?: string;
  cancelUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");

  // Check if Stripe is configured
  if (!STRIPE_SECRET_KEY) {
    return new Response(
      JSON.stringify({ 
        error: "Stripe not configured",
        message: "Add STRIPE_SECRET_KEY to Supabase secrets to enable payments",
        demo: true,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CheckoutRequest = await req.json();
    const { tier, billingCycle, creditPackageId, successUrl, cancelUrl } = body;

    // Validate tier
    if (!["pro", "unlimited"].includes(tier)) {
      return new Response(
        JSON.stringify({ error: "Invalid tier" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    // Get pricing based on tier and billing cycle
    // In production, these would be actual Stripe price IDs from your dashboard
    // For now, we'll use the credit_packages table to determine pricing
    let priceData: { amount: number; interval: "month" | "year" } | null = null;
    let creditsAmount = 0;

    if (tier === "unlimited") {
      priceData = billingCycle === "yearly" 
        ? { amount: 19000, interval: "year" } // $190/year
        : { amount: 1900, interval: "month" }; // $19/month
    } else if (tier === "pro") {
      // Get package pricing
      const { data: pkg } = await supabase
        .from("credit_packages")
        .select("monthly_price, yearly_price, credits_amount")
        .eq("id", creditPackageId)
        .maybeSingle();

      if (pkg) {
        creditsAmount = pkg.credits_amount;
        const price = billingCycle === "yearly" ? pkg.yearly_price : pkg.monthly_price;
        priceData = {
          amount: Math.round(Number(price) * 100), // Convert to cents
          interval: billingCycle === "yearly" ? "year" : "month",
        };
      } else {
        // Default Pro pricing
        priceData = billingCycle === "yearly"
          ? { amount: 3000, interval: "year" } // $30/year
          : { amount: 300, interval: "month" }; // $3/month
        creditsAmount = 200;
      }
    }

    if (!priceData) {
      return new Response(
        JSON.stringify({ error: "Could not determine pricing" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build success/cancel URLs
    const origin = req.headers.get("origin") ?? "https://um-ppp.lovable.app";
    const finalSuccessUrl = successUrl ?? `${origin}/dashboard?payment=success`;
    const finalCancelUrl = cancelUrl ?? `${origin}/pricing?payment=canceled`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tier === "unlimited" ? "Prompt Perfector Unlimited" : "Prompt Perfector Pro",
              description: tier === "unlimited" 
                ? "Unlimited AI rewrites, priority support, early access features"
                : `${creditsAmount} AI rewrite credits per month, up to 200 rollover`,
            },
            unit_amount: priceData.amount,
            recurring: { interval: priceData.interval },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: tier === "pro" ? 7 : undefined, // 7-day trial for Pro
        metadata: {
          user_id: user.id,
          tier,
          credit_package_id: creditPackageId ?? "",
          credits_amount: creditsAmount.toString(),
        },
      },
      metadata: {
        user_id: user.id,
        tier,
        billing_cycle: billingCycle,
        credit_package_id: creditPackageId ?? "",
        credits_amount: creditsAmount.toString(),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      allow_promotion_codes: true,
    });

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create checkout session" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
