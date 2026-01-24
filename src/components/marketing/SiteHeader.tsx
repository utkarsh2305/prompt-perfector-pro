import { NavLink, useNavigate } from "react-router-dom";
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
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
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
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        <NavLink
          to="/"
          className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold"
        >
          <Logo />
        </NavLink>

        <nav className="hidden items-center gap-6 md:flex">
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#features">
            Features
          </a>
          <a className="text-sm text-muted-foreground hover:text-foreground" href="#pricing">
            Pricing
          </a>
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
                <NavLink to="/signup">Try it now</NavLink>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
