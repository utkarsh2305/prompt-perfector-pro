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
      <div className="zr-content flex h-16 items-center justify-between">
        <NavLink to="/" className="inline-flex items-center gap-2 rounded-md px-1 py-1 text-sm font-semibold">
          <Logo />
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent text-sm text-muted-foreground hover:bg-transparent hover:text-foreground data-[state=open]:bg-transparent">
                  Extensions
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[420px] gap-3 p-4 md:w-[520px] md:grid-cols-2">
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

        <div className="flex items-center gap-3">
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
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
