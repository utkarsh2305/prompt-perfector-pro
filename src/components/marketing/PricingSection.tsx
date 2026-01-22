import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { Check } from "lucide-react";

function PricingCard({
  title,
  price,
  badge,
  features,
  cta,
  variant,
}: {
  title: string;
  price: string;
  badge?: string;
  features: string[];
  cta: string;
  variant?: "default" | "highlight";
}) {
  const isHighlight = variant === "highlight";
  return (
    <Card
      className={
        "rounded-xl border p-6 " +
        (isHighlight
          ? "pp-surface relative overflow-hidden"
          : "bg-card")
      }
    >
      {isHighlight ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{ backgroundImage: "var(--gradient-brand)" }}
        />
      ) : null}

      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold">{title}</h3>
          {badge ? (
            <span className="rounded-full bg-surface-accent px-2.5 py-1 text-xs font-medium text-surface-accent-foreground">
              {badge}
            </span>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="text-3xl font-semibold tracking-tight">{price}</div>
          <p className="mt-1 text-sm text-muted-foreground">Billed monthly. Cancel anytime.</p>
        </div>

        <ul className="mt-5 space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-md bg-surface-accent text-surface-accent-foreground">
                <Check className="h-3.5 w-3.5" />
              </span>
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button asChild variant={isHighlight ? "hero" : "premium"} size="xl" className="w-full">
            <NavLink to="/dashboard">{cta}</NavLink>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="py-12 sm:py-16">
      <div className="container">
        <div className="max-w-2xl">
          <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Simple pricing that scales from curiosity to power use.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when prompt quality becomes mission-critical.
          </p>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <PricingCard
            title="Free"
            price="$0"
            features={["10 analyses/day", "Score + improved prompt", "Core 55-principle checks"]}
            cta="Start free"
          />

          <PricingCard
            title="Pro"
            price="$9"
            badge="Most popular"
            features={["Unlimited analyses", "Advanced rewrites", "Saved history + templates (soon)"]}
            cta="Go Pro"
            variant="highlight"
          />

          <PricingCard
            title="Enterprise"
            price="Let’s talk"
            features={["Team workspaces", "Admin controls", "SLA + custom policies"]}
            cta="Request access"
          />
        </div>
      </div>
    </section>
  );
}
