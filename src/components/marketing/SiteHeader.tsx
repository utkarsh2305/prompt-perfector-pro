import type { MouseEvent } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "U";
}

export function SiteHeader() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const fullName = profile?.full_name || null;
  const email = user?.email || null;
  const initials = getInitials(fullName, email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const handleExtensionsClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      event.preventDefault();
      document.getElementById("extensions")?.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.location.hash !== "#extensions") {
        window.history.replaceState(null, "", "#extensions");
      }
    }
  };

  return (
    <header className="zr-site-header fixed inset-x-0 top-0 z-[999] border-b border-border/80 bg-background/55 backdrop-blur-2xl">
      <div className="zr-content grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
        <div className="flex items-center justify-self-start">
          <NavLink to="/" className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold">
            <Logo />
          </NavLink>
        </div>

        <nav className="hidden items-center justify-self-center md:flex">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="border border-border/70 bg-card/35 px-4 text-foreground/90 backdrop-blur-md hover:bg-card/55 hover:text-foreground"
          >
            <Link to="/#extensions" onClick={handleExtensionsClick}>
              Extensions
            </Link>
          </Button>
        </nav>

        <div className="flex items-center justify-self-end gap-3">
          {isLoggedIn ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full border border-border/70 bg-card/50">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-sm text-primary-foreground">{initials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-border/80 bg-card/80 backdrop-blur-xl" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{fullName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard" className="w-full cursor-pointer">
                    Dashboard
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/settings" className="w-full cursor-pointer">
                    Settings
                  </NavLink>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <NavLink to="/admin" className="w-full cursor-pointer">
                      Admin Panel
                    </NavLink>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="invisible pointer-events-none flex items-center gap-3 whitespace-nowrap" aria-hidden="true">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button asChild variant="ghost" size="sm" className="border border-border/70 bg-card/40">
                  <NavLink to="/login">Sign in</NavLink>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }}>
                <Button asChild size="sm" className="bg-[image:var(--gradient-brand)] text-primary-foreground shadow-[var(--shadow-elev)]">
                  <NavLink to="/signup">Try it now</NavLink>
                </Button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

