import { Sparkles, Infinity } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useUserSubscriptionInfo } from "@/hooks/use-subscription";
import { differenceInDays } from "date-fns";

export function CreditBalanceWidget() {
  const { user } = useAuth();
  const { data: subInfo, isLoading } = useUserSubscriptionInfo(user?.id);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!subInfo) {
    return null;
  }

  const isUnlimited = subInfo.is_unlimited;
  const creditsRemaining = subInfo.credits_remaining ?? 0;
  const totalCredits = subInfo.credit_package_credits ?? 10;
  const rollover = subInfo.rollover_credits ?? 0;
  const daysUntilReset = subInfo.period_end 
    ? differenceInDays(new Date(subInfo.period_end), new Date()) 
    : 0;
  
  const usagePercent = isUnlimited ? 100 : Math.round((creditsRemaining / totalCredits) * 100);
  const isLow = !isUnlimited && creditsRemaining <= 3;

  if (isUnlimited) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
        <Infinity className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">Unlimited rewrites</span>
        <Badge variant="secondary" className="ml-1">∞</Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-sm font-medium">
          {creditsRemaining} / {totalCredits} rewrites remaining
        </span>
        {isLow && (
          <NavLink 
            to="/dashboard/settings" 
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            Upgrade
          </NavLink>
        )}
      </div>
      <Progress value={usagePercent} className="h-2" />
      <p className="text-xs text-muted-foreground">
        Resets in {daysUntilReset} days
        {rollover > 0 && ` • ${rollover} rollover from last month`}
      </p>
    </div>
  );
}
