import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CheckoutOptions {
  tier: "pro" | "unlimited";
  billingCycle: "monthly" | "yearly";
  creditPackageId?: string;
}

interface CheckoutResult {
  sessionId: string;
  url: string;
}

export function useCheckout() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const startCheckout = async (options: CheckoutOptions): Promise<CheckoutResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          tier: options.tier,
          billingCycle: options.billingCycle,
          creditPackageId: options.creditPackageId,
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/pricing?payment=canceled`,
        },
      });

      if (fnError) throw fnError;

      // Check if Stripe is not configured (demo mode)
      if (data?.demo) {
        toast({
          title: "Demo Mode",
          description: "Stripe is not configured yet. Payments will work once STRIPE_SECRET_KEY is added.",
          variant: "default",
        });
        return null;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.location.href = data.url;
        return data as CheckoutResult;
      }

      throw new Error("No checkout URL returned");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start checkout";
      setError(message);
      toast({
        title: "Checkout Error",
        description: message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openBillingPortal = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("create-billing-portal");

      if (fnError) throw fnError;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No portal URL returned");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal";
      setError(message);
      toast({
        title: "Billing Portal Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startCheckout,
    openBillingPortal,
    isLoading,
    error,
  };
}
