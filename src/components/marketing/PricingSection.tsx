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
import { Check, X } from "lucide-react";
import { useCreditPackages } from "@/hooks/use-subscription";
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
/*                              Feature List                                  */
/* -------------------------------------------------------------------------- */

interface FeatureItemProps {
  text: string;
  included: boolean;
}

function FeatureItem({ text, included }: FeatureItemProps) {
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
/*                              Pricing Cards                                 */
/* -------------------------------------------------------------------------- */

interface PricingCardProps {
  title: string;
  badge?: { text: string; variant: "outline" | "filled" };
  price: string;
  priceSubtext?: string;
  savingsBadge?: string;
  features: { text: string; included: boolean }[];
  cta: string;
  ctaSubtext?: string;
  ctaVariant?: "default" | "gradient" | "outline";
  isHighlighted?: boolean;
  children?: React.ReactNode;
}

function PricingCard({
  title,
  badge,
  price,
  priceSubtext,
  savingsBadge,
  features,
  cta,
  ctaSubtext,
  ctaVariant = "outline",
  isHighlighted = false,
  children,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col rounded-2xl border p-6 transition-all",
        isHighlighted
          ? "border-primary/40 bg-gradient-to-b from-primary/[0.08] via-background to-background shadow-[0_0_30px_-5px_hsl(var(--primary)/0.25)]"
          : "border-border bg-card hover:border-border/80"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        {badge && (
          <Badge 
            variant={badge.variant === "filled" ? "default" : "outline"}
            className={cn(
              "text-xs font-medium",
              badge.variant === "filled" && "bg-primary text-primary-foreground"
            )}
          >
            {badge.text}
          </Badge>
        )}
      </div>

      {/* Price */}
      <div className="mt-5">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">{price}</span>
          {savingsBadge && (
            <Badge 
              variant="secondary" 
              className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
            >
              {savingsBadge}
            </Badge>
          )}
        </div>
        {priceSubtext && (
          <p className="mt-1.5 text-sm text-muted-foreground">{priceSubtext}</p>
        )}
      </div>

      {/* Custom content (dropdown for Pro) */}
      {children}

      {/* Features */}
      <ul className="mt-6 flex-1 space-y-0.5">
        {features.map((feature, i) => (
          <FeatureItem key={i} {...feature} />
        ))}
      </ul>

      {/* CTA */}
      <div className="mt-6 space-y-2">
        {ctaVariant === "gradient" ? (
          <Button 
            asChild 
            size="lg" 
            className="w-full bg-gradient-to-r from-primary to-purple-600 text-primary-foreground hover:from-primary/90 hover:to-purple-600/90 shadow-lg"
          >
            <NavLink to="/signup">{cta}</NavLink>
          </Button>
        ) : (
          <Button 
            asChild 
            variant="outline" 
            size="lg" 
            className="w-full"
          >
            <NavLink to="/signup">{cta}</NavLink>
          </Button>
        )}
        {ctaSubtext && (
          <p className="text-center text-xs text-muted-foreground">{ctaSubtext}</p>
        )}
      </div>
    </Card>
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

  // Unlimited pricing
  const unlimitedMonthly = 19;
  const unlimitedYearlyTotal = 190;
  const unlimitedYearlyMonthly = unlimitedYearlyTotal / 12;
  const unlimitedSavings = unlimitedMonthly * 12 - unlimitedYearlyTotal;

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

  return (
    <section id="pricing" className="py-16 sm:py-24">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Choose your plan
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Billing Toggle */}
        <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />

        {/* Pricing Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3 md:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <PricingCard
            title="Free"
            badge={{ text: "Free forever", variant: "outline" }}
            price="$0"
            priceSubtext="/month"
            features={[
              { text: "Unlimited prompt analyses", included: true },
              { text: "Full 55-rule scoring", included: true },
              { text: "Improvement suggestions", included: true },
              { text: "Works on all AI platforms", included: true },
              { text: "10 AI rewrites/month", included: true },
              { text: "Credit rollovers", included: false },
              { text: "Priority support", included: false },
            ]}
            cta="Get started"
            ctaVariant="outline"
          />

          {/* Pro Tier */}
          <PricingCard
            title="Pro"
            badge={{ text: "Most popular", variant: "filled" }}
            price={`${formatPrice(proMonthlyPrice, proYearlyTotal, isYearly)}`}
            priceSubtext={formatSubtext(proMonthlyPrice, proYearlyTotal, proSavings, isYearly)}
            savingsBadge={isYearly ? `Save $${proSavings}` : undefined}
            isHighlighted
            features={[
              { text: "Everything in Free, plus:", included: true },
              { text: `${proCredits.toLocaleString()} monthly credits`, included: true },
              { text: "Up to 200 rollover credits", included: true },
              { text: "Priority support", included: true },
            ]}
            cta="Start 7-day free trial"
            ctaSubtext="No credit card required"
            ctaVariant="gradient"
          >
            <CreditPackageDropdown 
              packages={packages}
              selectedId={selectedPackageId ?? defaultPackage?.id ?? null}
              onSelect={setSelectedPackageId}
            />
          </PricingCard>

          {/* Unlimited Tier */}
          <PricingCard
            title="Unlimited"
            badge={{ text: "Power users", variant: "outline" }}
            price={`${formatPrice(unlimitedMonthly, unlimitedYearlyTotal, isYearly)}`}
            priceSubtext={formatSubtext(unlimitedMonthly, unlimitedYearlyTotal, unlimitedSavings, isYearly)}
            savingsBadge={isYearly ? `Save $${unlimitedSavings}` : undefined}
            features={[
              { text: "Everything in Free, plus:", included: true },
              { text: "Unlimited AI rewrites", included: true },
              { text: "Priority support", included: true },
              { text: "Early access features", included: true },
            ]}
            cta="Go Unlimited"
            ctaVariant="outline"
          />
        </div>

        {/* FAQ Link */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about pricing?{" "}
            <NavLink to="/#faq" className="text-primary hover:underline font-medium">
              Read the FAQ
            </NavLink>
          </p>
        </div>
      </div>
    </section>
  );
}
