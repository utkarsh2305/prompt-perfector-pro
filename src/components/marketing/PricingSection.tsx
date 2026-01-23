import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Check, X, Target, Brain, Coins } from "lucide-react";
import { useCreditPackages } from "@/hooks/use-subscription";

/* -------------------------------------------------------------------------- */
/*                               USP Section                                  */
/* -------------------------------------------------------------------------- */

function USPSection() {
  const usps = [
    {
      icon: Target,
      title: "Score & Learn",
      description: "See exactly why your prompt scores against 55 proven principles",
    },
    {
      icon: Brain,
      title: "Personalized Coaching",
      description: "System learns your patterns and adapts teaching to your weak spots",
    },
    {
      icon: Coins,
      title: "Save on AI Costs",
      description: "Better prompts = fewer retries. Users report 40% token savings",
    },
  ];

  return (
    <div className="mb-12 text-center">
      <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        Don't just fix prompts. Master them.
      </h2>
      <p className="mt-3 text-muted-foreground">
        Prompt Perfector trains you to write prompts that work the first time
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {usps.map((usp) => (
          <div key={usp.title} className="flex flex-col items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <usp.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mt-4 text-base font-semibold">{usp.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{usp.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <div className="mb-8 flex items-center justify-center gap-3">
      <Label 
        htmlFor="billing-toggle" 
        className={!isYearly ? "font-medium" : "text-muted-foreground"}
      >
        Monthly
      </Label>
      <Switch
        id="billing-toggle"
        checked={isYearly}
        onCheckedChange={onToggle}
      />
      <Label 
        htmlFor="billing-toggle" 
        className={isYearly ? "font-medium" : "text-muted-foreground"}
      >
        Yearly
      </Label>
      {isYearly && (
        <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          2 months free
        </Badge>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Feature List                                  */
/* -------------------------------------------------------------------------- */

interface FeatureItemProps {
  text: string;
  included: boolean;
}

function FeatureItem({ text, included }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <span 
        className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md ${
          included 
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
            : "bg-muted text-muted-foreground"
        }`}
      >
        {included ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      </span>
      <span className={included ? "text-foreground" : "text-muted-foreground"}>
        {text}
      </span>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Pricing Cards                                 */
/* -------------------------------------------------------------------------- */

interface PricingCardProps {
  title: string;
  badge?: string;
  price: string;
  priceSubtext?: string;
  savingsBadge?: string;
  description: string;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaVariant?: "default" | "hero" | "outline";
  isHighlighted?: boolean;
  children?: React.ReactNode;
}

function PricingCard({
  title,
  badge,
  price,
  priceSubtext,
  savingsBadge,
  description,
  features,
  cta,
  ctaVariant = "outline",
  isHighlighted = false,
  children,
}: PricingCardProps) {
  return (
    <Card
      className={`relative flex flex-col rounded-xl border p-6 ${
        isHighlighted
          ? "border-primary/50 bg-gradient-to-b from-primary/5 to-transparent ring-1 ring-primary/20"
          : "bg-card"
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        {badge && !isHighlighted && (
          <Badge variant="secondary">{badge}</Badge>
        )}
      </div>

      <div className="mt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          {savingsBadge && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              {savingsBadge}
            </Badge>
          )}
        </div>
        {priceSubtext && (
          <p className="mt-1 text-sm text-muted-foreground">{priceSubtext}</p>
        )}
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{description}</p>

      {children}

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <FeatureItem key={feature.text} {...feature} />
        ))}
      </ul>

      <div className="mt-6">
        <Button 
          asChild 
          variant={ctaVariant} 
          size="xl" 
          className="w-full"
        >
          <NavLink to="/dashboard">{cta}</NavLink>
        </Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Main Pricing Section                             */
/* -------------------------------------------------------------------------- */

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const { data: packages = [] } = useCreditPackages();

  // Find default package or first package
  const defaultPackage = useMemo(() => {
    return packages.find((p) => p.is_default) ?? packages[0];
  }, [packages]);

  // Selected package details
  const selectedPackage = useMemo(() => {
    if (!selectedPackageId) return defaultPackage;
    return packages.find((p) => p.id === selectedPackageId) ?? defaultPackage;
  }, [packages, selectedPackageId, defaultPackage]);

  // Pro pricing calculations
  const proMonthlyPrice = selectedPackage?.monthly_price ?? 3;
  const proYearlyTotal = selectedPackage?.yearly_price ?? 30;
  const proYearlyMonthly = proYearlyTotal / 12;
  const proSavings = proMonthlyPrice * 12 - proYearlyTotal;
  const proCredits = selectedPackage?.credits_amount ?? 200;
  const proCostPerRewrite = selectedPackage?.cost_per_rewrite ?? 0.015;

  // Unlimited pricing
  const unlimitedMonthly = 19;
  const unlimitedYearlyTotal = 190;
  const unlimitedYearlyMonthly = unlimitedYearlyTotal / 12;
  const unlimitedSavings = unlimitedMonthly * 12 - unlimitedYearlyTotal;

  return (
    <section id="pricing" className="py-12 sm:py-16">
      <div className="container">
        <USPSection />

        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Free Tier */}
          <PricingCard
            title="Free"
            badge="Free forever"
            price="$0"
            priceSubtext="/month"
            description="Get started with prompt mastery"
            features={[
              { text: "Unlimited prompt analyses", included: true },
              { text: "Full 55-rule scoring", included: true },
              { text: "Detailed improvement suggestions", included: true },
              { text: "Learning pattern tracking", included: true },
              { text: "10 AI rewrites/month", included: true },
              { text: "Credit rollovers", included: false },
              { text: "Priority support", included: false },
            ]}
            cta="Get Started"
            ctaVariant="outline"
          />

          {/* Pro Tier */}
          <PricingCard
            title="Pro"
            price={isYearly ? `$${proYearlyMonthly.toFixed(2)}` : `$${proMonthlyPrice}`}
            priceSubtext={isYearly ? "/month, billed yearly" : "/month"}
            savingsBadge={isYearly ? `Save $${proSavings}` : undefined}
            description="For serious prompt engineers"
            isHighlighted
            features={[
              { text: "Everything in Free, plus:", included: true },
              { text: `${proCredits} monthly credits`, included: true },
              { text: "Up to 200 rollover credits", included: true },
              { text: "Priority support", included: true },
            ]}
            cta="Upgrade to Pro"
            ctaVariant="hero"
          >
            {/* Package Selector */}
            <div className="mt-4">
              <Select
                value={selectedPackageId ?? defaultPackage?.id ?? ""}
                onValueChange={setSelectedPackageId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select credits package" />
                </SelectTrigger>
                <SelectContent>
                  {packages.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>
                      {pkg.credits_amount} credits / month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                (${proCostPerRewrite.toFixed(4)}/rewrite)
              </p>
            </div>
          </PricingCard>

          {/* Unlimited Tier */}
          <PricingCard
            title="Unlimited"
            badge="Power Users"
            price={isYearly ? `$${unlimitedYearlyMonthly.toFixed(2)}` : `$${unlimitedMonthly}`}
            priceSubtext={isYearly ? "/month, billed yearly" : "/month"}
            savingsBadge={isYearly ? `Save $${unlimitedSavings}` : undefined}
            description="Unlimited rewrites, zero limits"
            features={[
              { text: "Everything in Free, plus:", included: true },
              { text: "Unlimited AI rewrites", included: true },
              { text: "Priority support", included: true },
              { text: "Early access to new features", included: true },
            ]}
            cta="Go Unlimited"
            ctaVariant="outline"
          />
        </div>
      </div>
    </section>
  );
}
