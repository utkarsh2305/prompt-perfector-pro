import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { PromptAnalyzer } from "@/components/prompt-analyzer";
import { CreditBalanceWidget } from "@/components/subscription/CreditBalanceWidget";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";

export default function DashboardAnalyze() {
  const { profile } = useAuth();
  const tier = profile?.tier ?? "free";

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Analyze Prompt
            </h1>
            <p className="mt-1 text-muted-foreground">
              Paste your AI prompt to get a quality score and AI-powered improvements.
            </p>
          </div>
          <CreditBalanceWidget />
        </div>

        {/* Tabs */}
        <DashboardNav className="mt-6" />

        {/* Main Content */}
        <div className="mt-6">
          <PromptAnalyzer />
        </div>

        {/* Tier info */}
        {tier === "free" && (
          <div className="mt-6 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <Badge variant="secondary">Free Plan</Badge>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  Upgrade to <span className="font-medium text-primary">Pro</span> for unlimited
                  rewrites, advanced rules, and priority processing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
