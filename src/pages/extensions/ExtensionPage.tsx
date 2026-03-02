import { useMemo, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FloatingOrbs, Reveal } from "@/components/marketing/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExtensionInfo } from "@/data/extensions";
import { useZrPageEffects } from "@/hooks/use-zr-page-effects";

interface ExtensionPageProps {
  extension: ExtensionInfo;
  children?: ReactNode;
}

const hueBySlug: Record<string, number> = {
  "zeroretry-index": 258,
  "zero-distract": 280,
  zeropin: 300,
};

export function ExtensionPage({ extension, children }: ExtensionPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  useZrPageEffects(pageRef);

  const pageStyle = useMemo(() => {
    const hue = hueBySlug[extension.slug] ?? 258;
    const accentHue = (hue + 12) % 360;
    return {
      "--primary": `${hue} 80% 60%`,
      "--primary-glow": `${hue} 80% 60%`,
      "--accent": `${accentHue} 90% 65%`,
      "--accent-glow": `${accentHue} 90% 55%`,
      "--border": `${hue} 30% 18%`,
      "--ring": `${hue} 80% 60%`,
    } as CSSProperties;
  }, [extension.slug]);

  return (
    <div ref={pageRef} style={pageStyle} className="zr-extension-page zr-reduce-motion min-h-screen">
      <SiteHeader />
      <main className="pt-20">
        <section className="zr-section relative overflow-hidden zr-hero-bg">
          <FloatingOrbs />
          <div className="zr-content">
            <Reveal className="zr-panel mx-auto max-w-5xl px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-16" data-zr-tilt>
              {extension.icon ? (
                <img src={extension.icon} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-5xl">🧩</span>
              )}
              <h1 className="mt-6 font-heading zr-text-balance text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
                {extension.name}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
                {extension.description}
              </p>
              <div className="mt-10">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-flex">
                  <Button asChild size="lg" className="bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-elev)]">
                    <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                      Add to Chrome - it's free
                    </a>
                  </Button>
                </motion.div>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{extension.privacySummary}</p>
            </Reveal>
          </div>
        </section>

        {extension.platforms && extension.platforms.length > 0 && (
          <section className="zr-section">
            <div className="zr-content text-center">
              <Reveal>
                <h2 className="mb-8 font-heading text-2xl font-semibold">
                  {extension.slug === "zero-distract" ? "Supported Sites" : "Supported Platforms"}
                </h2>
              </Reveal>
              <div className="flex flex-wrap justify-center gap-3">
                {extension.platforms.map((platform, index) => (
                  <Reveal key={platform} delay={index * 0.06}>
                    <motion.div whileHover={{ y: -3, scale: 1.03 }}>
                      <Badge variant="secondary" className="border border-border/70 bg-card/65 px-4 py-1.5 text-sm backdrop-blur-md" data-zr-tilt>
                        {platform}
                      </Badge>
                    </motion.div>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="zr-section">
          <div className="zr-content">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">Key Features</h2>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {extension.features.map((feature, index) => (
                <Reveal key={feature} delay={index * 0.07}>
                  <motion.div whileHover={{ y: -4, scale: 1.01 }}>
                    <Card className="zr-panel p-5 text-center" data-zr-tilt>
                      <h3 className="font-heading text-sm font-semibold">{feature}</h3>
                    </Card>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {children}

        <section className="zr-section">
          <div className="zr-content text-center">
            <Reveal className="zr-panel mx-auto max-w-5xl bg-[image:var(--gradient-brand)] px-6 py-10 text-white sm:px-10 sm:py-12" data-zr-tilt>
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight text-white sm:text-5xl">Try {extension.name}</h2>
              <p className="mt-4 text-lg text-white/90">{extension.privacySummary}</p>
              <div className="mt-8">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }} className="inline-flex">
                  <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                      Add to Chrome - it's free
                    </a>
                  </Button>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
