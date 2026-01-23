import { useEffect, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Settings, Shield, LogOut, User } from "lucide-react";
import logo from "@/assets/logo.png";

type LandingHeaderProps = {
  onCtaClick?: (cta: string) => void;
};

const NAV_ITEMS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "How it works", href: "#how-it-works" },
];

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function LandingHeader({ onCtaClick }: LandingHeaderProps) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const fullName = profile?.full_name ?? user?.user_metadata?.full_name ?? null;
  const email = profile?.email ?? user?.email ?? null;
  const initials = getInitials(fullName, email);
  const isLoggedIn = !!user;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

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
          <img src={logo} alt="Prompt Perfector logo" className="h-10 w-10 rounded-md" />
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
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{fullName || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard" className="flex items-center gap-2 cursor-pointer">
                    <User className="h-4 w-4" />
                    Dashboard
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="h-4 w-4" />
                    Settings
                  </NavLink>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <NavLink to="/admin" className="flex items-center gap-2 cursor-pointer">
                        <Shield className="h-4 w-4" />
                        Admin Panel
                      </NavLink>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
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
            </>
          )}

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

                {isLoggedIn ? (
                  <div className="space-y-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline" size="xl" className="w-full">
                        <NavLink to="/dashboard">Dashboard</NavLink>
                      </Button>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Button asChild variant="outline" size="xl" className="w-full">
                          <NavLink to="/admin">Admin Panel</NavLink>
                        </Button>
                      </SheetClose>
                    )}
                    <SheetClose asChild>
                      <Button variant="destructive" size="xl" className="w-full" onClick={handleSignOut}>
                        Sign out
                      </Button>
                    </SheetClose>
                  </div>
                ) : (
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
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
