import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-3xl">
            <h1 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Analyze & perfect your prompt
            </h1>
            <p className="mt-3 text-muted-foreground">
              Paste a prompt below. We’ll score it 1–10 and rewrite it using the 55-principle framework.
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">Signed in as {user?.email}</p>
              <Button variant="outline" size="xl" type="button" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>

            <Card className="pp-surface mt-6 rounded-xl border p-5">
              <div className="space-y-3">
                <Label htmlFor="prompt">Your prompt</Label>
                <Textarea
                  id="prompt"
                  placeholder="Example: Write a LinkedIn post about..."
                  className="min-h-[160px]"
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button variant="hero" size="xl" type="button">
                    Analyze prompt
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Free tier: 10 analyses/day (enforced once backend is connected)
                  </p>
                </div>
              </div>
            </Card>

            <div className="mt-4">
              <Alert className="border-border bg-background">
                <div className="text-sm text-muted-foreground">
                  Coming soon: Supabase-backed analyses, rate limits (10/day for Free), and Pro-tier AI scoring + rewrite.
                </div>
              </Alert>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;
