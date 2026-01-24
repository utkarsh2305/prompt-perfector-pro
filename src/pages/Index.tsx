import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { NavLink } from "@/components/NavLink";
import { PricingSection } from "@/components/marketing/PricingSection";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="zr-reduce-motion">
        <section className="zr-hero-bg">
          <div className="container py-12 sm:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-medium text-muted-foreground">
                Works with ChatGPT, Claude & Gemini
              </p>
              <h1 className="zr-text-balance mt-3 text-4xl font-bold tracking-tight font-heading sm:text-5xl">
                Get it right the first time
              </h1>
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                ZeroRetry scores your prompts and shows you exactly what to fix—before you hit send.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  <NavLink to="/dashboard">Analyze a prompt</NavLink>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="#pricing">See pricing</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <PricingSection />
        <SiteFooter />
      </main>
    </div>
  );
};

export default Index;
