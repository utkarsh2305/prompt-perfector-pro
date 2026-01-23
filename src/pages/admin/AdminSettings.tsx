import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CreditCard,
  Database,
  Layers,
  Plug,
  RefreshCw,
  Settings2,
  Shield,
  Trash2,
} from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { TierEditor } from "@/components/admin/TierEditor";
import { CreditPackageEditor } from "@/components/admin/CreditPackageEditor";
import { TierFeatureEditor } from "@/components/admin/TierFeatureEditor";

export default function AdminSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset daily usage mutation
  const resetUsageMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("reset_daily_usage");
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Daily usage counts reset for all users." });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err) => {
      toast({
        title: "Failed to reset usage",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <section aria-label="Admin settings" className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform configuration and maintenance.
        </p>
      </div>

      {/* Section 1: Tier Configuration - Now with full UI */}
      <Card className="p-6">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Settings2 className="h-5 w-5 text-primary" />
          Tier Configuration
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage subscription tiers, credit packages, and feature flags.
        </p>
        <Separator className="my-4" />

        <Accordion type="multiple" defaultValue={["tiers"]} className="w-full">
          <AccordionItem value="tiers">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span>Subscription Tiers</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <TierEditor />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="packages">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>Credit Packages (Pro Tier)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <CreditPackageEditor />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="features">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
                <span>Feature Flags</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <TierFeatureEditor />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Section 2: Admin Users (placeholder) */}
      <Card className="p-6">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Shield className="h-5 w-5 text-primary" />
          Admin Users
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Admins require both an <code>admin</code> role in the database AND their email in the <code>ADMIN_EMAILS</code> secret.
        </p>
        <Separator className="my-4" />
        <p className="text-sm text-muted-foreground">
          Update the <code>ADMIN_EMAILS</code> environment variable in Supabase Edge Function settings to add/remove admins.
        </p>
      </Card>

      {/* Section 3: Integrations */}
      <Card className="p-6">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Plug className="h-5 w-5 text-primary" />
          Integrations
        </div>
        <Separator className="my-4" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <IntegrationCard name="Supabase" status="connected" />
          <IntegrationCard name="Stripe" status="not_connected" />
          <IntegrationCard name="Anthropic API" status="not_connected" />
        </div>
      </Card>

      {/* Section 4: Maintenance */}
      <Card className="p-6">
        <div className="flex items-center gap-2 text-lg font-medium">
          <Database className="h-5 w-5 text-primary" />
          Maintenance
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Database maintenance and cleanup actions.
        </p>
        <Separator className="my-4" />

        <div className="flex flex-wrap gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reset All Daily Usage
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Daily Usage Counts?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will set daily_usage_count to 0 for all users. This action is usually automatic at midnight.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => resetUsageMutation.mutate()}
                  disabled={resetUsageMutation.isPending}
                >
                  {resetUsageMutation.isPending ? "Resetting…" : "Reset"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </Card>

      {/* Section 5: Danger Zone */}
      <Card className="border-destructive/50 p-6">
        <div className="flex items-center gap-2 text-lg font-medium text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Destructive actions. Proceed with caution.
        </p>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-3">
          <Button variant="destructive" disabled className="gap-2">
            <Trash2 className="h-4 w-4" />
            Delete Test Data (coming soon)
          </Button>
        </div>
      </Card>
    </section>
  );
}

function IntegrationCard({
  name,
  status,
}: {
  name: string;
  status: "connected" | "not_connected";
}) {
  const isConnected = status === "connected";
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <span className="font-medium">{name}</span>
      <Badge variant={isConnected ? "default" : "outline"}>
        {isConnected ? "Connected" : "Not Connected"}
      </Badge>
    </div>
  );
}
