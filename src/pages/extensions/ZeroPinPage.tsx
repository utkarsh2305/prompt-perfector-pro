import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";
import { Card } from "@/components/ui/card";
import type { CSSProperties } from "react";

export default function ZeroPinPage() {
  const ext = getExtension("zeropin")!;

  return (
    <ExtensionPage extension={ext}>
      {/* What It Is / What It's NOT */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="zr-panel overflow-hidden rounded-2xl" data-zr-reveal data-zr-tilt>
                <div className="border-b bg-muted/50 px-6 py-4">
                  <p className="font-heading font-semibold text-lg">What it's NOT</p>
                </div>
                <div className="p-6 space-y-3">
                  {[
                    "A cloud bookmarking service",
                    "A reading or annotation app",
                    "A social bookmarking tool",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="text-muted-foreground">✕</span>
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                className="zr-panel overflow-hidden rounded-2xl bg-primary/5"
                style={{ "--zr-delay": "90ms" } as CSSProperties}
                data-zr-reveal
                data-zr-tilt
              >
                <div className="border-b bg-primary/10 px-6 py-4">
                  <p className="font-heading font-semibold text-lg">What it IS</p>
                </div>
                <div className="p-6 space-y-3">
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
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12" data-zr-reveal>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              ZeroPin makes saving and rediscovering bookmarks effortless — whether it's a web page,
              a snippet of text, or a key moment in an AI conversation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              {
                icon: "📌",
                title: "Save pages or snippets in one right-click",
                desc: "Right-click any selected text or page and save it instantly. No copy-paste needed — ZeroPin remembers the text and exactly where it was.",
              },
              {
                icon: "🖍️",
                title: "Snippets auto-highlight on revisit",
                desc: "Return to a saved page and your saved text is highlighted in yellow automatically — even if the page has changed slightly.",
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
                desc: "Set a reminder on any bookmark — Tomorrow, In 3 days, In 1 week, or a custom date. Due reminders surface at the top of your Library automatically.",
              },
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


    </ExtensionPage>
  );
}
