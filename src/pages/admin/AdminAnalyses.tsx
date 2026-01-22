import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdminAnalyses } from "@/hooks/use-admin-data";

export default function AdminAnalyses() {
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState("all");
  const [method, setMethod] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const query = useAdminAnalyses({ q, platform, method, page, pageSize });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <section aria-label="Admin analyses">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analyses</h1>
        <p className="mt-2 text-sm text-muted-foreground">Browse platform analyses and spot issues.</p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="h-11"
            placeholder="Search prompt text or email…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setPlatform((p) => (p === "all" ? "chatgpt" : "all"))}>
              Platform: {platform}
            </Button>
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setMethod((m) => (m === "all" ? "template" : "all"))}>
              Method: {method}
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
              <div className="text-sm">Couldn’t load analyses.</div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            </Alert>
          ) : query.data?.rows.length ? (
            <div className="space-y-2">
              {query.data.rows.map((a) => (
                <div key={a.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">
                        {(a.original_prompt ?? "").length > 80 ? `${a.original_prompt.slice(0, 80)}…` : a.original_prompt}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()} • {a.user_email ?? a.user_id} • {a.ai_platform ?? "other"} • {a.analysis_method}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{a.grade ?? "—"} • {a.score}/10</Badge>
                      {a.llm_cost_cents ? <Badge variant="outline">{a.llm_cost_cents}¢</Badge> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">No analyses found.</div>
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
