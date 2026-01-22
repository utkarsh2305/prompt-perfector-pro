import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";

const Landing = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="pp-reduce-motion">
        <section className="container py-10 sm:py-14">
          <div className="mx-auto max-w-2xl">
            <h1 className="pp-text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Prompt Perfector
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Coming soon: score prompts 1–10, find violations, and get an improved version.
            </p>

            <Card className="pp-surface mt-6 rounded-xl border p-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl" className="w-full sm:w-auto">
                  <NavLink to="/login">Sign in</NavLink>
                </Button>
                <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
                  <NavLink to="/signup">Create account</NavLink>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Free tier: 10 analyses/day. Pro: unlimited AI-powered improvements ($9/month).
              </p>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Landing;
