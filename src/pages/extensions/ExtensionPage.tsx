import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ExtensionInfo } from "@/data/extensions";

interface ExtensionPageProps {
  extension: ExtensionInfo;
  children?: React.ReactNode;
}

export function ExtensionPage({ extension, children }: ExtensionPageProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden zr-hero-bg">
          <div className="container py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              {extension.icon ? (
                <img src={extension.icon} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-5xl">🧩</span>
              )}
              <h1 className="mt-6 font-heading zr-text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {extension.name}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                {extension.description}
              </p>
              <div className="mt-10">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-shadow sm:w-auto"
                >
                  <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                    Add to Chrome — it's free
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {extension.privacySummary}
              </p>
            </div>
          </div>
        </section>

        {/* Supported Platforms / Sites */}
        {extension.platforms && extension.platforms.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="container text-center">
              <h2 className="font-heading text-xl font-semibold mb-6">
                {extension.slug === "zero-distract" ? "Supported Sites" : "Supported Platforms"}
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {extension.platforms.map((p) => (
                  <Badge key={p} variant="secondary" className="text-sm px-3 py-1">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Grid */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              Key Features
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
              {extension.features.map((feature) => (
                <Card key={feature} className="p-5 text-center hover:shadow-lg transition-shadow">
                  <h3 className="font-heading text-sm font-semibold">{feature}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Extension-specific content */}
        {children}

        {/* Bottom CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-primary to-accent">
          <div className="container text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Try {extension.name}
            </h2>
            <p className="mt-4 text-lg text-white/90">
              {extension.privacySummary}
            </p>
            <div className="mt-8">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                  Add to Chrome — it's free
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
