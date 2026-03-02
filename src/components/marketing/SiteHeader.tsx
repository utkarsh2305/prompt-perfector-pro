import { NavLink, useNavigate, Link } from "react-router-dom";
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
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { extensions } from "@/data/extensions";

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
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const fullName = profile?.full_name || null;
  const email = user?.email || null;
  const initials = getInitials(fullName, email);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <header className="zr-site-header">
      <div className="zr-content relative flex h-16 items-center">
        <div className="flex w-48 items-center justify-start">
          <NavLink to="/" className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold">
            <Logo />
          </NavLink>
        </div>

        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center md:flex">
          <NavigationMenu className="[&>div.absolute]:left-1/2 [&>div.absolute]:-translate-x-1/2">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=open]:bg-transparent">
                  Extensions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="mx-auto grid w-[860px] max-w-[calc(100vw-2.5rem)] grid-cols-3 gap-3 p-4">
                    {extensions.map((ext) => (
                      <li key={ext.slug}>
                        <NavigationMenuLink asChild>
                          <Link
                            to={ext.path}
                            className="zr-panel group block select-none rounded-lg p-3 leading-none no-underline outline-none"
                          >
                            <div className="flex items-center gap-2">
                              {ext.icon ? (
                                <img src={ext.icon} alt="" className="h-5 w-5 rounded-full object-cover" />
                              ) : (
                                <span className="text-lg">🧩</span>
                              )}
                              <div className="text-sm font-medium leading-none">{ext.name}</div>
                            </div>
                            <p className="mt-1 line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-foreground/75">
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

        <div className="ml-auto flex w-48 items-center justify-end gap-3">
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
            <div className="invisible pointer-events-none flex items-center gap-3" aria-hidden="true">
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
