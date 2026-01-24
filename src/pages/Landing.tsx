import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { PricingSection } from "@/components/marketing/PricingSection";
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
            <button 
              onClick={() => scrollToSection("pricing")}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </button>
          </nav>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
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
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <NavLink to="/login">Sign in</NavLink>
                </Button>
                <Button asChild variant="default" size="sm" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  <NavLink to="/signup">Get started</NavLink>
                </Button>
              </>
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
                Works with ChatGPT, Claude & Gemini
              </p>
              
              <h1 className="font-heading zr-text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Get it right the first time
              </h1>
              
              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                ZeroRetry scores your prompts and shows you exactly what to fix—before you hit send.
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
                Free forever • No account required to start
              </p>
            </div>
          </div>
        </section>

        {/* Before/After Example */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl">
              <Card className="overflow-hidden rounded-2xl border shadow-lg">
                <div className="border-b bg-muted/50 px-6 py-4">
                  <p className="font-heading font-semibold">Before → After</p>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Before */}
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--score-low))] px-2.5 py-1 text-xs font-medium text-white">
                        4/10
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">
                      "Write a marketing email for my product. Make it good."
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ChevronDown className="h-6 w-6 text-muted-foreground" />
                  </div>

                  {/* After */}
                  <div className="rounded-lg bg-muted/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--score-high))] px-2.5 py-1 text-xs font-medium text-white">
                        9/10
                      </span>
                    </div>
                    <p className="text-sm text-foreground/80">
                      "Write a 120-word email announcing {"{product}"} to {"{audience}"}. Goal: {"{action}"}. Include 3 benefits and a clear subject line."
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {[
                { step: "1", title: "Write", desc: "Type your prompt anywhere—ChatGPT, Claude, Gemini." },
                { step: "2", title: "Score", desc: "See what's missing with instant feedback." },
                { step: "3", title: "Fix", desc: "Apply suggestions or let AI rewrite it for you." },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-lg font-bold text-white">
                    {item.step}
                  </div>
                  <h3 className="font-heading text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof - Numbers Only */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <div className="grid gap-8 sm:grid-cols-3 text-center">
              {[
                { value: "2,400+", label: "users" },
                { value: "38,000+", label: "prompts fixed" },
                { value: "+35 pts", label: "avg. improvement" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-4xl font-bold zr-gradient-text sm:text-5xl">{stat.value}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <div id="pricing">
          <PricingSection />
        </div>

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
                    a: "ZeroRetry runs as a browser extension. When you write a prompt in ChatGPT, Claude, or Gemini, it instantly analyzes your text against proven prompting principles and gives you a score with specific suggestions.",
                  },
                  {
                    q: "Which AI platforms are supported?",
                    a: "ZeroRetry works with ChatGPT, Claude, Gemini, and Perplexity. We're constantly adding support for more platforms.",
                  },
                  {
                    q: "Is my data private?",
                    a: "Yes. Your prompts are analyzed locally in your browser. We never store or transmit your prompt content to our servers. Only aggregate, anonymized usage statistics are collected.",
                  },
                  {
                    q: "What's the difference between Free and Pro?",
                    a: "Free gives you unlimited prompt scoring and 10 AI rewrites per month. Pro unlocks 200+ AI rewrites monthly with rollover credits, plus priority support.",
                  },
                  {
                    q: "Can I cancel anytime?",
                    a: "Absolutely. You can cancel your subscription at any time with no questions asked. You'll retain access until the end of your billing period.",
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
              Ready to stop retrying?
            </h2>
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
                Stop guessing. Start prompting.
              </p>
              <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                <button onClick={() => scrollToSection("pricing")} className="hover:text-foreground transition-colors">
                  Pricing
                </button>
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
                © {new Date().getFullYear()} ZeroRetry
              </p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Landing;
