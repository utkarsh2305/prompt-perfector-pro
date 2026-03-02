import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/motion";
import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";

const iconTiles = [
  { icon: "📋", title: "Auto-index your questions", desc: "Every question you ask appears instantly in the sidebar." },
  { icon: "🎯", title: "Jump to any moment", desc: "Click an index item to jump directly to that point in the conversation." },
  { icon: "⭐", title: "Bookmark what matters", desc: "Star important questions or moments to save them for later." },
  { icon: "🔄", title: "Build reusable context", desc: "Turn saved items into a structured handoff you can continue in any AI tool." },
  { icon: "👁️", title: "Stay out of the way", desc: "Collapse the panel into a slim icon when you do not need it." },
  { icon: "🔒", title: "Privacy-first by design", desc: "No data leaves your browser. No accounts. No cloud sync. No AI processing." },
];

export default function ZeroRetryIndexPage() {
  const ext = getExtension("zeroretry-index");
  if (!ext) return null;

  return (
    <ExtensionPage extension={ext}>
      <section className="zr-section">
        <div className="zr-content">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-2">
            <Reveal>
              <motion.div whileHover={{ y: -4, scale: 1.01 }}>
                <Card className="zr-panel overflow-hidden rounded-2xl" data-zr-tilt>
                  <div className="border-b border-border/70 bg-muted/40 px-6 py-4">
                    <p className="font-heading text-lg font-semibold">What it's NOT</p>
                  </div>
                  <div className="space-y-3 p-6">
                    {["A chatbot", "A summarizer", "A prompt generator"].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="text-muted-foreground">✕</span>
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </Reveal>

            <Reveal delay={0.1}>
              <motion.div whileHover={{ y: -4, scale: 1.01 }}>
                <Card className="zr-panel overflow-hidden rounded-2xl bg-primary/10" data-zr-tilt>
                  <div className="border-b border-border/70 bg-primary/20 px-6 py-4">
                    <p className="font-heading text-lg font-semibold">What it IS</p>
                  </div>
                  <div className="space-y-3 p-6">
                    {[
                      "An index for long AI chats",
                      "A lightweight memory surface",
                      "A structured handoff tool between AI engines",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-3">
                        <span className="text-primary">✓</span>
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="zr-section">
        <div className="zr-content">
          <Reveal className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">Why it's useful</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              Long AI conversations break down because important questions get buried, context is hard to reuse later, and switching AI tools means re-explaining everything.
            </p>
            <p className="mt-2 text-lg font-medium">ZeroRetry Index fixes this by giving your conversation memory and structure.</p>
          </Reveal>

          <div className="mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {iconTiles.map((item, index) => (
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
    </ExtensionPage>
  );
}
