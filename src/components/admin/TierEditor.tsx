import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit2, DollarSign, Zap, Infinity, Loader2 } from "lucide-react";

type SubscriptionTier = {
  id: string;
  name: string;
  description: string | null;
  base_monthly_price: number;
  base_yearly_price: number;
  base_rewrite_credits: number;
  max_rollover: number;
  is_active: boolean;
};

export function TierEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTier, setEditingTier] = useState<SubscriptionTier | null>(null);

  const { data: tiers, isLoading } = useQuery({
    queryKey: ["admin", "subscription-tiers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_tiers")
        .select("*")
        .order("base_monthly_price", { ascending: true });
      if (error) throw error;
      return data as SubscriptionTier[];
    },
    staleTime: 30_000,
  });

  const updateTierMutation = useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const { error } = await supabase
        .from("subscription_tiers")
        .update({
          description: tier.description,
          base_monthly_price: tier.base_monthly_price,
          base_yearly_price: tier.base_yearly_price,
          base_rewrite_credits: tier.base_rewrite_credits,
          max_rollover: tier.max_rollover,
          is_active: tier.is_active,
        })
        .eq("id", tier.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Tier updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["admin", "subscription-tiers"] });
      setEditingTier(null);
    },
    onError: (err) => {
      toast({
        title: "Failed to update tier",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const getTierIcon = (name: string) => {
    switch (name) {
      case "free":
        return <Zap className="h-4 w-4" />;
      case "pro":
        return <DollarSign className="h-4 w-4" />;
      case "unlimited":
        return <Infinity className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading tiers…</p>;
  }

  return (
    <div className="space-y-4">
      {tiers?.map((tier) => (
        <div
          key={tier.id}
          className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {getTierIcon(tier.name)}
              <h4 className="font-medium capitalize">{tier.name} Tier</h4>
              <Badge variant={tier.is_active ? "default" : "secondary"}>
                {tier.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {tier.description || "No description"}
            </p>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>
                {tier.base_rewrite_credits === -1
                  ? "Unlimited rewrites"
                  : `${tier.base_rewrite_credits} credits/month`}
              </span>
              <span>•</span>
              <span>
                ${tier.base_monthly_price}/mo or ${tier.base_yearly_price}/yr
              </span>
              {tier.max_rollover > 0 && (
                <>
                  <span>•</span>
                  <span>Up to {tier.max_rollover} rollover</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setEditingTier(tier)}
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      ))}

      <Dialog open={!!editingTier} onOpenChange={() => setEditingTier(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">
              Edit {editingTier?.name} Tier
            </DialogTitle>
            <DialogDescription>
              Update pricing, credits, and description for this tier.
            </DialogDescription>
          </DialogHeader>

          {editingTier && (
            <EditTierForm
              tier={editingTier}
              onSave={(updated) => updateTierMutation.mutate(updated)}
              onCancel={() => setEditingTier(null)}
              isSaving={updateTierMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditTierForm({
  tier,
  onSave,
  onCancel,
  isSaving,
}: {
  tier: SubscriptionTier;
  onSave: (tier: SubscriptionTier) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    description: tier.description || "",
    base_monthly_price: tier.base_monthly_price,
    base_yearly_price: tier.base_yearly_price,
    base_rewrite_credits: tier.base_rewrite_credits,
    max_rollover: tier.max_rollover,
    is_active: tier.is_active,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...tier, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Tier description shown to users"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly_price">Monthly Price ($)</Label>
          <Input
            id="monthly_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_monthly_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_monthly_price: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearly_price">Yearly Price ($)</Label>
          <Input
            id="yearly_price"
            type="number"
            step="0.01"
            min="0"
            value={formData.base_yearly_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_yearly_price: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credits">
            Monthly Credits
            <span className="ml-1 text-xs text-muted-foreground">(-1 = unlimited)</span>
          </Label>
          <Input
            id="credits"
            type="number"
            min="-1"
            value={formData.base_rewrite_credits}
            onChange={(e) =>
              setFormData({
                ...formData,
                base_rewrite_credits: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rollover">Max Rollover</Label>
          <Input
            id="rollover"
            type="number"
            min="0"
            value={formData.max_rollover}
            onChange={(e) =>
              setFormData({
                ...formData,
                max_rollover: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="is_active" className="text-sm font-medium">
            Tier Active
          </Label>
          <p className="text-xs text-muted-foreground">
            Inactive tiers are hidden from users
          </p>
        </div>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}
