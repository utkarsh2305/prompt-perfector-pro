import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit2, Loader2, Plus, Star, Trash2 } from "lucide-react";
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

type CreditPackage = {
  id: string;
  credits_amount: number;
  monthly_price: number;
  yearly_price: number;
  cost_per_rewrite: number;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
};

export function CreditPackageEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState<CreditPackage | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin", "credit-packages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as CreditPackage[];
    },
    staleTime: 30_000,
  });

  const updatePackageMutation = useMutation({
    mutationFn: async (pkg: CreditPackage) => {
      const { error } = await supabase
        .from("credit_packages")
        .update({
          credits_amount: pkg.credits_amount,
          monthly_price: pkg.monthly_price,
          yearly_price: pkg.yearly_price,
          cost_per_rewrite: pkg.cost_per_rewrite,
          is_active: pkg.is_active,
          is_default: pkg.is_default,
          sort_order: pkg.sort_order,
        })
        .eq("id", pkg.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Credit package updated" });
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] });
      setEditingPackage(null);
    },
    onError: (err) => {
      toast({
        title: "Failed to update package",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const createPackageMutation = useMutation({
    mutationFn: async (pkg: Omit<CreditPackage, "id">) => {
      const { error } = await supabase.from("credit_packages").insert(pkg);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Credit package created" });
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] });
      setIsCreating(false);
    },
    onError: (err) => {
      toast({
        title: "Failed to create package",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const deletePackageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("credit_packages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Credit package deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "credit-packages"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete package",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading packages…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Credit packages available for Pro tier users.
        </p>
        <Button size="sm" className="gap-2" onClick={() => setIsCreating(true)}>
          <Plus className="h-3.5 w-3.5" />
          Add Package
        </Button>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Monthly</TableHead>
              <TableHead>Yearly</TableHead>
              <TableHead>Cost/Rewrite</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages?.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-mono text-sm">
                  {pkg.sort_order}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {pkg.credits_amount.toLocaleString()}
                    {pkg.is_default && (
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    )}
                  </div>
                </TableCell>
                <TableCell>${pkg.monthly_price}</TableCell>
                <TableCell>${pkg.yearly_price}</TableCell>
                <TableCell>${pkg.cost_per_rewrite.toFixed(4)}</TableCell>
                <TableCell>
                  <Badge variant={pkg.is_active ? "default" : "secondary"}>
                    {pkg.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingPackage(pkg)}
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
                          <AlertDialogTitle>Delete Package?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {pkg.credits_amount} credits package.
                            Users with this package will need to select a new one.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePackageMutation.mutate(pkg.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingPackage} onOpenChange={() => setEditingPackage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Credit Package</DialogTitle>
            <DialogDescription>
              Update pricing and settings for this credit package.
            </DialogDescription>
          </DialogHeader>

          {editingPackage && (
            <PackageForm
              pkg={editingPackage}
              onSave={(updated) =>
                updatePackageMutation.mutate(updated as CreditPackage)
              }
              onCancel={() => setEditingPackage(null)}
              isSaving={updatePackageMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Credit Package</DialogTitle>
            <DialogDescription>
              Add a new credit package for Pro tier users.
            </DialogDescription>
          </DialogHeader>

          <PackageForm
            pkg={{
              credits_amount: 500,
              monthly_price: 8,
              yearly_price: 80,
              cost_per_rewrite: 0.016,
              is_active: true,
              is_default: false,
              sort_order: (packages?.length ?? 0) + 1,
            }}
            onSave={(newPkg) => createPackageMutation.mutate(newPkg)}
            onCancel={() => setIsCreating(false)}
            isSaving={createPackageMutation.isPending}
            isNew
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageForm({
  pkg,
  onSave,
  onCancel,
  isSaving,
  isNew = false,
}: {
  pkg: Omit<CreditPackage, "id"> | CreditPackage;
  onSave: (pkg: Omit<CreditPackage, "id"> | CreditPackage) => void;
  onCancel: () => void;
  isSaving: boolean;
  isNew?: boolean;
}) {
  const [formData, setFormData] = useState({
    credits_amount: pkg.credits_amount,
    monthly_price: pkg.monthly_price,
    yearly_price: pkg.yearly_price,
    cost_per_rewrite: pkg.cost_per_rewrite,
    is_active: pkg.is_active,
    is_default: pkg.is_default,
    sort_order: pkg.sort_order,
  });

  // Auto-calculate cost per rewrite when credits or price changes
  const updateCostPerRewrite = (credits: number, price: number) => {
    if (credits > 0) {
      return parseFloat((price / credits).toFixed(4));
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ("id" in pkg) {
      onSave({ ...pkg, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="credits">Credits Amount</Label>
          <Input
            id="credits"
            type="number"
            min="1"
            value={formData.credits_amount}
            onChange={(e) => {
              const credits = parseInt(e.target.value) || 0;
              setFormData({
                ...formData,
                credits_amount: credits,
                cost_per_rewrite: updateCostPerRewrite(
                  credits,
                  formData.monthly_price
                ),
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sort">Sort Order</Label>
          <Input
            id="sort"
            type="number"
            min="0"
            value={formData.sort_order}
            onChange={(e) =>
              setFormData({
                ...formData,
                sort_order: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="monthly">Monthly Price ($)</Label>
          <Input
            id="monthly"
            type="number"
            step="0.01"
            min="0"
            value={formData.monthly_price}
            onChange={(e) => {
              const price = parseFloat(e.target.value) || 0;
              setFormData({
                ...formData,
                monthly_price: price,
                cost_per_rewrite: updateCostPerRewrite(
                  formData.credits_amount,
                  price
                ),
              });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="yearly">Yearly Price ($)</Label>
          <Input
            id="yearly"
            type="number"
            step="0.01"
            min="0"
            value={formData.yearly_price}
            onChange={(e) =>
              setFormData({
                ...formData,
                yearly_price: parseFloat(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="rounded-lg border bg-muted/50 p-3">
        <p className="text-sm text-muted-foreground">
          Cost per rewrite:{" "}
          <span className="font-mono font-medium text-foreground">
            ${formData.cost_per_rewrite.toFixed(4)}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="is_active" className="text-sm font-medium">
              Package Active
            </Label>
            <p className="text-xs text-muted-foreground">
              Inactive packages are hidden
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

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="is_default" className="text-sm font-medium">
              Default Package
            </Label>
            <p className="text-xs text-muted-foreground">
              Pre-selected for new Pro users
            </p>
          </div>
          <Switch
            id="is_default"
            checked={formData.is_default}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_default: checked })
            }
          />
        </div>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isNew ? "Create Package" : "Save Changes"}
        </Button>
      </DialogFooter>
    </form>
  );
}
