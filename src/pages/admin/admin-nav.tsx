import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FlaskConical, UserMinus } from "lucide-react";

const items = [
  { label: "Overview", to: "/admin" },
  { label: "Users", to: "/admin/users" },
  { label: "Analyses", to: "/admin/analyses" },
  { label: "Framework", to: "/admin/framework" },
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Uninstalls", to: "/admin/uninstalls", icon: UserMinus },
  { label: "Test Analyzer", to: "/admin/test", icon: FlaskConical },
  { label: "Settings", to: "/admin/settings" },
];

export function AdminNav({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Admin navigation">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/admin"}
          onClick={onNavigate}
          className={
            "min-h-11 flex items-center gap-2 rounded-md px-3 text-sm font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          }
          activeClassName="bg-muted text-foreground"
        >
          {it.icon && <it.icon className="h-4 w-4" />}
          {it.label}
        </NavLink>
      ))}
      
      {/* Separator */}
      <div className="my-3 border-t" />
      
      {/* Back to Dashboard */}
      <NavLink
        to="/dashboard"
        onClick={onNavigate}
        className="min-h-11 flex items-center gap-2 rounded-md px-3 text-sm font-medium text-primary hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      >
        <LayoutDashboard className="h-4 w-4" />
        Back to Dashboard
      </NavLink>
    </nav>
  );
}
