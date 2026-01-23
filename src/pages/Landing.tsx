import { useCallback } from "react";
import { NavLink } from "@/components/NavLink";
import { LandingHeader } from "@/components/marketing/LandingHeader";
import { LandingFooter } from "@/components/marketing/LandingFooter";
import { SpotlightHero } from "@/components/marketing/SpotlightHero";
import { PromptComparisonMock } from "@/components/marketing/PromptComparisonMock";
import { PricingSection } from "@/components/marketing/PricingSection";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3,
  Bolt,
  Lock,
  MessageSquareText,
  Puzzle,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";

const Landing = () => {
  const track = useCallback((name: string, props?: Record<string, unknown>) => {
    // Lightweight placeholder analytics hook. Swap with PostHog/GA later.
    // eslint-disable-next-line no-console
    console.log("[track]", name, props ?? {});
  }, []);

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div id="top" className="min-h-screen">
      <LandingHeader onCtaClick={(cta) => track("cta_click", { cta })} />

      <main className="pp-reduce-motion">
        {/* HERO */}
        <SpotlightHero className="pp-hero-bg">
          <section className="container py-12 sm:py-16">
            <div className="grid items-center gap-8 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <Badge className="mb-4" variant="secondary">
                  Based on 55 research-backed principles
                </Badge>
                <h1 className="pp-text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Get 10/10 prompts every time—without the guesswork.
                </h1>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  Prompt Perfector analyzes your prompt against a structured 55-principle framework and gives you a clear score,
                  top issues, and a stronger rewrite for ChatGPT, Claude, Gemini, and more.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    asChild
                    variant="hero"
                    size="xl"
                    className="w-full sm:w-auto"
                    onClick={() => track("cta_click", { cta: "hero_start_trial" })}
                  >
                    <NavLink to="/signup">Start free trial</NavLink>
                  </Button>
                  <Button
                    variant="outline"
                    size="xl"
                    className="w-full sm:w-auto"
                    type="button"
                    onClick={() => {
                      track("cta_click", { cta: "hero_watch_demo" });
                      scrollToId("demo");
                    }}
                  >
                    Watch demo
                  </Button>
                </div>

                <p className="mt-4 text-sm text-muted-foreground">Free forever option • No credit card required • Cancel anytime</p>
              </div>

              <div className="lg:col-span-2">
                <PromptComparisonMock className="animate-enter" />
              </div>
            </div>
          </section>
        </SpotlightHero>

        {/* SOCIAL PROOF */}
        <section className="container py-10 sm:py-12" aria-label="Social proof">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="pp-surface rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Trusted by</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">2,400+ users</div>
            </Card>
            <Card className="pp-surface rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Analyses performed</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">38,000+</div>
            </Card>
            <Card className="pp-surface rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Avg. score lift</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">+3.1 points</div>
            </Card>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card className="pp-surface rounded-xl border p-5 lg:col-span-2">
              <div className="text-sm font-semibold">Used by teams at</div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex h-11 items-center justify-center rounded-lg border bg-background/60 text-xs font-medium text-muted-foreground"
                  >
                    Company
                  </div>
                ))}
              </div>
            </Card>
            <Card className="pp-surface rounded-xl border p-5">
              <div className="text-sm text-muted-foreground">Testimonial</div>
              <p className="mt-2 text-sm">
                “The fastest way I’ve found to turn vague prompts into outputs I can ship.”
              </p>
              <p className="mt-3 text-sm font-semibold">Jordan Lee</p>
              <p className="text-xs text-muted-foreground">Product Marketer</p>
            </Card>
          </div>
        </section>

        {/* PROBLEM / SOLUTION */}
        <section className="container py-12 sm:py-16" aria-label="Problem and solution">
          <div className="grid gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Stop wasting time on bad prompts.
              </h2>
              <p className="mt-3 text-muted-foreground">
                If your prompt is unclear, the model guesses. You get irrelevant responses, endless back-and-forth, and missed opportunities.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  {
                    icon: MessageSquareText,
                    title: "Vague prompts",
                    desc: "You ask for “good” and get something generic.",
                  },
                  {
                    icon: Puzzle,
                    title: "Endless clarifying",
                    desc: "You iterate 6 times just to get close.",
                  },
                  {
                    icon: Wand2,
                    title: "Hidden potential",
                    desc: "You’re not using constraints, examples, or evaluation.",
                  },
                ].map((c) => (
                  <Card key={c.title} className="pp-surface rounded-xl border p-5">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                        <c.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-base font-semibold">{c.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{c.desc}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Card className="pp-surface mt-6 rounded-xl border p-5">
                <h3 className="text-base font-semibold">The fix: a repeatable checklist + a rewrite you can use.</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prompt Perfector pinpoints what’s missing (context, constraints, examples, evaluation) and produces a stronger prompt in seconds.
                </p>
                <div className="mt-4">
                  <Button
                    asChild
                    variant="hero"
                    size="xl"
                    className="w-full sm:w-auto"
                    onClick={() => track("cta_click", { cta: "problem_get_started" })}
                  >
                    <NavLink to="/signup">Get started free</NavLink>
                  </Button>
                </div>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <PromptComparisonMock />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="container py-12 sm:py-16" aria-label="How it works">
          <div className="max-w-2xl">
            <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Perfect prompts in 3 steps</h2>
            <p className="mt-3 text-muted-foreground">No learning curve—just clearer instructions and better outputs.</p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {[
              { n: "1", title: "Write your prompt", desc: "Type it like you normally would—any AI tool, any workflow." },
              { n: "2", title: "Analyze", desc: "One click checks clarity, constraints, examples, and evaluation signals." },
              { n: "3", title: "Improve", desc: "Get a score, top issues, and a rewrite you can paste back in." },
            ].map((s) => (
              <Card key={s.n} className="pp-surface rounded-xl border p-5 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-accent text-surface-accent-foreground">
                    <span className="text-sm font-semibold">{s.n}</span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{s.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card id="demo" className="pp-surface mt-8 rounded-xl border p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold">Demo (placeholder)</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Replace this with a GIF/video once the analyzer UI is finalized.
                </p>
              </div>
              <Badge variant="secondary">Works with ChatGPT, Claude, Gemini, and more</Badge>
            </div>
            <div className="mt-4 overflow-hidden rounded-lg border bg-background/60">
              <div className="flex aspect-video items-center justify-center">
                <Button
                  variant="outline"
                  size="xl"
                  type="button"
                  className="hover-scale"
                  onClick={() => track("video_play", { location: "demo" })}
                >
                  Watch demo
                </Button>
              </div>
            </div>
          </Card>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="container py-12 sm:py-16" aria-label="Features">
          <div className="max-w-2xl">
            <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to write better prompts
            </h2>
            <p className="mt-3 text-muted-foreground">Built for fast iteration today—and deeper AI-powered improvements tomorrow.</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BarChart3,
                title: "Smart analysis",
                desc: "Checks your prompt against 55 principles so you know what’s missing.",
                badge: null,
              },
              {
                icon: Bolt,
                title: "Instant results",
                desc: "Template scoring is designed to feel immediate—no waiting around.",
                badge: null,
              },
              {
                icon: Sparkles,
                title: "AI-powered improvements",
                desc: "Deeper rewrites and reasoning when you need maximum quality.",
                badge: "Pro",
              },
              {
                icon: BarChart3,
                title: "Progress tracking",
                desc: "See how your scores trend and what changes drive better outputs.",
                badge: null,
              },
              {
                icon: ShieldCheck,
                title: "Works everywhere",
                desc: "Built to fit browser extension workflows and copy/paste routines.",
                badge: null,
              },
              {
                icon: Lock,
                title: "Privacy first",
                desc: "Your data stays in your account—protected by Supabase Auth and RLS.",
                badge: null,
              },
            ].map((f) => (
              <Card key={f.title} className="pp-surface rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
                    <f.icon className="h-5 w-5" />
                  </div>
                  {f.badge ? (
                    <span className="rounded-full bg-surface-accent px-2.5 py-1 text-xs font-medium text-surface-accent-foreground">
                      {f.badge}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <Button
              asChild
              variant="hero"
              size="xl"
              className="w-full sm:w-auto"
              onClick={() => track("cta_click", { cta: "features_get_started" })}
            >
              <NavLink to="/signup">Get started</NavLink>
            </Button>
          </div>
        </section>

        <Separator />

        {/* PRICING - Use the shared component with 3 tiers */}
        <PricingSection />

        {/* FAQ */}
        <section id="faq" className="container py-12 sm:py-16" aria-label="Frequently asked questions">
          <div className="max-w-2xl">
            <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground">Quick answers to common questions and objections.</p>
          </div>

          <div className="mt-8 max-w-3xl">
            <Accordion type="single" collapsible className="w-full">
              {[
                {
                  q: "How does it work?",
                  a: "We score your prompt against a 55-principle framework, highlight the highest-impact gaps, and generate a clearer rewritten version you can paste into your AI tool.",
                },
                {
                  q: "Which AI platforms are supported?",
                  a: "Any tool that follows instructions—ChatGPT, Claude, Gemini, Perplexity, and more. The principles are model-agnostic.",
                },
                {
                  q: "Is my data private and secure?",
                  a: "Yes. Your data lives in your account and is protected by Supabase Auth + Row Level Security, so only you can access your analyses.",
                },
                {
                  q: "Can I cancel anytime?",
                  a: "Absolutely. You can upgrade, downgrade, or cancel whenever you want. Your account stays available on the Free tier.",
                },
                {
                  q: "What’s the difference between Free and Pro?",
                  a: "Free gives you a daily limit and a smaller ruleset for quick improvements. Pro unlocks unlimited analyses, all 55 rules, and AI-powered rewrites.",
                },
                {
                  q: "Do you offer refunds?",
                  a: "If you run into an issue, reach out—we’ll make it right. For annual plans, we handle refunds case-by-case.",
                },
                {
                  q: "How is this different from just learning prompting?",
                  a: "Learning helps, but checklists prevent mistakes under time pressure. Prompt Perfector gives you a repeatable process—and a better prompt instantly.",
                },
              ].map((item) => (
                <AccordionItem key={item.q} value={item.q}>
                  <AccordionTrigger
                    onClick={() => track("faq_expand", { question: item.q })}
                    className="text-left"
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section aria-label="Final call to action" className="py-12 sm:py-16">
          <div
            className="container"
            style={{ backgroundImage: "var(--gradient-cta)" }}
          >
            <div className="rounded-2xl px-6 py-12 text-center text-primary-foreground sm:px-10">
              <h2 className="pp-text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to write better prompts?
              </h2>
              <p className="mt-3 text-primary-foreground/90">Join 2,400+ professionals getting better AI results.</p>
              <div className="mt-6">
                <Button
                  asChild
                  variant="secondary"
                  size="xl"
                  className="w-full sm:w-auto"
                  onClick={() => track("cta_click", { cta: "final_get_started" })}
                >
                  <NavLink to="/signup">Get started free</NavLink>
                </Button>
              </div>
              <p className="mt-3 text-sm text-primary-foreground/90">Free forever • No credit card • Cancel anytime</p>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
};

export default Landing;
