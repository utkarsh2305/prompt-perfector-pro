import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/motion";
import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";

const workflowItems = [
  {
    icon: "📌",
    title: "Save pages or snippets in one right-click",
    desc: "Right-click any selected text or page and save it instantly. No copy-paste needed, ZeroPin remembers the text and exactly where it was.",
  },
  {
    icon: "🖍️",
    title: "Snippets auto-highlight on revisit",
    desc: "Return to a saved page and your saved text is highlighted in yellow automatically, even if the page has changed slightly.",
  },
  {
    icon: "🤖",
    title: "Built for AI chats",
    desc: "Captures prompts and answers from ChatGPT, Claude, Gemini, and more. Your AI research lives alongside your web bookmarks, fully searchable.",
  },
  {
    icon: "📚",
    title: "A proper library, not a popup",
    desc: "Open your Library in a full browser tab with a two-panel layout: folder tree on the left, bookmarks on the right. Searchable, sortable, manageable.",
  },
  {
    icon: "🔍",
    title: "Search everything, offline",
    desc: "Search across titles, URLs, domains, notes, and snippet text. Filter by source, date range, or folder. Works 100% offline.",
  },
  {
    icon: "⏰",
    title: "Reminders",
    desc: "Set a reminder on any bookmark. Tomorrow, In 3 days, In 1 week, or a custom date. Due reminders surface at the top of your Library automatically.",
  },
];

export default function ZeroPinPage() {
  const ext = getExtension("zeropin");
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
                    {["A cloud bookmarking service", "A reading or annotation app", "A social bookmarking tool"].map((item) => (
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
                      "A local-first bookmark manager",
                      "A snippet highlighter that resurfaces your saved text",
                      "An AI context capture tool",
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
            <h2 className="font-heading text-3xl font-bold leading-[0.95] tracking-tight sm:text-5xl">How it works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg font-light leading-relaxed text-muted-foreground">
              ZeroPin makes saving and rediscovering bookmarks effortless, whether it's a web page, a snippet of text, or a key moment in an AI conversation.
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
    </ExtensionPage>
  );
}
