import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Edit2, Loader2, Plus, Trash2 } from "lucide-react";
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
import type { Database, Json } from "@/integrations/supabase/types";

type AppTier = Database["public"]["Enums"]["app_tier"];

type TierFeature = {
  id: number;
  tier_name: AppTier;
  feature_slug: string;
  feature_name: string;
  feature_description: string | null;
  is_enabled: boolean;
  config: Json;
};

const TIERS: AppTier[] = ["free", "pro", "enterprise"];

export function TierFeatureEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingFeature, setEditingFeature] = useState<TierFeature | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTier, setSelectedTier] = useState<AppTier>("free");

  const { data: features, isLoading } = useQuery({
    queryKey: ["admin", "tier-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_features")
        .select("*")
        .order("tier_name", { ascending: true })
        .order("feature_slug", { ascending: true });
      if (error) throw error;
      return data as TierFeature[];
    },
    staleTime: 30_000,
  });

  const updateFeatureMutation = useMutation({
    mutationFn: async (feature: TierFeature) => {
      const { error } = await supabase
        .from("tier_features")
        .update({
          feature_slug: feature.feature_slug,
          feature_name: feature.feature_name,
          feature_description: feature.feature_description,
          is_enabled: feature.is_enabled,
          config: feature.config as Json,
          updated_at: new Date().toISOString(),
        })
        .eq("id", feature.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Feature updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "tier-features"] });
      setEditingFeature(null);
    },
    onError: (err) => {
      toast({
        title: "Failed to update feature",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const createFeatureMutation = useMutation({
    mutationFn: async (feature: Omit<TierFeature, "id">) => {
      const { error } = await supabase.from("tier_features").insert({
        tier_name: feature.tier_name,
        feature_slug: feature.feature_slug,
        feature_name: feature.feature_name,
        feature_description: feature.feature_description,
        is_enabled: feature.is_enabled,
        config: feature.config as Json,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Feature created" });
      queryClient.invalidateQueries({ queryKey: ["admin", "tier-features"] });
      setIsCreating(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to create feature",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deleteFeatureMutation = useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from("tier_features")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Feature deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "tier-features"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete feature",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, is_enabled }: { id: number; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("tier_features")
        .update({ is_enabled, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "tier-features"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to toggle feature",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading features…</p>;
  }

  const featuresByTier = TIERS.reduce((acc, tier) => {
    acc[tier] = features?.filter((f) => f.tier_name === tier) ?? [];
    return acc;
  }, {} as Record<AppTier, TierFeature[]>);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Feature flags control what each tier can access.
        </p>
        <Button size="sm" className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Feature
        </Button>
      </div>

      <Tabs defaultValue="free" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {TIERS.map((tier) => (
            <TabsTrigger key={tier} value={tier} className="capitalize">
              {tier} ({featuresByTier[tier].length})
            </TabsTrigger>
          ))}
        </TabsList>

        {TIERS.map((tier) => (
          <TabsContent key={tier} value={tier} className="mt-4">
            {featuresByTier[tier].length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No features configured for {tier} tier.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSelectedTier(tier);
                    setIsCreating(true);
                  }}
                >
                  Add Feature
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {featuresByTier[tier].map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{feature.feature_name}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {feature.feature_slug}
                        </Badge>
                      </div>
                      {feature.feature_description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {feature.feature_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={feature.is_enabled}
                        onCheckedChange={(checked) =>
                          toggleFeatureMutation.mutate({
                            id: feature.id,
                            is_enabled: checked,
                          })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setEditingFeature(feature)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Feature?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove "{feature.feature_name}" from the {tier} tier.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFeatureMutation.mutate(feature.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update this feature flag for the {editingFeature?.tier_name} tier.
            </DialogDescription>
          </DialogHeader>

          {editingFeature && (
            <FeatureForm
              feature={editingFeature}
              onSave={(updated) =>
                updateFeatureMutation.mutate(updated as TierFeature)
              }
              onCancel={() => setEditingFeature(null)}
              isSaving={updateFeatureMutation.isPending}
              disableTierChange
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Create a new feature flag for a tier.
            </DialogDescription>
          </DialogHeader>

          <FeatureForm
            feature={{
              tier_name: selectedTier,
              feature_slug: "",
              feature_name: "",
              feature_description: null,
              is_enabled: true,
              config: {},
            }}
            onSave={(newFeature) => createFeatureMutation.mutate(newFeature)}
            onCancel={() => setIsCreating(false)}
            isSaving={createFeatureMutation.isPending}
            isNew
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeatureForm({
  feature,
  onSave,
  onCancel,
  isSaving,
  isNew = false,
  disableTierChange = false,
}: {
  feature: Omit<TierFeature, "id"> | TierFeature;
  onSave: (feature: Omit<TierFeature, "id"> | TierFeature) => void;
  onCancel: () => void;
  isSaving: boolean;
  isNew?: boolean;
  disableTierChange?: boolean;
}) {
  const [formData, setFormData] = useState({
    tier_name: feature.tier_name,
    feature_slug: feature.feature_slug,
    feature_name: feature.feature_name,
    feature_description: feature.feature_description || "",
    is_enabled: feature.is_enabled,
    config: JSON.stringify(feature.config, null, 2),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let parsedConfig: Record<string, unknown> = {};
    try {
      parsedConfig = formData.config ? JSON.parse(formData.config) : {};
    } catch {
      // Keep empty config if parse fails
    }

    const result = {
      ...("id" in feature ? { id: feature.id } : {}),
      tier_name: formData.tier_name,
      feature_slug: formData.feature_slug
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_"),
      feature_name: formData.feature_name,
      feature_description: formData.feature_description || null,
      is_enabled: formData.is_enabled,
      config: parsedConfig,
    };

    if ("id" in feature) {
      onSave(result as TierFeature);
    } else {
      onSave(result as Omit<TierFeature, "id">);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tier">Tier</Label>
        <Select
          value={formData.tier_name}
          onValueChange={(value) =>
            setFormData({ ...formData, tier_name: value as AppTier })
          }
          disabled={disableTierChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIERS.map((tier) => (
              <SelectItem key={tier} value={tier} className="capitalize">
                {tier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Feature Name</Label>
          <Input
            id="name"
            value={formData.feature_name}
            onChange={(e) =>
              setFormData({ ...formData, feature_name: e.target.value })
            }
            placeholder="AI Rewrites"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={formData.feature_slug}
            onChange={(e) =>
              setFormData({ ...formData, feature_slug: e.target.value })
            }
            placeholder="ai_rewrites"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.feature_description}
          onChange={(e) =>
            setFormData({ ...formData, feature_description: e.target.value })
          }
          placeholder="What this feature enables"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="config">Config (JSON)</Label>
        <Textarea
          id="config"
          value={formData.config}
          onChange={(e) => setFormData({ ...formData, config: e.target.value })}
          placeholder="{}"
          rows={3}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Optional JSON config for feature-specific settings.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label htmlFor="is_enabled" className="text-sm font-medium">
            Enabled
          </Label>
          <p className="text-xs text-muted-foreground">
            Feature is active for this tier
          </p>
        </div>
        <Switch
          id="is_enabled"
          checked={formData.is_enabled}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_enabled: checked })
          }
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !formData.feature_name || !formData.feature_slug}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isNew ? "Create Feature" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
