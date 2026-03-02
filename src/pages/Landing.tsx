import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, BrainCircuit, Eye, Focus, Layers, Lock, Repeat } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { FloatingOrbs, PulseDot, Reveal } from "@/components/marketing/motion";
import { extensions } from "@/data/extensions";
import { useZrPageEffects } from "@/hooks/use-zr-page-effects";

const problemItems = [
  {
    icon: BrainCircuit,
    title: "Cognitive Overload",
    desc: "You juggle dozens of AI conversations, browser tabs, and tools daily. Context gets lost. Insights disappear. You keep re-asking questions you've already solved.",
  },
  {
    icon: Focus,
    title: "Attention Fragmentation",
    desc: "Social platforms are engineered to hijack your focus. Infinite scroll, autoplay, and algorithmic feeds erode your ability to do deep work.",
  },
  {
    icon: Repeat,
    title: "Workflow Inefficiency",
    desc: "You copy-paste between tools, manually track what matters, and rebuild context every time you switch platforms. Small frictions compound into hours lost.",
  },
];

const differenceItems = [
  {
    icon: Lock,
    title: "Privacy-first, always",
    desc: "Every ZeroRetry product keeps your data local. No accounts, no cloud sync, no analytics, no tracking. Your browser, your data.",
  },
  {
    icon: Eye,
    title: "Invisible by design",
    desc: "Our tools work in the background. No setup wizards, no learning curves. Install and go. The best tools are the ones you barely notice.",
  },
  {
    icon: Layers,
    title: "Built to compound",
    desc: "Each product removes one specific friction. Together, they create a performance layer across your entire digital workflow.",
  },
];

const faqs = [
  {
    q: "What is ZeroRetry?",
    a: "ZeroRetry is a micro-automation company building intelligent layers that remove friction from digital work. We create privacy-first Chrome extensions. Each one solves a specific productivity problem while keeping all your data local.",
  },
  {
    q: "Are the extensions really free?",
    a: "Yes. All ZeroRetry extensions are completely free to install and use from the Chrome Web Store. No accounts, subscriptions, or hidden fees.",
  },
  {
    q: "What does ZeroRetry Index do?",
    a: "ZeroRetry Index adds a smart sidebar to AI chat tools (ChatGPT, Claude, Gemini, Grok, Perplexity, and Copilot) that automatically indexes your questions, lets you bookmark insights, and export context to continue in other AI tools.",
  },
  {
    q: "What does Zero Distract do?",
    a: "Zero Distract helps you stay focused by tracking time on distracting sites, providing smart contextual nudges, and replacing infinite scroll feeds with your priority checklist.",
  },
  {
    q: "Is my data safe?",
    a: "Absolutely. All ZeroRetry extensions store data locally in your browser using Chrome's built-in storage. Nothing is ever sent to external servers. No analytics, no tracking, no accounts.",
  },
  {
    q: "Will there be more extensions?",
    a: "Yes. We're actively building new micro-automation layers for common digital frictions. Each new extension follows the same principles: solve one problem well, keep data local, and work invisibly in the background.",
  },
];

const revealHover = { y: -4, scale: 1.01 };

export default function Landing() {
  const pageRef = useRef<HTMLDivElement>(null);
  useZrPageEffects(pageRef);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={pageRef} className="zr-page-shell zr-reduce-motion min-h-screen">
      <SiteHeader />

      <main className="pt-20">
        <section className="zr-section relative overflow-hidden zr-hero-bg">
          <FloatingOrbs />
          <div className="zr-content">
            <Reveal className="zr-panel mx-auto max-w-5xl px-6 py-12 text-center sm:px-10 sm:py-14 lg:px-16">
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/50 px-4 py-1 text-sm text-muted-foreground">
                <PulseDot />
                The Micro-Automation Company
              </p>

              <h1 className="font-heading zr-text-balance text-4xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
                Zero friction. Zero wasted effort. <span className="zr-gradient-text">Zero retry.</span>
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-lg font-light leading-relaxed text-muted-foreground sm:text-xl">
                We build intelligent micro-automation layers that remove friction from your digital work, one small, invisible improvement at a time.
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    size="lg"
                    onClick={() => scrollToSection("extensions")}
                    className="bg-[image:var(--gradient-brand)] px-8 text-primary-foreground shadow-[var(--shadow-elev)]"
                  >
                    Explore Our Extensions
                  </Button>
                </motion.div>
              </div>

              <button
                onClick={() => scrollToSection("problem")}
                className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Learn more <ArrowDown className="h-4 w-4" />
              </button>

              <p className="mt-4 text-xs text-muted-foreground">Privacy-first · 100% free · No account required</p>
            </Reveal>
          </div>
        </section>

        <section id="problem" className="zr-section">
          <div className="zr-content">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">The digital world is broken</h2>
              <p className="mt-4 text-muted-foreground">Every day, small frictions compound into hours of lost productivity.</p>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-6xl gap-8 md:grid-cols-3">
              {problemItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <motion.div whileHover={revealHover}>
                    <Card className="zr-panel p-6 text-center" data-zr-tilt>
                      <item.icon className="mx-auto h-10 w-10 text-primary" />
                      <h3 className="mt-4 font-heading text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </Card>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="zr-section">
          <div className="zr-content">
            <Reveal className="zr-panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-12" data-zr-tilt>
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">
                What if your tools worked <span className="italic">for</span> you?
              </h2>
              <p className="mt-6 text-lg font-light leading-relaxed text-muted-foreground">
                ZeroRetry builds intelligent behavioral infrastructure that removes friction from digital work. We do not replace your tools, we make them smarter.
              </p>
              <p className="mt-4 text-lg font-light leading-relaxed text-muted-foreground">
                Each ZeroRetry product adds a thin, invisible automation layer that handles repetitive overhead so you can focus on what actually matters.
              </p>
              <p className="mt-8 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                Micro-automations, not disruptions.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="extensions" className="zr-section">
          <div className="zr-content">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">What we're building</h2>
              <p className="mt-4 text-muted-foreground">Each extension tackles one specific friction and does it exceptionally well.</p>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-2">
              {extensions.map((ext, index) => (
                <Reveal key={ext.slug} delay={index * 0.08}>
                  <motion.div whileHover={revealHover}>
                    <Card className="zr-panel overflow-hidden rounded-2xl p-6" data-zr-tilt>
                      {ext.icon ? <img src={ext.icon} alt="" className="h-12 w-12 rounded-full object-cover" /> : <span className="text-4xl">🧩</span>}
                      <h3 className="mt-4 font-heading text-2xl font-semibold">{ext.name}</h3>
                      <p className="mt-2 text-muted-foreground">{ext.tagline}</p>
                      <ul className="mt-4 space-y-1">
                        {ext.features.slice(0, 4).map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-sm">
                            <span className="text-primary">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex gap-3">
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                          <Button asChild size="sm" className="bg-[image:var(--gradient-brand)] text-primary-foreground">
                            <Link to={ext.path}>Learn more</Link>
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                          <Button asChild variant="outline" size="sm" className="border-border/80 bg-card/40">
                            <a href={ext.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                              Add to Chrome
                            </a>
                          </Button>
                        </motion.div>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{ext.privacySummary}</p>
                    </Card>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="zr-section">
          <div className="zr-content">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">The ZeroRetry difference</h2>
            </Reveal>
            <div className="mx-auto mt-14 grid max-w-6xl gap-8 md:grid-cols-3">
              {differenceItems.map((item, index) => (
                <Reveal key={item.title} delay={index * 0.08}>
                  <motion.div whileHover={revealHover}>
                    <Card className="zr-panel p-6 text-center" data-zr-tilt>
                      <item.icon className="mx-auto h-10 w-10 text-primary" />
                      <h3 className="mt-4 font-heading text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
                    </Card>
                  </motion.div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="zr-section">
          <div className="zr-content">
            <Reveal className="zr-panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-12" data-zr-tilt>
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">Where we're going</h2>
              <div className="mt-8 space-y-4 text-lg font-light leading-relaxed text-muted-foreground">
                <p>
                  <span className="font-semibold text-foreground">Today:</span> Chrome extensions that protect your focus and organize your AI conversations.
                </p>
                <p>
                  <span className="font-semibold text-foreground">Tomorrow:</span> A distributed performance layer across browsers, AI tools, and SaaS platforms.
                </p>
              </div>
              <p className="mt-8 text-sm font-medium text-primary">We're just getting started.</p>
            </Reveal>
          </div>
        </section>

        <section className="zr-section">
          <div className="zr-content">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">Frequently asked questions</h2>
            </Reveal>
            <Reveal className="zr-panel mx-auto mt-12 max-w-3xl px-4 py-2 sm:px-6 sm:py-4">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={faq.q} value={`faq-${index}`}>
                    <AccordionTrigger className="text-left font-heading font-medium">{faq.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </section>

        <section className="zr-section">
          <div className="zr-content text-center">
            <Reveal className="zr-panel mx-auto max-w-6xl bg-[image:var(--gradient-brand)] px-6 py-10 text-white sm:px-10 sm:py-12" data-zr-tilt>
              <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight text-white sm:text-5xl">Ready to remove the friction?</h2>
              <p className="mt-4 text-lg text-white/90">Choose the extension that fits your workflow.</p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                {extensions.map((ext) => (
                  <motion.div key={ext.slug} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                    <Button asChild size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                      <Link to={ext.path}>{ext.name}</Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
