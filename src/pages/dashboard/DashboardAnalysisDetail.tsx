import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function DashboardAnalysisDetail() {
  const { id } = useParams();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ["analysis", id, user?.id],
    enabled: Boolean(id && user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_analysis_log")
        .select("*")
        .eq("id", id as string)
        .eq("user_id", user?.id as string)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Analysis</h1>
          <p className="mt-2 text-sm text-muted-foreground">Full details for this analysis.</p>
        </div>

        <DashboardNav className="mt-6" />

        <div className="mt-6">
          {query.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : query.isError ? (
            <Alert className="border-border bg-background">
              <div className="text-sm">Couldn’t load analysis.</div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            </Alert>
          ) : query.data ? (
            <div className="space-y-4">
              <Card className="pp-surface rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {new Date(query.data.created_at).toLocaleString()} • {query.data.ai_platform ?? "other"}
                  </div>
                  <Badge variant="secondary">{query.data.grade ?? "—"} • {query.data.score}/10</Badge>
                </div>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="pp-surface rounded-xl border p-5">
                  <div className="text-sm font-semibold">Original prompt</div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{query.data.original_prompt}</pre>
                </Card>
                <Card className="pp-surface rounded-xl border p-5">
                  <div className="text-sm font-semibold">Improved prompt</div>
                  <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{query.data.improved_prompt}</pre>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" type="button" onClick={() => navigator.clipboard.writeText(query.data.improved_prompt)}>
                      Copy improved prompt
                    </Button>
                  </div>
                </Card>
              </div>

              <Card className="pp-surface rounded-xl border p-5">
                <div className="text-sm font-semibold">Violations</div>
                <div className="mt-3 space-y-2">
                  {Array.isArray(query.data.violations) && query.data.violations.length ? (
                    query.data.violations.map((v: any) => (
                      <Card key={v.rule_id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-medium">{v.issue}</div>
                            <div className="mt-1 text-xs text-muted-foreground">{v.suggestion}</div>
                          </div>
                          <Badge variant="secondary">{v.severity} • -{v.penalty}</Badge>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">No violations stored.</div>
                  )}
                </div>
              </Card>
            </div>
          ) : (
            <Alert className="border-border bg-background">
              <div className="text-sm">Not found.</div>
            </Alert>
          )}
        </div>
      </div>
    </section>
  );
}
