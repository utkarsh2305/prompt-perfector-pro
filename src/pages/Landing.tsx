import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { NavLink } from "@/components/NavLink";
import { ArrowDown, BrainCircuit, Focus, Repeat, Lock, Eye, Layers } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
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
import { extensions } from "@/data/extensions";

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
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="text-sm text-muted-foreground bg-transparent hover:bg-transparent hover:text-foreground data-[state=open]:bg-transparent">
                    Extensions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      {extensions.map((ext) => (
                        <li key={ext.slug}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={ext.path}
                              className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-muted focus:bg-muted"
                            >
                              <div className="flex items-center gap-2">
                                {ext.icon ? (
                                  <img src={ext.icon} alt="" className="h-5 w-5" />
                                ) : (
                                  <span className="text-lg">🧩</span>
                                )}
                                <div className="text-sm font-medium leading-none">{ext.name}</div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-foreground/70 mt-1">
                                {ext.tagline}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
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
              <p className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground">
                The Micro-Automation Company
              </p>

              <h1 className="font-heading zr-text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Zero friction. Zero wasted effort.{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Zero retry.
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
                We build intelligent micro-automation layers that remove friction from your digital
                work — one small, invisible improvement at a time.
              </p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl transition-shadow sm:w-auto"
                >
                  <button onClick={() => scrollToSection("extensions")}>
                    Explore Our Extensions
                  </button>
                </Button>
              </div>

              <button
                onClick={() => scrollToSection("problem")}
                className="mt-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Learn more <ArrowDown className="h-4 w-4" />
              </button>

              <p className="mt-4 text-xs text-muted-foreground">
                Privacy-first · 100% free · No account required
              </p>
            </div>
          </div>
        </section>

        {/* The Problem */}
        <section id="problem" className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              The digital world is broken
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Every day, small frictions compound into hours of lost productivity.
            </p>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {[
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
              ].map((item) => (
                <Card key={item.title} className="p-6 text-center">
                  <item.icon className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="mt-4 font-heading text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* The Vision */}
        <section className="py-16 sm:py-24">
          <div className="container text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              What if your tools worked <span className="italic">for</span> you?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              ZeroRetry builds intelligent behavioral infrastructure that removes friction from
              digital work. We don't replace your tools — we make them smarter.
            </p>
            <p className="mt-4 text-lg text-muted-foreground">
              Each ZeroRetry product adds a thin, invisible automation layer that handles the
              repetitive overhead so you can focus on what actually matters.
            </p>
            <p className="mt-8 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary">
              Micro-automations, not disruptions.
            </p>
          </div>
        </section>

        {/* Extension Cards */}
        <section id="extensions" className="py-16 sm:py-24 bg-muted/30">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-4">
              What we're building
            </h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Each extension tackles one specific friction — and does it exceptionally well.
            </p>
            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {extensions.map((ext) => (
                <Card key={ext.slug} className="overflow-hidden rounded-2xl border shadow-lg p-6 hover:shadow-xl transition-shadow">
                  {ext.icon ? (
                    <img src={ext.icon} alt="" className="h-12 w-12" />
                  ) : (
                    <span className="text-4xl">🧩</span>
                  )}
                  <h3 className="mt-4 font-heading text-2xl font-bold">{ext.name}</h3>
                  <p className="mt-2 text-muted-foreground">{ext.tagline}</p>
                  <ul className="mt-4 space-y-1">
                    {ext.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <span className="text-primary">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex gap-3">
                    <Button asChild variant="default" size="sm">
                      <Link to={ext.path}>Learn more</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={ext.chromeStoreUrl} target="_blank" rel="noopener noreferrer">
                        Add to Chrome
                      </a>
                    </Button>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">{ext.privacySummary}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* The ZeroRetry Difference */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              The ZeroRetry difference
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              {[
                {
                  icon: Lock,
                  title: "Privacy-first, always",
                  desc: "Every ZeroRetry product keeps your data local. No accounts, no cloud sync, no analytics, no tracking. Your browser, your data.",
                },
                {
                  icon: Eye,
                  title: "Invisible by design",
                  desc: "Our tools work in the background. No setup wizards, no learning curves. Install and go — the best tools are the ones you barely notice.",
                },
                {
                  icon: Layers,
                  title: "Built to compound",
                  desc: "Each product removes one specific friction. Together, they create a performance layer across your entire digital workflow.",
                },
              ].map((item) => (
                <Card key={item.title} className="p-6 text-center">
                  <item.icon className="h-10 w-10 mx-auto text-primary" />
                  <h3 className="mt-4 font-heading text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Where We're Going */}
        <section className="py-16 sm:py-24 bg-muted/30">
          <div className="container text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl mb-8">
              Where we're going
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                <span className="font-semibold text-foreground">Today:</span> Chrome extensions that
                protect your focus and organize your AI conversations.
              </p>
              <p>
                <span className="font-semibold text-foreground">Tomorrow:</span> A distributed
                performance layer across browsers, AI tools, and SaaS platforms.
              </p>
            </div>
            <p className="mt-8 text-sm font-medium text-primary">
              We're just getting started.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 sm:py-24">
          <div className="container">
            <h2 className="font-heading text-center text-3xl font-bold tracking-tight sm:text-4xl mb-12">
              Frequently asked questions
            </h2>

            <div className="mx-auto max-w-2xl">
              <Accordion type="single" collapsible className="w-full">
                {[
                  {
                    q: "What is ZeroRetry?",
                    a: "ZeroRetry is a micro-automation company building intelligent layers that remove friction from digital work. We create privacy-first Chrome extensions — each one solves a specific productivity problem while keeping all your data local.",
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
                    a: "Yes. We're actively building new micro-automation layers for common digital frictions. Each new extension will follow the same principles: solve one problem well, keep data local, and work invisibly in the background.",
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
              Ready to remove the friction?
            </h2>
            <p className="mt-4 text-lg text-white/90">
              Choose the extension that fits your workflow.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {extensions.map((ext) => (
                <Button
                  key={ext.slug}
                  asChild
                  size="lg"
                  variant="secondary"
                  className="bg-white text-primary hover:bg-white/90"
                >
                  <Link to={ext.path}>
                    {ext.name}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-12">
          <div className="container">
            <div className="flex flex-col items-center gap-6 text-center">
              <Logo />
              <p className="text-sm text-muted-foreground">
                Browser extensions that respect your time and privacy.
              </p>
              <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                {extensions.map((ext) => (
                  <Link key={ext.slug} to={ext.path} className="hover:text-foreground transition-colors">
                    {ext.name}
                  </Link>
                ))}
                <Link to="/privacy" className="hover:text-foreground transition-colors">
                  Privacy
                </Link>
                <Link to="/terms" className="hover:text-foreground transition-colors">
                  Terms
                </Link>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Support
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
