import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/motion";
import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";

const workflowItems = [
  { icon: "🎯", title: "Activate Focus Mode", desc: "One click to enter focus mode. Distracting sites get smart nudges instead of hard blocks." },
  { icon: "⏱️", title: "Track Your Time", desc: "See exactly how much time you spend on each site with automatic hourly tracking." },
  { icon: "💬", title: "Get Smart Nudges", desc: "Contextual nudges that adapt to your patterns, faster during your peak distraction hours." },
  { icon: "📊", title: "Review Analytics", desc: "7-day dashboard with focus scores, site breakdowns, and weekly trend insights." },
  { icon: "🔄", title: "Replace Feeds", desc: "Swap infinite scroll feeds on YouTube, Reddit, and Twitter/X with your priority checklist." },
  { icon: "🔒", title: "Privacy-First", desc: "All data stays in your browser. No accounts, no cloud sync, no tracking." },
];

const permissions = [
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
    why: "Detect which site you're visiting to track time, domain name only, never page content.",
  },
];

export default function ZeroDistractPage() {
  const ext = getExtension("zero-distract");
  if (!ext) return null;

  return (
    <ExtensionPage extension={ext}>
      <section className="zr-section">
        <div className="zr-content">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              Zero Distract does not just block sites, it helps you understand your habits and make intentional choices about your attention.
            </p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {workflowItems.map((item, index) => (
              <Reveal key={item.title} delay={index * 0.08}>
                <motion.div whileHover={{ y: -4, scale: 1.01 }}>
                  <Card className="zr-panel p-6 text-center" data-zr-tilt>
                    <div className="mb-3 text-4xl">{item.icon}</div>
                    <h3 className="mb-2 font-heading text-lg font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
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
            <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-4xl">Permissions Explained</h2>
          </Reveal>
          <div className="mx-auto mt-10 max-w-3xl space-y-4">
            {permissions.map((permission, index) => (
              <Reveal key={permission.perm} delay={index * 0.1}>
                <motion.div whileHover={{ y: -3, scale: 1.01 }}>
                  <div className="zr-panel flex gap-4 rounded-xl p-4" data-zr-tilt>
                    <code className="mt-0.5 whitespace-nowrap text-sm text-primary">{permission.perm}</code>
                    <p className="text-sm text-muted-foreground">{permission.why}</p>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </ExtensionPage>
  );
}
