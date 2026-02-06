import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { ChevronDown, ArrowDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

const Landing = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  
  const isLoggedIn = !!user;
  const fullName = profile?.full_name || null;
  const email = user?.email || null;
  const initials = getInitials(fullName, email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen zr-reduce-motion">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2">
            <Logo />
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <button 
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              How it works
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{fullName || "User"}</p>
                      <p className="text-xs text-muted-foreground">{email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard" className="w-full cursor-pointer">Dashboard</NavLink>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <NavLink to="/dashboard/settings" className="w-full cursor-pointer">Settings</NavLink>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin" className="w-full cursor-pointer">Admin Panel</NavLink>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden zr-hero-bg">
          <div className="container py-16 sm:py-24 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <p className="mb-4 text-sm font-medium text-muted-foreground">
                Works with ChatGPT, Claude, Gemini, Grok, Perplexity & Copilot
              </p>
              
              <h1 className="font-heading zr-text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Stop scrolling long AI chats
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                Index questions, bookmark insights, and continue across AI tools instantly!
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-shadow sm:w-auto"
                >
                  <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer">
                    Add to Chrome — it's free
                  </a>
                </Button>
              </div>

              <button 
                onClick={() => scrollToSection("how-it-works")}
                className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                See how it works <ArrowDown className="h-4 w-4" />
              </button>

              <p className="mt-4 text-xs text-muted-foreground">
                100% free • No account required • Privacy-first
              </p>
            </div>
          </div>
        </section>

        {/* What It Is, What It's NOT */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 md:grid-cols-2">
                {/* What it's NOT */}
                <Card className="overflow-hidden rounded-2xl border shadow-lg">
                  <div className="border-b bg-muted/50 px-6 py-4">
                    <p className="font-heading font-semibold text-lg">❌ What it's NOT</p>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground">❌</span>
                      <p className="text-sm">A chatbot</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground">❌</span>
                      <p className="text-sm">A summarizer</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-muted-foreground">❌</span>
                      <p className="text-sm">A prompt generator</p>
                    </div>
                  </div>
                </Card>

                {/* What it IS */}
                <Card className="overflow-hidden rounded-2xl border shadow-lg bg-primary/5">
                  <div className="border-b bg-primary/10 px-6 py-4">
                    <p className="font-heading font-semibold text-lg">✅ What it IS</p>
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-primary">✅</span>
                      <p className="text-sm">An index for long AI chats</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary">✅</span>
                      <p className="text-sm">A lightweight memory surface</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-primary">✅</span>
                      <p className="text-sm">A structured handoff tool between AI engines</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
                💡 Why it's useful
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
                { icon: "🎯", title: "Jump to any moment", desc: "Click an index item → jump directly to that point in the conversation." },
                { icon: "⭐", title: "Bookmark what matters", desc: "Star important questions or moments to save them for later." },
                { icon: "🔄", title: "Build reusable context", desc: "Turn saved items into a structured handoff you can continue in any AI tool." },
                { icon: "👁️", title: "Stay out of the way", desc: "Collapse the panel into a slim icon when you don't need it." },
                { icon: "🔒", title: "Privacy-first by design", desc: "No data leaves your browser. No accounts. No cloud sync. No AI processing." },
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

        {/* Perfect For */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              🎯 Perfect for
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 max-w-3xl mx-auto text-center">
              {[
                "Product managers",
                "Developers",
                "Consultants",
                "Researchers",
                "Writers",
                "Anyone having long, complex AI conversations",
              ].map((role, i) => (
                <div key={i} className="rounded-lg bg-muted/30 px-4 py-3">
                  <p className="text-sm font-medium">{role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              Frequently asked questions
            </h2>
            
            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    q: "How does it work?",
                    a: "ZeroRetry Index adds a smart sidebar to AI chat tools. It automatically indexes your questions as you have conversations, creating a clickable table of contents. You can bookmark important moments and export saved items to continue in other AI tools.",
                  },
                  {
                    q: "Which AI platforms are supported?",
                    a: "ZeroRetry Index works with OpenAI ChatGPT, Anthropic Claude, Google Gemini, X Grok, Perplexity, and Microsoft Copilot. Support for more platforms is constantly being added.",
                  },
                ].map((faq, i) => (
                  <AccordionItem key={i} value={`faq-${i}`}>
                    <AccordionTrigger className="text-left font-heading font-medium">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-16 sm:py-24 bg-gradient-to-r from-primary to-accent">
          <div className="container text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to stop scrolling?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Give your AI conversations the structure they deserve.
            </p>
            <div className="mt-8">
              <Button 
                asChild 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer">
                  Add to Chrome — it's free
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="container">
            <div className="flex flex-col items-center gap-6 text-center">
              <Logo />
              <p className="text-sm text-muted-foreground">
                Index your AI chats. Remember what matters.
              </p>
              <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <a href="https://chrome.google.com/webstore" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                  Extension
                </a>
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
              </nav>
              <p className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} ZeroRetry Index
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
