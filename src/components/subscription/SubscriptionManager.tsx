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
import { Crown, Infinity, Sparkles, Calendar, CreditCard, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { 
  useUserSubscription, 
  useCreditPackages,
  useUserSubscriptionInfo,
  useChangeTier,
  useChangeCreditPackage
} from "@/hooks/use-subscription";
import { format, differenceInDays } from "date-fns";
import { NavLink } from "@/components/NavLink";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { RewriteTransaction } from "@/types/subscription";
import { toast } from "sonner";

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
          <p className="mt-1 text-2xl font-bold">{Math.max(0, daysUntilReset)} days</p>
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
/*                         Tier Selection Cards                               */
/* -------------------------------------------------------------------------- */

function TierSelector() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id);
  const { data: packages = [] } = useCreditPackages();
  const changeTier = useChangeTier();
  
  const [isYearly, setIsYearly] = useState(subscription?.billing_cycle === "yearly");
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    subscription?.credit_package_id ?? packages.find(p => p.is_default)?.id ?? ""
  );
  const [confirmTier, setConfirmTier] = useState<"free" | "pro" | "unlimited" | null>(null);

  const currentTier = subscription?.tier_name ?? "free";
  const selectedPackage = packages.find(p => p.id === selectedPackageId) ?? packages[0];
  
  const handleTierChange = async (newTier: "free" | "pro" | "unlimited") => {
    if (!user?.id) return;
    
    try {
      const result = await changeTier.mutateAsync({
        userId: user.id,
        newTier,
        creditPackageId: newTier === "pro" ? selectedPackageId : undefined,
        billingCycle: isYearly ? "yearly" : "monthly"
      });
      
      if (result.success) {
        toast.success(`Successfully switched to ${newTier.charAt(0).toUpperCase() + newTier.slice(1)} plan!`);
        setConfirmTier(null);
      }
    } catch (error) {
      toast.error("Failed to change plan. Please try again.");
      console.error("Tier change error:", error);
    }
  };

  const tierPricing = {
    free: { monthly: 0, yearly: 0 },
    pro: { 
      monthly: selectedPackage?.monthly_price ?? 3, 
      yearly: selectedPackage?.yearly_price ?? 30 
    },
    unlimited: { monthly: 19, yearly: 190 }
  };

  const getPrice = (tier: "free" | "pro" | "unlimited") => {
    const p = tierPricing[tier];
    return isYearly ? `$${(p.yearly / 12).toFixed(0)}/mo` : `$${p.monthly}/mo`;
  };

  const getSavings = (tier: "pro" | "unlimited") => {
    const p = tierPricing[tier];
    return p.monthly * 12 - p.yearly;
  };

  return (
    <Card className="rounded-xl border p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Change Plan</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Switch between tiers (mock mode - no payment required)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="yearly-toggle" className="text-sm">Monthly</Label>
          <Switch
            id="yearly-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="yearly-toggle" className="text-sm">Yearly</Label>
          {isYearly && (
            <Badge variant="secondary" className="ml-2 bg-green-500/10 text-green-600 border-green-500/20">
              Save 2 months
            </Badge>
          )}
        </div>
      </div>

      {/* Pro Credit Package Selector */}
      <div className="mt-6 mb-4">
        <Label className="text-sm text-muted-foreground">Pro credit package:</Label>
        <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
          <SelectTrigger className="mt-1.5 w-full max-w-xs">
            <SelectValue placeholder="Select credits" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {packages.map((pkg) => (
              <SelectItem key={pkg.id} value={pkg.id}>
                {pkg.credits_amount} credits / month
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {/* Free Card */}
        <Card className={`relative p-4 transition-all ${currentTier === "free" ? "border-primary bg-primary/5" : "border-border"}`}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Free</span>
            {currentTier === "free" && <Badge variant="secondary" className="text-xs">Current</Badge>}
          </div>
          <p className="mt-2 text-2xl font-bold">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          <p className="mt-1 text-xs text-muted-foreground">10 rewrites/month</p>
          
          {currentTier !== "free" && (
            <AlertDialog open={confirmTier === "free"} onOpenChange={(open) => !open && setConfirmTier(null)}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full"
                  onClick={() => setConfirmTier("free")}
                >
                  Downgrade
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Downgrade to Free?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You'll lose access to Pro/Unlimited features. Your credits will be reset to 10/month.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => handleTierChange("free")}
                    disabled={changeTier.isPending}
                  >
                    {changeTier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </Card>

        {/* Pro Card */}
        <Card className={`relative p-4 transition-all ${currentTier === "pro" ? "border-primary bg-primary/5" : "border-border"}`}>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <span className="font-medium">Pro</span>
            {currentTier === "pro" && <Badge variant="default" className="text-xs">Current</Badge>}
          </div>
          <p className="mt-2 text-2xl font-bold">
            {getPrice("pro")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedPackage?.credits_amount ?? 200} credits/month
            {isYearly && ` · Save $${getSavings("pro")}`}
          </p>
          
          {currentTier !== "pro" && (
            <Button 
              variant={currentTier === "free" ? "hero" : "outline"}
              size="sm" 
              className="mt-4 w-full"
              onClick={() => handleTierChange("pro")}
              disabled={changeTier.isPending}
            >
              {changeTier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (currentTier === "free" ? "Upgrade" : "Switch")}
            </Button>
          )}
        </Card>

        {/* Unlimited Card */}
        <Card className={`relative p-4 transition-all ${currentTier === "unlimited" ? "border-primary bg-primary/5" : "border-border"}`}>
          <div className="flex items-center gap-2">
            <Infinity className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Unlimited</span>
            {currentTier === "unlimited" && <Badge variant="default" className="text-xs">Current</Badge>}
          </div>
          <p className="mt-2 text-2xl font-bold">
            {getPrice("unlimited")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Unlimited rewrites
            {isYearly && ` · Save $${getSavings("unlimited")}`}
          </p>
          
          {currentTier !== "unlimited" && (
            <Button 
              variant="hero"
              size="sm" 
              className="mt-4 w-full"
              onClick={() => handleTierChange("unlimited")}
              disabled={changeTier.isPending}
            >
              {changeTier.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade"}
            </Button>
          )}
        </Card>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                        Package Change for Pro Users                        */
/* -------------------------------------------------------------------------- */

function ProPackageSettings() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id);
  const { data: packages = [] } = useCreditPackages();
  const changePackage = useChangeCreditPackage();
  
  const [selectedPackage, setSelectedPackage] = useState(subscription?.credit_package_id ?? "");

  if (!subscription || subscription.tier_name !== "pro") {
    return null;
  }

  const currentPackage = packages.find(p => p.id === subscription.credit_package_id);

  const handlePackageChange = async () => {
    if (!user?.id || !selectedPackage || selectedPackage === subscription.credit_package_id) return;
    
    try {
      const result = await changePackage.mutateAsync({
        userId: user.id,
        packageId: selectedPackage
      });
      
      if (result.success) {
        toast.success("Credit package updated!");
      } else {
        toast.error(result.error ?? "Failed to update package");
      }
    } catch (error) {
      toast.error("Failed to update package. Please try again.");
      console.error("Package change error:", error);
    }
  };

  const hasChanged = selectedPackage !== subscription.credit_package_id;

  return (
    <Card className="rounded-xl border p-6">
      <h3 className="text-base font-semibold">Credit Package</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Current: {currentPackage?.credits_amount ?? 200} credits/month
      </p>

      <div className="mt-4 flex items-end gap-3">
        <div className="flex-1 max-w-xs">
          <Label className="text-sm">Change package</Label>
          <Select value={selectedPackage} onValueChange={setSelectedPackage}>
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.credits_amount} credits/month - ${subscription.billing_cycle === "yearly" 
                    ? (pkg.yearly_price / 12).toFixed(2) 
                    : pkg.monthly_price}/mo
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {hasChanged && (
          <Button 
            onClick={handlePackageChange}
            disabled={changePackage.isPending}
          >
            {changePackage.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply Change"}
          </Button>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Subscription Info                               */
/* -------------------------------------------------------------------------- */

function SubscriptionInfo() {
  const { user } = useAuth();
  const { data: subscription } = useUserSubscription(user?.id);

  if (!subscription || subscription.tier_name === "free") {
    return null;
  }

  return (
    <Card className="rounded-xl border p-6">
      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold">Billing Period</h3>
          <p className="text-sm text-muted-foreground">
            {subscription.billing_cycle === "yearly" ? "Annual billing" : "Monthly billing"}
          </p>
        </div>
      </div>

      {subscription.current_period_end && (
        <div className="mt-4 rounded-lg bg-muted/50 p-4">
          <p className="text-sm">
            <span className="text-muted-foreground">Current period ends: </span>
            <span className="font-medium">{format(new Date(subscription.current_period_end), "MMMM d, yyyy")}</span>
          </p>
          <p className="mt-1 text-sm">
            <span className="text-muted-foreground">Period started: </span>
            <span className="font-medium">{format(new Date(subscription.current_period_start), "MMMM d, yyyy")}</span>
          </p>
        </div>
      )}
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
    tier_change: "Plan Changed",
    package_change: "Package Changed",
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
      <TierSelector />
      <ProPackageSettings />
      <SubscriptionInfo />
      <BillingHistory />
    </div>
  );
}