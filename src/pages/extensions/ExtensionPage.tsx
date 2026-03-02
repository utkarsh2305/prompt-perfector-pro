import { useEffect, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ExtensionInfo } from "@/data/extensions";

interface ExtensionPageProps {
  extension: ExtensionInfo;
  children?: ReactNode;
}

export function ExtensionPage({ extension, children }: ExtensionPageProps) {
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = pageRef.current;
    if (!root || typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>("[data-zr-reveal]"));
    let revealObserver: IntersectionObserver | null = null;

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver?.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -48px 0px",
        },
      );
      revealElements.forEach((element) => revealObserver?.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    const onPointerMove = (event: PointerEvent) => {
      const xPercent = (event.clientX / window.innerWidth) * 100;
      const yPercent = (event.clientY / window.innerHeight) * 100;
      root.style.setProperty("--spotlight-x", `${xPercent.toFixed(2)}%`);
      root.style.setProperty("--spotlight-y", `${yPercent.toFixed(2)}%`);
    };

    if (!prefersReducedMotion && canHover) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    const tiltCleanup: Array<() => void> = [];
    if (!prefersReducedMotion && canHover) {
      const tiltElements = Array.from(root.querySelectorAll<HTMLElement>("[data-zr-tilt]"));
      tiltElements.forEach((element) => {
        const onMouseMove = (event: MouseEvent) => {
          const bounds = element.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          const rotateY = (x - 0.5) * 7;
          const rotateX = (0.5 - y) * 6;

          element.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
          element.style.setProperty("--zr-glow-x", `${Math.round(x * 100)}%`);
          element.style.setProperty("--zr-glow-y", `${Math.round(y * 100)}%`);
          element.style.setProperty("--zr-glow-opacity", "1");
        };

        const onMouseLeave = () => {
          element.style.transform = "";
          element.style.setProperty("--zr-glow-opacity", "0");
        };

        element.addEventListener("mousemove", onMouseMove);
        element.addEventListener("mouseleave", onMouseLeave);

        tiltCleanup.push(() => {
          element.removeEventListener("mousemove", onMouseMove);
          element.removeEventListener("mouseleave", onMouseLeave);
          onMouseLeave();
        });
      });
    }

    return () => {
      revealObserver?.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      tiltCleanup.forEach((cleanup) => cleanup());
    };
  }, []);

  return (
    <div ref={pageRef} className="zr-extension-page zr-reduce-motion min-h-screen">
      <SiteHeader />
      <main>
        {/* Hero */}
        <section className="relative overflow-hidden zr-hero-bg">
          <div className="container py-16 sm:py-24 lg:py-32">
            <div
              className="zr-panel mx-auto max-w-4xl px-6 py-10 text-center sm:px-10 sm:py-12 lg:px-16"
              data-zr-reveal
              data-zr-tilt
            >
              {extension.icon ? (
                <img src={extension.icon} alt="" className="mx-auto h-16 w-16 rounded-full object-cover" />
              ) : (
                <span className="text-5xl">🧩</span>
              )}
              <h1 className="mt-6 font-heading zr-text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                {extension.name}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">{extension.description}</p>
              <div className="mt-10">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
                >
                  <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                    Add to Chrome — it's free
                  </a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">{extension.privacySummary}</p>
            </div>
          </div>
        </section>

        {/* Supported Platforms / Sites */}
        {extension.platforms && extension.platforms.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="container text-center">
              <h2 className="mb-6 font-heading text-xl font-semibold" data-zr-reveal>
                {extension.slug === "zero-distract" ? "Supported Sites" : "Supported Platforms"}
              </h2>
              <div className="flex flex-wrap justify-center gap-2" data-zr-reveal>
                {extension.platforms.map((platform, index) => (
                  <Badge
                    key={platform}
                    variant="secondary"
                    className="border border-border/60 bg-card/65 px-3 py-1 text-sm backdrop-blur-md transition-colors hover:border-accent/60"
                    style={{ "--zr-delay": `${index * 35}ms` } as CSSProperties}
                    data-zr-tilt
                  >
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features Grid */}
        <section className="bg-muted/30 py-16 sm:py-24">
          <div className="container">
            <h2 className="mb-12 text-center font-heading text-3xl font-bold tracking-tight sm:text-4xl" data-zr-reveal>
              Key Features
            </h2>
            <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {extension.features.map((feature, index) => (
                <Card
                  key={feature}
                  className="zr-panel p-5 text-center"
                  style={{ "--zr-delay": `${index * 45}ms` } as CSSProperties}
                  data-zr-reveal
                  data-zr-tilt
                >
                  <h3 className="font-heading text-sm font-semibold">{feature}</h3>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Extension-specific content */}
        {children}

        {/* Bottom CTA */}
        <section className="py-16 sm:py-24">
          <div className="container text-center">
            <div
              className="zr-panel mx-auto max-w-4xl bg-gradient-to-r from-primary/95 to-accent/95 px-6 py-10 text-white sm:px-10 sm:py-12"
              data-zr-reveal
              data-zr-tilt
            >
              <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">Try {extension.name}</h2>
              <p className="mt-4 text-lg text-white/90">{extension.privacySummary}</p>
              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/90"
                >
                  <a href={extension.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                    Add to Chrome — it's free
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
