import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdminFramework } from "@/hooks/use-admin-data";

export default function AdminFramework() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [active, setActive] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const query = useAdminFramework({ q, tier, active, page, pageSize });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <section aria-label="Admin framework rules">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Framework Rules</h1>
        <p className="mt-2 text-sm text-muted-foreground">Manage prompt principles and tier gating.</p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="h-11"
            placeholder="Search principles…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setTier((t) => (t === "all" ? "pro" : "all"))}>
              Tier: {tier}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setActive((a) => (a === "all" ? "true" : "all"))}>
              Active: {active}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => query.refetch()}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <Alert className="border-border bg-background">
              <div className="text-sm">Couldn’t load framework rules.</div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            </Alert>
          ) : query.data?.rows.length ? (
            <div className="space-y-2">
              {query.data.rows.map((r) => (
                <div key={r.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        <span className="text-muted-foreground">S{r.section_number}:</span> {r.principle}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.section_name}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{r.severity_level}</Badge>
                      <Badge variant="outline">-{r.default_penalty}</Badge>
                      <Badge variant="secondary">{r.tier_required}</Badge>
                      <Badge variant={r.is_active ? "secondary" : "outline"}>{r.is_active ? "active" : "inactive"}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">No rules found.</div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      </Card>
    </section>
  );
}
