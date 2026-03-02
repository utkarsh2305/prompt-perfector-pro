import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";
import { Card } from "@/components/ui/card";
import type { CSSProperties } from "react";

export default function ZeroRetryIndexPage() {
  const ext = getExtension("zeroretry-index")!;

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
                  {["A chatbot", "A summarizer", "A prompt generator"].map((item) => (
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
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12" data-zr-reveal>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Why it's useful
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Long AI conversations break down because important questions get buried,
              context is hard to reuse later, and switching AI tools means re-explaining everything.
            </p>
            <p className="mt-2 text-lg font-medium">
              ZeroRetry Index fixes this by giving your conversation memory and structure.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
            {[
              { icon: "📋", title: "Auto-index your questions", desc: "Every question you ask appears instantly in the sidebar." },
              { icon: "🎯", title: "Jump to any moment", desc: "Click an index item to jump directly to that point in the conversation." },
              { icon: "⭐", title: "Bookmark what matters", desc: "Star important questions or moments to save them for later." },
              { icon: "🔄", title: "Build reusable context", desc: "Turn saved items into a structured handoff you can continue in any AI tool." },
              { icon: "👁️", title: "Stay out of the way", desc: "Collapse the panel into a slim icon when you don't need it." },
              { icon: "🔒", title: "Privacy-first by design", desc: "No data leaves your browser. No accounts. No cloud sync. No AI processing." },
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
