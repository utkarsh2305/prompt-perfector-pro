import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const items = [
  { label: "Overview", to: "/dashboard" },
  { label: "History", to: "/dashboard/history" },
  { label: "Analytics", to: "/dashboard/analytics" },
];

export function DashboardNav({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)} aria-label="Dashboard navigation">
      <div className="flex min-w-max gap-1 rounded-md bg-muted p-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/dashboard"}
            className={
              "min-h-11 rounded-sm px-3 py-2 text-sm font-medium text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            }
            activeClassName="bg-background text-foreground shadow-sm"
          >
            {it.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
