import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Check, X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { useCreditPackages } from "@/hooks/use-subscription";
import { useCheckout } from "@/hooks/use-checkout";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                            Billing Toggle                                  */
/* -------------------------------------------------------------------------- */

function BillingToggle({
  isYearly,
  onToggle,
}: {
  isYearly: boolean;
  onToggle: (yearly: boolean) => void;
}) {
  return (
    <div className="mb-10 flex items-center justify-center">
      <div className="inline-flex items-center rounded-full border border-border bg-muted/50 p-1">
        <button
          onClick={() => onToggle(false)}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-medium transition-all",
            !isYearly 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => onToggle(true)}
          className={cn(
            "rounded-full px-5 py-2 text-sm font-medium transition-all",
            isYearly 
              ? "bg-background text-foreground shadow-sm" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Annual
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Feature Item                                  */
/* -------------------------------------------------------------------------- */

function FeatureItem({ text, included }: { text: string; included: boolean }) {
  return (
    <li className="flex items-center gap-3 py-1.5">
      {included ? (
        <Check className="h-4 w-4 flex-shrink-0 text-primary" />
      ) : (
        <X className="h-4 w-4 flex-shrink-0 text-muted-foreground/50" />
      )}
      <span className={cn(
        "text-sm",
        included ? "text-foreground" : "text-muted-foreground/60"
      )}>
        {text}
      </span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Credit Package Dropdown                          */
/* -------------------------------------------------------------------------- */

interface CreditPackageDropdownProps {
  packages: Array<{ id: string; credits_amount: number }>;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function CreditPackageDropdown({ packages, selectedId, onSelect }: CreditPackageDropdownProps) {
  const selected = packages.find(p => p.id === selectedId) ?? packages[0];
  
  return (
    <div className="mt-5">
      <Select
        value={selectedId ?? packages[0]?.id ?? ""}
        onValueChange={onSelect}
      >
        <SelectTrigger className="w-full h-11 bg-muted/50 border-border hover:bg-muted/70 transition-colors">
          <SelectValue>
            {selected?.credits_amount.toLocaleString()} credits / month
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {packages.map((pkg) => (
            <SelectItem 
              key={pkg.id} 
              value={pkg.id}
              className="cursor-pointer"
            >
              {pkg.credits_amount.toLocaleString()} credits / month
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Pricing Page                                  */
/* -------------------------------------------------------------------------- */

export default function Pricing() {
  const [searchParams] = useSearchParams();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const { data: packages = [] } = useCreditPackages();
  const { startCheckout, isLoading: isCheckoutLoading } = useCheckout();
  const { user, profile } = useAuth();

  const paymentStatus = searchParams.get("payment");

  // Find default package or first package
  const defaultPackage = useMemo(() => {
    return packages.find((p) => p.is_default) ?? packages[0];
  }, [packages]);

  // Set default package on load
  useEffect(() => {
    if (defaultPackage && !selectedPackageId) {
      setSelectedPackageId(defaultPackage.id);
    }
  }, [defaultPackage, selectedPackageId]);

  // Selected package details
  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return defaultPackage;
    return packages.find((p) => p.id === selectedPackageId) ?? defaultPackage;
  }, [packages, selectedPackageId, defaultPackage]);

  // Pro pricing calculations
  const proMonthlyPrice = selectedPackage?.monthly_price ?? 3;
  const proYearlyTotal = selectedPackage?.yearly_price ?? 30;
  const proSavings = Number(proMonthlyPrice) * 12 - Number(proYearlyTotal);
  const proCredits = selectedPackage?.credits_amount ?? 200;

  // Unlimited pricing
  const unlimitedMonthly = 19;
  const unlimitedYearlyTotal = 190;
  const unlimitedSavings = unlimitedMonthly * 12 - unlimitedYearlyTotal;

  // Current tier
  const currentTier = profile?.tier ?? "free";

  // Format price display
  const formatPrice = (monthly: number, yearly: number, isYearlyBilling: boolean) => {
    if (isYearlyBilling) {
      return `$${(yearly / 12).toFixed(yearly % 12 === 0 ? 0 : 2)}`;
    }
    return `$${monthly}`;
  };

  const formatSubtext = (monthly: number, yearly: number, savings: number, isYearlyBilling: boolean) => {
    if (isYearlyBilling) {
      return `$${yearly}/year (billed annually)`;
    }
    return `or $${yearly}/year (save $${savings})`;
  };

  // Handle checkout
  const handleCheckout = async (tier: "pro" | "unlimited") => {
    if (!user) {
      // Redirect to signup
      window.location.href = `/signup?redirect=/pricing&tier=${tier}`;
      return;
    }

    await startCheckout({
      tier,
      billingCycle: isYearly ? "yearly" : "monthly",
      creditPackageId: tier === "pro" ? selectedPackageId ?? undefined : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="py-16 sm:py-24">
        <div className="container">
          {/* Payment Status Alerts */}
          {paymentStatus === "success" && (
            <Alert className="mb-8 max-w-2xl mx-auto border-green-500/30 bg-green-50 dark:bg-green-950/20">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700 dark:text-green-400">
                Payment successful! Your subscription is now active. 
                <a href="/dashboard" className="ml-1 underline font-medium">Go to Dashboard →</a>
              </AlertDescription>
            </Alert>
          )}

          {paymentStatus === "canceled" && (
            <Alert className="mb-8 max-w-2xl mx-auto border-amber-500/30 bg-amber-50 dark:bg-amber-950/20">
              <XCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                Payment was canceled. No charges were made.
              </AlertDescription>
            </Alert>
          )}

          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Choose your plan
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Upgrade anytime. Downgrade anytime. No long-term commitments.
            </p>
          </div>

          {/* Billing Toggle */}
          <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

          {/* Pricing Cards Grid */}
          <div className="grid gap-6 md:grid-cols-3 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <Card className="relative flex flex-col rounded-2xl border p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Free</h3>
                {currentTier === "free" && (
                  <Badge variant="secondary">Current plan</Badge>
                )}
              </div>

              <div className="mt-5">
                <span className="text-4xl font-bold tracking-tight">$0</span>
                <p className="mt-1.5 text-sm text-muted-foreground">/month</p>
              </div>

              <ul className="mt-6 flex-1 space-y-0.5">
                <FeatureItem text="Unlimited prompt analyses" included />
                <FeatureItem text="Full 55-rule scoring" included />
                <FeatureItem text="Improvement suggestions" included />
                <FeatureItem text="Works on all AI platforms" included />
                <FeatureItem text="10 AI rewrites/month" included />
                <FeatureItem text="Credit rollovers" included={false} />
                <FeatureItem text="Priority support" included={false} />
              </ul>

              <div className="mt-6">
                {currentTier === "free" ? (
                  <Button variant="outline" size="lg" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button variant="outline" size="lg" className="w-full" asChild>
                    <a href="/dashboard">Go to Dashboard</a>
                  </Button>
                )}
              </div>
            </Card>

            {/* Pro Tier */}
            <Card className="relative flex flex-col rounded-2xl border border-primary/40 bg-gradient-to-b from-primary/[0.08] via-background to-background shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)] p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Pro</h3>
                {currentTier === "pro" ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : (
                  <Badge className="bg-primary text-primary-foreground">Most popular</Badge>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatPrice(Number(proMonthlyPrice), Number(proYearlyTotal), isYearly)}
                  </span>
                  {isYearly && proSavings > 0 && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Save ${proSavings}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {formatSubtext(Number(proMonthlyPrice), Number(proYearlyTotal), proSavings, isYearly)}
                </p>
              </div>

              <CreditPackageDropdown 
                packages={packages}
                selectedId={selectedPackageId ?? defaultPackage?.id ?? null}
                onSelect={setSelectedPackageId}
              />

              <ul className="mt-6 flex-1 space-y-0.5">
                <FeatureItem text="Everything in Free, plus:" included />
                <FeatureItem text={`${proCredits.toLocaleString()} monthly credits`} included />
                <FeatureItem text="Up to 200 rollover credits" included />
                <FeatureItem text="Priority support" included />
              </ul>

              <div className="mt-6 space-y-2">
                {currentTier === "pro" ? (
                  <Button size="lg" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
                    onClick={() => handleCheckout("pro")}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Start 7-day free trial"
                    )}
                  </Button>
                )}
                <p className="text-center text-xs text-muted-foreground">No credit card required</p>
              </div>
            </Card>

            {/* Unlimited Tier */}
            <Card className="relative flex flex-col rounded-2xl border p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Unlimited</h3>
                {currentTier === "enterprise" ? (
                  <Badge variant="secondary">Current plan</Badge>
                ) : (
                  <Badge variant="outline">Power users</Badge>
                )}
              </div>

              <div className="mt-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight">
                    {formatPrice(unlimitedMonthly, unlimitedYearlyTotal, isYearly)}
                  </span>
                  {isYearly && unlimitedSavings > 0 && (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                      Save ${unlimitedSavings}
                    </Badge>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {formatSubtext(unlimitedMonthly, unlimitedYearlyTotal, unlimitedSavings, isYearly)}
                </p>
              </div>

              <ul className="mt-6 flex-1 space-y-0.5">
                <FeatureItem text="Everything in Free, plus:" included />
                <FeatureItem text="Unlimited AI rewrites" included />
                <FeatureItem text="Priority support" included />
                <FeatureItem text="Early access features" included />
              </ul>

              <div className="mt-6">
                {currentTier === "enterprise" ? (
                  <Button variant="outline" size="lg" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="w-full"
                    onClick={() => handleCheckout("unlimited")}
                    disabled={isCheckoutLoading}
                  >
                    {isCheckoutLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      "Go Unlimited"
                    )}
                  </Button>
                )}
              </div>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">What happens when I run out of credits?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You can still analyze prompts for free, but AI rewrites require credits. 
                  Free users get 10/month, Pro users get their package amount, Unlimited never runs out.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Can I change plans anytime?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Yes! Upgrade or downgrade at any time. When downgrading, you keep up to 200 rollover credits.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">Is there a free trial?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pro plan includes a 7-day free trial. No credit card required to start.
                </p>
              </div>
              <div>
                <h3 className="font-semibold">What payment methods do you accept?</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  We accept all major credit cards via Stripe, including Visa, Mastercard, and American Express.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
