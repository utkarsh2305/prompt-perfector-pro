import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AnalyticsUsers from "./analytics/AnalyticsUsers";
import AnalyticsEngagement from "./analytics/AnalyticsEngagement";
import AnalyticsQuality from "./analytics/AnalyticsQuality";
import AnalyticsRevenue from "./analytics/AnalyticsRevenue";
import AnalyticsTechnical from "./analytics/AnalyticsTechnical";

const DATE_RANGES = [
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
];

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);

  return (
    <section aria-label="Admin analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Deep dive into platform metrics and performance.
          </p>
        </div>

        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_RANGES.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="users" className="mt-6">
        <TabsList className="mb-4 flex w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <AnalyticsUsers days={days} />
        </TabsContent>
        <TabsContent value="engagement">
          <AnalyticsEngagement days={days} />
        </TabsContent>
        <TabsContent value="quality">
          <AnalyticsQuality days={days} />
        </TabsContent>
        <TabsContent value="revenue">
          <AnalyticsRevenue />
        </TabsContent>
        <TabsContent value="technical">
          <AnalyticsTechnical days={days} />
        </TabsContent>
      </Tabs>
    </section>
  );
}
