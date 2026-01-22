import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="container flex h-14 items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Prompt Perfector</span>
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#features">
            Features
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#pricing">
            Pricing
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#framework">
            55 Principles
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <NavLink to="/login">Sign in</NavLink>
          </Button>
          <Button asChild variant="hero" size="sm">
            <NavLink to="/dashboard">Try it now</NavLink>
          </Button>
        </div>
      </div>
    </header>
  );
}
