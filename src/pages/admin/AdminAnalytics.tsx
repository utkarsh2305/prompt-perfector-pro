import { Card } from "@/components/ui/card";

export default function AdminAnalytics() {
  return (
    <section aria-label="Admin analytics">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-2 text-sm text-muted-foreground">Charts and deeper stats (MVP placeholder).</p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-6">
        <div className="text-sm text-muted-foreground">Coming soon: user growth, volume, revenue trend.</div>
      </Card>
    </section>
  );
}
