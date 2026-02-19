import { getExtension } from "@/data/extensions";
import { ExtensionPage } from "./ExtensionPage";
import { Card } from "@/components/ui/card";

export default function ZeroPinPage() {
  const ext = getExtension("zeropin")!;

  return (
    <ExtensionPage extension={ext}>
      {/* What It Is / What It's NOT */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="grid gap-8 md:grid-cols-2">
              <Card className="overflow-hidden rounded-2xl border shadow-lg">
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

              <Card className="overflow-hidden rounded-2xl border shadow-lg bg-primary/5">
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
          <div className="text-center mb-12">
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
                title: "Save with a right-click or shortcut",
                desc: "Right-click any page or selected text and choose \"Save to ZeroPin\", or press Ctrl+Shift+P (Cmd+Shift+P on Mac).",
              },
              {
                icon: "🗂️",
                title: "Organize in folders",
                desc: "Build a folder hierarchy with drag-and-drop reordering. Move pins in bulk to keep your library clean.",
              },
              {
                icon: "🔍",
                title: "Search everything",
                desc: "Search across page names, URLs, domains, snippet text, and notes in one instant query.",
              },
              {
                icon: "💡",
                title: "Highlights resurface on revisit",
                desc: "When you return to a saved page, your saved text snippets are automatically highlighted in the page.",
              },
              {
                icon: "🤖",
                title: "Capture AI context",
                desc: "Detects ChatGPT, Claude, Gemini, and other AI chats — captures platform, role, and conversation metadata.",
              },
              {
                icon: "🔒",
                title: "Private by default",
                desc: "Everything stays in your browser. No accounts, no cloud sync, no tracking.",
              },
            ].map((item, i) => (
              <Card key={i} className="p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="font-heading text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Permissions Explained */}
      <section className="py-16 sm:py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold mb-8 text-center">
              Permissions Explained
            </h2>
            <div className="space-y-4">
              {[
                {
                  perm: "contextMenus",
                  why: "Adds the right-click \"Save to ZeroPin\" option on any page or selected text.",
                },
                {
                  perm: "storage",
                  why: "Saves your pins, folders, and preferences locally in Chrome. Nothing leaves your device.",
                },
                {
                  perm: "tabs",
                  why: "Reads the current page URL and title when you save a pin. Page content is never accessed.",
                },
                {
                  perm: "scripting",
                  why: "Injects snippet highlighting when you revisit a page where you saved a text selection.",
                },
              ].map((p) => (
                <div key={p.perm} className="flex gap-4 rounded-lg border p-4">
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
