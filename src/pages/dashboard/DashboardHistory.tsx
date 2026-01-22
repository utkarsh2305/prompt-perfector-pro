import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

type Row = {
  id: string;
  created_at: string;
  original_prompt: string;
  score: number;
  grade: string | null;
  ai_platform: string | null;
  analysis_method: string;
};

export default function DashboardHistory() {
  const { user } = useAuth();
  const userId = user?.id;

  const [q, setQ] = useState("");
  const pageSize = 25;
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ["history", userId, q, page],
    enabled: Boolean(userId),
    queryFn: async (): Promise<{ rows: Row[]; total: number }> => {
      let base = supabase
        .from("prompt_analysis_log")
        .select("id,created_at,original_prompt,score,grade,ai_platform,analysis_method", { count: "exact" })
        .eq("user_id", userId as string)
        .order("created_at", { ascending: false });

      if (q.trim()) {
        base = base.ilike("original_prompt", `%${q.trim()}%`);
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await base.range(from, to);
      if (error) throw error;
      return { rows: (data ?? []) as unknown as Row[], total: count ?? 0 };
    },
  });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">History</h1>
          <p className="mt-2 text-sm text-muted-foreground">Browse all your past analyses.</p>
        </div>

        <DashboardNav className="mt-6" />

        <Card className="pp-surface mt-6 rounded-xl border p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              className="h-11"
              placeholder="Search prompt text…"
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="xl" type="button" onClick={() => query.refetch()}>
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-5">
            {query.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : query.isError ? (
              <Alert className="border-border bg-background">
                <div className="text-sm">Couldn’t load history.</div>
                <div className="mt-2">
                  <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                    Try again
                  </Button>
                </div>
              </Alert>
            ) : query.data?.rows.length ? (
              <div className="grid gap-3">
                {query.data.rows.map((r) => (
                  <NavLink key={r.id} to={`/dashboard/analysis/${r.id}`} className="block">
                    <Card className="rounded-lg border p-4 hover:bg-muted/30">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">
                            {r.original_prompt.length > 80 ? `${r.original_prompt.slice(0, 80)}…` : r.original_prompt}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {new Date(r.created_at).toLocaleString()} • {r.ai_platform ?? "other"} • {r.analysis_method}
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {r.grade ?? "—"} • {r.score}/10
                        </Badge>
                      </div>
                    </Card>
                  </NavLink>
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
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
