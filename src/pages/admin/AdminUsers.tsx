import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAdminUsers } from "@/hooks/use-admin-data";

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const query = useAdminUsers({ q, tier, status, page, pageSize });

  const totalPages = useMemo(() => {
    const total = query.data?.total ?? 0;
    return Math.max(1, Math.ceil(total / pageSize));
  }, [query.data?.total]);

  return (
    <section aria-label="Admin users">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-2 text-sm text-muted-foreground">Search and review user accounts.</p>
      </div>

      <Card className="pp-surface mt-6 rounded-xl border p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            className="h-11"
            placeholder="Search by email or name…"
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="min-h-11" onClick={() => setTier((t) => (t === "all" ? "free" : "all"))}>
              Tier: {tier}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => setStatus((s) => (s === "all" ? "active" : "all"))}
            >
              Status: {status}
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
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : query.isError ? (
            <Alert className="border-border bg-background">
              <div className="text-sm">Couldn’t load users.</div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => query.refetch()}>
                  Try again
                </Button>
              </div>
            </Alert>
          ) : query.data?.rows.length ? (
            <div className="space-y-2">
              {query.data.rows.map((u) => (
                <div key={u.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-medium">{u.email ?? u.id}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {u.full_name ?? "—"} • Joined {new Date(u.created_at).toLocaleDateString()} • Last active {u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() : "—"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{u.tier}</Badge>
                      <Badge variant="outline">{u.subscription_status}</Badge>
                      <Badge variant="secondary">{u.total_analyses_count} analyses</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">No users found.</div>
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
