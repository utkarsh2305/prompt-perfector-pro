import { Card } from "@/components/ui/card";

export default function AdminSettings() {
  return (
    <section aria-label="Admin settings">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">Admin configuration (MVP placeholder).</p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-6">
        <div className="text-sm text-muted-foreground">Coming soon: admin emails, flags, audit log.</div>
      </Card>
    </section>
  );
}
