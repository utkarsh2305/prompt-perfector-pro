import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useCreditPackages } from "@/hooks/use-subscription";
import { useAdminChangeTier } from "@/hooks/use-admin-data";
import { Crown, Sparkles, User, Loader2 } from "lucide-react";

export interface UserDetailModalProps {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    tier: string;
    subscription_status: string;
    total_analyses_count: number;
    created_at: string;
    last_login_at: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const tierIcons = {
  free: User,
  pro: Sparkles,
  unlimited: Crown,
};

const tierColors = {
  free: "secondary",
  pro: "default",
  unlimited: "default",
} as const;

export function UserDetailModal({ user, open, onOpenChange, onSuccess }: UserDetailModalProps) {
  const { toast } = useToast();
  const { data: creditPackages, isLoading: packagesLoading } = useCreditPackages();
  const changeTierMutation = useAdminChangeTier();

  const [selectedTier, setSelectedTier] = useState<"free" | "pro" | "unlimited">("free");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [reason, setReason] = useState("");

  // Reset form when user changes
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && user) {
      setSelectedTier(user.tier as "free" | "pro" | "unlimited");
      setSelectedPackage("");
      setReason("");
    }
    onOpenChange(newOpen);
  };

  const handleChangeTier = async () => {
    if (!user) return;

    // Validate Pro tier requires package selection
    if (selectedTier === "pro" && !selectedPackage) {
      toast({
        title: "Select a credit package",
        description: "Pro tier requires a credit package selection.",
        variant: "destructive",
      });
      return;
    }

    try {
      await changeTierMutation.mutateAsync({
        userId: user.id,
        newTier: selectedTier,
        creditPackageId: selectedTier === "pro" ? selectedPackage : undefined,
        reason: reason.trim() || undefined,
      });

      toast({
        title: "Tier updated",
        description: `User has been moved to ${selectedTier} tier.`,
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to change tier",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const TierIcon = tierIcons[user.tier as keyof typeof tierIcons] || User;
  const isTierChanged = selectedTier !== user.tier;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            View and manage user account settings.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* User Info */}
          <div className="space-y-2">
            <div className="text-sm font-medium">{user.email ?? user.id}</div>
            <div className="text-sm text-muted-foreground">
              {user.full_name ?? "No name set"}
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={tierColors[user.tier as keyof typeof tierColors] || "secondary"}>
                <TierIcon className="mr-1 h-3 w-3" />
                {user.tier}
              </Badge>
              <Badge variant="outline">{user.subscription_status}</Badge>
              <Badge variant="secondary">{user.total_analyses_count} analyses</Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              Joined {new Date(user.created_at).toLocaleDateString()} • 
              Last active {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : "Never"}
            </div>
          </div>

          <Separator />

          {/* Tier Change Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Change Tier</Label>
            
            <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as "free" | "pro" | "unlimited")}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Free</span>
                    <span className="text-xs text-muted-foreground">— 10 rewrites/mo</span>
                  </div>
                </SelectItem>
                <SelectItem value="pro">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <span>Pro</span>
                    <span className="text-xs text-muted-foreground">— Choose credits</span>
                  </div>
                </SelectItem>
                <SelectItem value="unlimited">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    <span>Unlimited</span>
                    <span className="text-xs text-muted-foreground">— ∞ rewrites</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Credit Package Selection for Pro tier */}
            {selectedTier === "pro" && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Credit Package</Label>
                <Select 
                  value={selectedPackage} 
                  onValueChange={setSelectedPackage}
                  disabled={packagesLoading}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={packagesLoading ? "Loading..." : "Select credit package"} />
                  </SelectTrigger>
                  <SelectContent>
                    {creditPackages?.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{pkg.credits_amount} credits</span>
                          <span className="text-xs text-muted-foreground">
                            — ${pkg.monthly_price}/mo
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Optional Reason */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Reason (optional)</Label>
              <Textarea
                placeholder="e.g., VIP customer, comp upgrade, support request..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleChangeTier} 
            disabled={!isTierChanged || changeTierMutation.isPending || (selectedTier === "pro" && !selectedPackage)}
          >
            {changeTierMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              `Change to ${selectedTier}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
