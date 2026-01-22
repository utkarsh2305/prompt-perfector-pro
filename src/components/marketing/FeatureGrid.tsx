import { Card } from "@/components/ui/card";
import { BarChart3, CheckCheck, Wand2 } from "lucide-react";

const items = [
  {
    icon: BarChart3,
    title: "Score 1–10",
    desc: "Get a fast, explainable prompt effectiveness score so you know exactly what to fix.",
  },
  {
    icon: Wand2,
    title: "Rewrite instantly",
    desc: "Generate cleaner, clearer, higher-signal prompts tailored to your intent and audience.",
  },
  {
    icon: CheckCheck,
    title: "55-principle framework",
    desc: "Analysis grounded in a structured checklist of best practices across clarity, constraints, and evaluation.",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-12 sm:py-16">
      <div className="container">
        <div className="max-w-2xl">
          <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Turn “okay” prompts into 10/10 prompts—consistently.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Built for ChatGPT, Claude, Gemini, and any assistant that rewards clear instructions.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <Card key={it.title} className="pp-surface rounded-lg border p-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                  <it.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">{it.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{it.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
