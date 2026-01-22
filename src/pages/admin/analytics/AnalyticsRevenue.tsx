import { Card } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

export default function AnalyticsRevenue() {
  return (
    <Card className="flex flex-col items-center justify-center gap-4 p-12 text-center">
      <div className="rounded-full bg-muted p-4">
        <DollarSign className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="max-w-sm">
        <h3 className="text-lg font-semibold">Revenue Analytics Coming Soon</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          After Stripe integration is complete, you'll see MRR, ARR, ARPU, LTV, churn metrics and revenue trends here.
        </p>
      </div>
    </Card>
  );
}
