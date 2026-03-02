import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";
import { Card } from "@/components/ui/card";
import type { CSSProperties } from "react";

export default function ZeroDistractPage() {
  const ext = getExtension("zero-distract")!;

  return (
    <ExtensionPage extension={ext}>
      {/* How It Works */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="text-center mb-12" data-zr-reveal>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Zero Distract doesn't just block sites — it helps you understand your habits
              and make intentional choices about your attention.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { icon: "🎯", title: "Activate Focus Mode", desc: "One click to enter focus mode. Distracting sites get smart nudges instead of hard blocks." },
              { icon: "⏱️", title: "Track Your Time", desc: "See exactly how much time you spend on each site with automatic hourly tracking." },
              { icon: "💬", title: "Get Smart Nudges", desc: "Contextual nudges that adapt to your patterns — faster during your peak distraction hours." },
              { icon: "📊", title: "Review Analytics", desc: "7-day dashboard with focus scores, site breakdowns, and weekly trend insights." },
              { icon: "🔄", title: "Replace Feeds", desc: "Swap infinite scroll feeds on YouTube, Reddit, and Twitter/X with your priority checklist." },
              { icon: "🔒", title: "Privacy-First", desc: "All data stays in your browser. No accounts, no cloud sync, no tracking." },
            ].map((item, i) => (
              <Card
                key={i}
                className="zr-panel p-6 text-center"
                style={{ "--zr-delay": `${i * 50}ms` } as CSSProperties}
                data-zr-reveal
                data-zr-tilt
              >
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-heading text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Permissions Explained */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold mb-8 text-center" data-zr-reveal>
              Permissions Explained
            </h2>
            <div className="space-y-4">
              {[
                {
                  perm: "storage",
                  why: "Save your settings, time tracking data, and priority list locally in Chrome.",
                },
                {
                  perm: "alarms",
                  why: "Lightweight 5-second interval for time tracking and nudge scheduling.",
                },
                {
                  perm: "tabs",
                  why: "Detect which site you're visiting to track time — domain name only, never page content.",
                },
              ].map((p, i) => (
                <div
                  key={p.perm}
                  className="zr-panel flex gap-4 rounded-lg p-4"
                  style={{ "--zr-delay": `${i * 70}ms` } as CSSProperties}
                  data-zr-reveal
                  data-zr-tilt
                >
                  <code className="text-sm font-mono text-primary whitespace-nowrap mt-0.5">
                    {p.perm}
                  </code>
                  <p className="text-sm text-muted-foreground">{p.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </ExtensionPage>
  );
}
