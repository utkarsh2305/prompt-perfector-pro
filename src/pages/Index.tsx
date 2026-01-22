import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SpotlightHero } from "@/components/marketing/SpotlightHero";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { FeatureGrid } from "@/components/marketing/FeatureGrid";
import { PricingSection } from "@/components/marketing/PricingSection";
import { SiteFooter } from "@/components/marketing/SiteFooter";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="pp-reduce-motion">
        <SpotlightHero className="pp-hero-bg">
          <section className="container py-12 sm:py-16">
            <div className="mx-auto max-w-3xl">
              <p className="text-sm font-medium text-muted-foreground">
                AI prompt improvement for ChatGPT, Claude, Gemini, and more
              </p>
              <h1 className="pp-text-balance mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
                Get 10/10 prompts every time.
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                Prompt Perfector analyzes your prompt against 55 best practices, scores it 1–10, and rewrites it for
                maximum effectiveness.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="hero" size="xl">
                  <NavLink to="/dashboard">Analyze a prompt</NavLink>
                </Button>
                <Button asChild variant="outline" size="xl">
                  <a href="#pricing">See pricing</a>
                </Button>
              </div>

              <div id="framework" className="mt-10 rounded-xl border bg-background/60 p-4 backdrop-blur">
                <p className="text-sm text-muted-foreground">
                  Framework preview: clarity, constraints, examples, evaluation criteria, formatting, and failure modes.
                </p>
              </div>
            </div>
          </section>
        </SpotlightHero>

        <FeatureGrid />
        <PricingSection />
        <SiteFooter />
      </main>
    </div>
  );
};

export default Index;
