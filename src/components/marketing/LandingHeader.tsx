import { useEffect, useMemo, useState } from "react";
import { Menu, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type LandingHeaderProps = {
  onCtaClick?: (cta: string) => void;
};

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "How it works", href: "#how-it-works" },
];

export function LandingHeader({ onCtaClick }: LandingHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setHasScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerClass = useMemo(() => {
    return (
      "sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 " +
      (hasScrolled ? "shadow-sm" : "")
    );
  }, [hasScrolled]);

  return (
    <header className={headerClass}>
      <div className="container flex h-14 items-center justify-between">
        <a
          href="#top"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          aria-label="Prompt Perfector (back to top)"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[image:var(--gradient-cta)] text-primary-foreground shadow-[var(--shadow-soft)]">
            <Sparkles className="h-4 w-4" />
          </span>
          <span>Prompt Perfector</span>
        </a>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {NAV_ITEMS.map((it) => (
            <a
              key={it.href}
              href={it.href}
              className="text-sm text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              {it.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex" size="sm">
            <NavLink to="/login">Sign in</NavLink>
          </Button>

          <Button
            asChild
            variant="hero"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => onCtaClick?.("nav_get_started")}
          >
            <NavLink to="/signup">Get started</NavLink>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px]">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <nav className="space-y-1" aria-label="Mobile">
                  {NAV_ITEMS.map((it) => (
                    <SheetClose asChild key={it.href}>
                      <a
                        href={it.href}
                        className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        {it.label}
                      </a>
                    </SheetClose>
                  ))}
                </nav>

                <div className="space-y-2">
                  <SheetClose asChild>
                    <Button asChild variant="outline" size="xl" className="w-full">
                      <NavLink to="/login">Sign in</NavLink>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      asChild
                      variant="hero"
                      size="xl"
                      className="w-full"
                      onClick={() => onCtaClick?.("mobile_get_started")}
                    >
                      <NavLink to="/signup">Get started</NavLink>
                    </Button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
