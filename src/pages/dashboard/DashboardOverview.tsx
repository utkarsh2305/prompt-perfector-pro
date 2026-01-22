import { useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardNav } from "@/pages/dashboard/dashboard-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { BarChart3, Chrome, ExternalLink, Sparkles, Wand2 } from "lucide-react";
import {
  useCommonIssues30d,
  useRecentAnalyses,
  useTrend30d,
  useWeeklyDelta,
  type RecentAnalysis,
} from "@/hooks/use-dashboard-data";
import { analyzePrompt } from "@/lib/api";
import type { AnalysisResultError } from "@/lib/api";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

function formatRelativeTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  return `${days}d ago`;
}

function gradeColor(grade: string | null) {
  if (!grade) return "bg-surface-accent text-surface-accent-foreground";
  if (grade === "A" || grade === "B") return "bg-surface-accent text-surface-accent-foreground";
  return "bg-surface-accent text-surface-accent-foreground";
}

function isAnalysisError(res: unknown): res is AnalysisResultError {
  return Boolean(res) && typeof res === "object" && (res as { success?: unknown }).success === false;
}

export default function DashboardOverview() {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();

  const userId = user?.id;
  const tier = (profile?.tier as string | undefined) ?? "free";
  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? "";
  const lastLoginAt = profile?.last_login_at ?? null;

  const dailyLimit = tier === "free" ? 10 : null;
  const usedToday = profile?.daily_usage_count ?? 0;
  const totalAnalyses = profile?.total_analyses_count ?? 0;

  const recent = useRecentAnalyses(userId);
  const trend = useTrend30d(userId);
  const issues = useCommonIssues30d(userId);
  const weekly = useWeeklyDelta(userId);

  const [selected, setSelected] = useState<RecentAnalysis | null>(null);
  const [quickPrompt, setQuickPrompt] = useState("");
  const [quickResult, setQuickResult] = useState<Awaited<ReturnType<typeof analyzePrompt>> | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const usagePct = useMemo(() => {
    if (!dailyLimit) return 0;
    return Math.min(100, Math.round((usedToday / dailyLimit) * 100));
  }, [dailyLimit, usedToday]);

  const showLastLogin = useMemo(() => {
    if (!lastLoginAt) return false;
    const diffDays = (Date.now() - new Date(lastLoginAt).getTime()) / (24 * 60 * 60 * 1000);
    return diffDays > 1;
  }, [lastLoginAt]);

  const tierBadge = tier === "free" ? (
    <Badge variant="secondary" className="gap-2">
      <span aria-hidden>🆓</span>
      Free Plan
    </Badge>
  ) : (
    <Badge className="gap-2" variant="secondary">
      <span aria-hidden>⭐</span>
      Pro Plan
    </Badge>
  );

  return (
    <section className="container pb-safe-bottom py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back{fullName ? `, ${fullName}` : ""}!
            </h1>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              {tierBadge}
              {showLastLogin ? (
                <p className="text-sm text-muted-foreground">Last login: {new Date(lastLoginAt as string).toLocaleString()}</p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {isAdmin ? (
              <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                <NavLink to="/admin">Admin</NavLink>
              </Button>
            ) : null}
            <Button variant="outline" size="xl" type="button" className="w-full sm:w-auto" onClick={() => signOut()}>
              Sign out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <DashboardNav className="mt-6" />

        {/* Layout grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Card 1: Today's usage */}
              <Card className="pp-surface rounded-xl border p-5 lg:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Analyses Today</p>
                    <div className="mt-2 text-3xl font-semibold tracking-tight">
                      {tier === "free" ? `${usedToday} / ${dailyLimit}` : "Unlimited ∞"}
                    </div>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>
                {tier === "free" ? (
                  <div className="mt-4 space-y-2">
                    <Progress value={usagePct} />
                    <p className="text-xs text-muted-foreground">Resets at midnight (your local time)</p>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">No daily limits on Pro.</p>
                )}
              </Card>

              {/* Card 2: Total analyses */}
              <Card className="pp-surface rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">All Time</p>
                <div className="mt-2 text-3xl font-semibold tracking-tight">{totalAnalyses}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {weekly.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : weekly.isError ? (
                    "—"
                  ) : (
                    `${weekly.data?.delta && weekly.data.delta > 0 ? "+" : ""}${weekly.data?.delta ?? 0} this week`
                  )}
                </div>
              </Card>

              {/* Card 3: Average score (30d) */}
              <Card className="pp-surface rounded-xl border p-5">
                <p className="text-sm text-muted-foreground">Avg. Quality Score</p>
                <div className="mt-2 flex items-end gap-2">
                  {trend.isLoading ? (
                    <Skeleton className="h-9 w-16" />
                  ) : (
                    <div className="text-3xl font-semibold tracking-tight">
                      {trend.data && trend.data.length > 0
                        ? (
                            trend.data.reduce((sum, p) => sum + p.avgScore * p.count, 0) /
                            trend.data.reduce((sum, p) => sum + p.count, 0)
                          ).toFixed(1)
                        : "—"}
                    </div>
                  )}
                  <Badge className={gradeColor(null)}>30d</Badge>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Based on your last 30 days of analyses.</p>
              </Card>

              {/* Card 4: Upgrade (free only) */}
              {tier === "free" ? (
                <Card className="pp-surface rounded-xl border p-5 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">Go Pro</p>
                      <p className="mt-1 text-xs text-muted-foreground">Unlock unlimited + AI features</p>
                    </div>
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                      <Wand2 className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button asChild variant="hero" size="xl" className="w-full">
                      <NavLink to="/pricing">Upgrade now</NavLink>
                    </Button>
                  </div>
                </Card>
              ) : null}
            </div>

            {/* Recent Analyses */}
            <Card className="pp-surface rounded-xl border p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Recent Analyses</h2>
                  <p className="text-sm text-muted-foreground">Your latest 10 prompt improvements.</p>
                </div>
                <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                  <NavLink to="/dashboard/history">View all</NavLink>
                </Button>
              </div>

              <div className="mt-4">
                {recent.isLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : recent.isError ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">Couldn’t load recent analyses.</div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => recent.refetch()}>
                        Try again
                      </Button>
                    </div>
                  </Alert>
                ) : recent.data?.length ? (
                  <div className="grid gap-3">
                    {recent.data.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(a)}
                        className="text-left"
                      >
                        <Card className="rounded-lg border p-4 hover:bg-muted/30">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">
                                {a.original_prompt.length > 60
                                  ? `${a.original_prompt.slice(0, 60)}…`
                                  : a.original_prompt}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {a.ai_platform ?? "other"} • {formatRelativeTime(a.created_at)}
                              </div>
                            </div>
                            <Badge className={gradeColor(a.grade)}>{a.grade ?? "—"} • {a.score}/10</Badge>
                          </div>
                        </Card>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="text-3xl" aria-hidden>
                      📝
                    </div>
                    <p className="mt-2 text-sm font-medium">No analyses yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Analyze your first prompt to see it here.</p>
                    <div className="mt-4">
                      <Button
                        variant="hero"
                        size="xl"
                        className="w-full sm:w-auto"
                        type="button"
                        onClick={() => {
                          setQuickPrompt("Write a LinkedIn post about prompt engineering best practices for marketers.");
                          window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
                        }}
                      >
                        Try sample prompt
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Score Trend */}
            <Card className="pp-surface rounded-xl border p-5">
              <div>
                <h2 className="text-lg font-semibold">Score Trend</h2>
                <p className="text-sm text-muted-foreground">Average score per day (last 30 days).</p>
              </div>

              <div className="mt-4">
                {trend.isLoading ? (
                  <Skeleton className="h-56 w-full" />
                ) : trend.isError ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">Couldn’t load trend chart.</div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => trend.refetch()}>
                        Try again
                      </Button>
                    </div>
                  </Alert>
                ) : trend.data?.length ? (
                  <ChartContainer
                    className="h-56 w-full"
                    config={{
                      score: {
                        label: "Avg score",
                        color: "hsl(var(--primary))",
                      },
                    }}
                  >
                    <LineChart data={trend.data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v.slice(5)}
                        minTickGap={24}
                      />
                      <YAxis domain={[1, 10]} tickLine={false} axisLine={false} width={28} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="avgScore"
                        name="score"
                        stroke="var(--color-score)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">Not enough data yet. Analyze more prompts to see trends.</div>
                  </Alert>
                )}
              </div>
            </Card>

            {/* Common Issues */}
            <Card className="pp-surface rounded-xl border p-5">
              <div>
                <h2 className="text-lg font-semibold">Common Issues</h2>
                <p className="text-sm text-muted-foreground">Top recurring issues from your last 30 days.</p>
              </div>

              <div className="mt-4">
                {issues.isLoading ? (
                  <Skeleton className="h-52 w-full" />
                ) : issues.isError ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">Couldn’t load common issues.</div>
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => issues.refetch()}>
                        Try again
                      </Button>
                    </div>
                  </Alert>
                ) : issues.data?.length ? (
                  <ChartContainer
                    className="h-52 w-full"
                    config={{
                      count: {
                        label: "Count",
                        color: "hsl(var(--accent))",
                      },
                    }}
                  >
                    <BarChart data={issues.data} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} hide />
                      <YAxis tickLine={false} axisLine={false} width={28} />
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Bar dataKey="count" name="count" fill="var(--color-count)" radius={6} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">Great job! No common issues detected.</div>
                  </Alert>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar widgets (desktop) / moves below on mobile automatically */}
          <div className="space-y-6">
            {/* Quick test */}
            <Card className="pp-surface rounded-xl border p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Quick Test</h2>
                  <p className="text-sm text-muted-foreground">Analyze without leaving the dashboard.</p>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="quickPrompt">Enter a prompt to analyze…</Label>
                  <Textarea
                    id="quickPrompt"
                    value={quickPrompt}
                    onChange={(e) => setQuickPrompt(e.target.value)}
                    className="min-h-[140px]"
                    placeholder="Example: Write a cold email that…"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{quickPrompt.length} / 5000</span>
                    {tier === "free" ? <span>{Math.max(0, 10 - usedToday)} remaining today</span> : <span>Unlimited</span>}
                  </div>
                </div>

                <Button
                  variant="hero"
                  size="xl"
                  className="w-full"
                  type="button"
                  disabled={quickLoading || !userId}
                  onClick={async () => {
                    if (!userId) return;
                    setQuickError(null);
                    setQuickResult(null);
                    setQuickLoading(true);
                    const res = await analyzePrompt(quickPrompt, userId, "other");
                    setQuickLoading(false);
                    setQuickResult(res);
                    if (isAnalysisError(res)) setQuickError(res.message);

                    // Refresh dashboard data after a successful analysis
                    if (res.success) {
                      recent.refetch();
                      trend.refetch();
                      issues.refetch();
                      weekly.refetch();
                    }
                  }}
                >
                  {quickLoading ? "Analyzing…" : "Analyze now"}
                </Button>

                {quickError ? (
                  <Alert className="border-border bg-background">
                    <div className="text-sm">{quickError}</div>
                    {isAnalysisError(quickResult) && quickResult.code === "RATE_LIMIT_EXCEEDED" ? (
                      <div className="mt-2">
                        <Button asChild variant="outline" size="sm">
                          <NavLink to="/pricing">Upgrade</NavLink>
                        </Button>
                      </div>
                    ) : null}
                  </Alert>
                ) : null}

                {quickResult?.success ? (
                  <Card className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Score</div>
                      <Badge>{quickResult.analysis.grade} • {quickResult.analysis.score}/10</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">Top issues</div>
                      <ul className="space-y-1">
                        {quickResult.analysis.violations.slice(0, 3).map((v) => (
                          <li key={v.rule_id} className="text-sm text-muted-foreground">
                            • {v.issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        type="button"
                        onClick={() => navigate("/dashboard/history")}
                      >
                        See complete analysis
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ) : null}
              </div>
            </Card>

            {/* Tips & Resources */}
            <Card className="pp-surface rounded-xl border p-5">
              <h2 className="text-lg font-semibold">Tips & Resources</h2>
              <ul className="mt-4 space-y-3">
                {[
                  { title: "5 Principles of Great Prompts", desc: "A quick checklist to improve clarity." },
                  { title: "How to Add Context Effectively", desc: "Give the model what it needs to succeed." },
                  { title: "Examples: Before & After", desc: "See strong transformations in action." },
                  { title: "Understanding Your Score", desc: "What the numbers mean and how to improve." },
                ].map((it) => (
                  <li key={it.title}>
                    <a href="#" className="block rounded-lg border bg-background/60 p-3 hover:bg-muted/30">
                      <div className="text-sm font-medium">{it.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{it.desc}</div>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Extension status */}
            {!((window as unknown as { hasExtension?: boolean }).hasExtension) ? (
              <Card className="pp-surface rounded-xl border p-5">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-surface-accent text-surface-accent-foreground">
                    <Chrome className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">Install Extension</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Analyze directly in ChatGPT.</p>
                    <div className="mt-3">
                      <Button asChild variant="outline" size="xl" className="w-full">
                        <a href="#" target="_blank" rel="noreferrer">
                          Download extension
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Details modal */}
        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Analysis details</DialogTitle>
              <DialogDescription>Original prompt, issues found, and improved prompt.</DialogDescription>
            </DialogHeader>

            {selected ? (
              <div className="space-y-4">
                <Card className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold">Score</div>
                    <Badge>{selected.grade ?? "—"} • {selected.score}/10</Badge>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{selected.ai_platform ?? "other"} • {new Date(selected.created_at).toLocaleString()}</p>
                </Card>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Card className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Original prompt</div>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.original_prompt}</pre>
                  </Card>
                  <Card className="rounded-lg border p-4">
                    <div className="text-sm font-semibold">Improved prompt</div>
                    <pre className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{selected.improved_prompt}</pre>
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => navigator.clipboard.writeText(selected.improved_prompt)}
                      >
                        Copy improved prompt
                      </Button>
                    </div>
                  </Card>
                </div>

                <Card className="rounded-lg border p-4">
                  <div className="text-sm font-semibold">Violations</div>
                  <p className="mt-1 text-xs text-muted-foreground">Top issues prioritized by penalty.</p>
                  <div className="mt-3 space-y-2">
                    {Array.isArray(selected.violations) && selected.violations.length ? (
                      (selected.violations as Array<{ rule_id: number; issue: string; suggestion: string; severity: string; penalty: number }>).map(
                        (v) => (
                          <Card key={v.rule_id} className="rounded-lg border p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium">{v.issue}</div>
                                <div className="mt-1 text-xs text-muted-foreground">{v.suggestion}</div>
                              </div>
                              <Badge variant="secondary">{v.severity} • -{v.penalty}</Badge>
                            </div>
                          </Card>
                        ),
                      )
                    ) : (
                      <p className="text-sm text-muted-foreground">No violations stored for this analysis.</p>
                    )}
                  </div>
                </Card>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
