import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

export function SiteHeader() {
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

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
      <div className="container flex h-14 items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold"
        >
          <img src={logo} alt="Prompt Perfector logo" className="h-10 w-10 rounded-md" />
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
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <NavLink to="/login">Sign in</NavLink>
              </Button>
              <Button asChild variant="hero" size="sm">
                <NavLink to="/signup">Try it now</NavLink>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
