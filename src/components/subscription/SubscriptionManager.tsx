import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Crown, Infinity, Sparkles, Calendar, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useUserSubscription, 
  useRewriteCredits, 
  useCreditPackages,
  useUserSubscriptionInfo
} from "@/hooks/use-subscription";
import { format, differenceInDays } from "date-fns";
import { NavLink } from "@/components/NavLink";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RewriteTransaction } from "@/types/subscription";

/* -------------------------------------------------------------------------- */
/*                            Current Plan Card                               */
/* -------------------------------------------------------------------------- */

function CurrentPlanCard() {
  const { user } = useAuth();
  const { data: subInfo, isLoading } = useUserSubscriptionInfo(user?.id);

  if (isLoading) {
    return (
      <Card className="rounded-xl border p-6">
        <div className="h-32 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  if (!subInfo) {
    return (
      <Card className="rounded-xl border p-6">
        <p className="text-muted-foreground">No subscription found</p>
      </Card>
    );
  }

  const tierIcon = {
    free: Sparkles,
    pro: Crown,
    unlimited: Infinity,
  }[subInfo.tier_name as string] ?? Sparkles;

  const TierIcon = tierIcon;
  const daysUntilReset = subInfo.period_end 
    ? differenceInDays(new Date(subInfo.period_end), new Date()) 
    : 0;

  return (
    <Card className="rounded-xl border p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <TierIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold capitalize">{subInfo.tier_name} Plan</h3>
            <p className="text-sm text-muted-foreground">
              {subInfo.billing_cycle === "yearly" ? "Billed yearly" : "Billed monthly"}
            </p>
          </div>
        </div>
        <Badge variant={subInfo.tier_name === "free" ? "secondary" : "default"}>
          {subInfo.tier_name === "free" ? "Free" : "Active"}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Credits Remaining</p>
          <p className="mt-1 text-2xl font-bold">
            {subInfo.is_unlimited ? "∞" : subInfo.credits_remaining}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Used This Period</p>
          <p className="mt-1 text-2xl font-bold">{subInfo.credits_used ?? 0}</p>
        </div>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Resets In</p>
          <p className="mt-1 text-2xl font-bold">{daysUntilReset} days</p>
        </div>
      </div>

      {subInfo.rollover_credits > 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          + {subInfo.rollover_credits} rollover credits from last month
        </p>
      )}

      {subInfo.tier_name === "free" && (
        <div className="mt-6">
          <Button asChild variant="hero" size="lg">
            <NavLink to="/#pricing">Upgrade Plan</NavLink>
          </Button>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Package & Billing Settings                          */
/* -------------------------------------------------------------------------- */

function SubscriptionSettings() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id);
  const { data: packages = [] } = useCreditPackages();
  const [isYearly, setIsYearly] = useState(subscription?.billing_cycle === "yearly");
  const [selectedPackage, setSelectedPackage] = useState(subscription?.credit_package_id ?? "");

  if (!subscription || subscription.tier_name === "free") {
    return null;
  }

  const isPro = subscription.tier_name === "pro";

  return (
    <Card className="rounded-xl border p-6">
      <h3 className="text-base font-semibold">Subscription Settings</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your billing cycle and credit package
      </p>

      <div className="mt-6 space-y-6">
        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="billing-cycle">Yearly Billing</Label>
            <p className="text-sm text-muted-foreground">Save 2 months with yearly billing</p>
          </div>
          <Switch
            id="billing-cycle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
            disabled // Would connect to Stripe in production
          />
        </div>

        {/* Credit Package Selector (Pro only) */}
        {isPro && (
          <div className="space-y-2">
            <Label>Credit Package</Label>
            <Select
              value={selectedPackage}
              onValueChange={setSelectedPackage}
              disabled // Would connect to Stripe in production
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select credits package" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.credits_amount} credits / month - ${isYearly ? (pkg.yearly_price / 12).toFixed(2) : pkg.monthly_price}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Changes will take effect at the start of your next billing period
            </p>
          </div>
        )}

        {/* Next Billing Date */}
        {subscription.current_period_end && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Next billing date</p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(subscription.current_period_end), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        )}

        {/* Cancel Subscription */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="text-destructive hover:text-destructive">
              Cancel subscription
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
              <AlertDialogDescription>
                You'll continue to have access until the end of your current billing period.
                After that, you'll be moved to the Free plan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Cancel Subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Billing History                                 */
/* -------------------------------------------------------------------------- */

function BillingHistory() {
  const { user } = useAuth();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["rewrite-transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("rewrite_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as RewriteTransaction[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <Card className="rounded-xl border p-6">
        <div className="h-48 animate-pulse rounded bg-muted" />
      </Card>
    );
  }

  const transactionTypeLabels: Record<string, string> = {
    usage: "Credit Used",
    purchase: "Credits Purchased",
    rollover: "Rollover",
    reset: "Monthly Reset",
    bonus: "Bonus Credits",
  };

  return (
    <Card className="rounded-xl border p-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-base font-semibold">Credit History</h3>
      </div>

      {transactions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No transactions yet</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Credits</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="text-sm">
                    {format(new Date(tx.created_at), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {transactionTypeLabels[tx.transaction_type] ?? tx.transaction_type}
                  </TableCell>
                  <TableCell className={`text-right text-sm font-medium ${
                    tx.credits_amount > 0 ? "text-green-600" : "text-muted-foreground"
                  }`}>
                    {tx.credits_amount > 0 ? "+" : ""}{tx.credits_amount}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {tx.balance_after}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Main Subscription Manager                          */
/* -------------------------------------------------------------------------- */

export function SubscriptionManager() {
  return (
    <div className="space-y-6">
      <CurrentPlanCard />
      <SubscriptionSettings />
      <BillingHistory />
    </div>
  );
}
