import { Route, Routes, Navigate, Link } from "react-router-dom";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/pages/admin/admin-nav";
import AdminOverview from "@/pages/admin/AdminOverview";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminAnalyses from "@/pages/admin/AdminAnalyses";
import AdminFramework from "@/pages/admin/AdminFramework";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminSettings from "@/pages/admin/AdminSettings";
import { useAuth } from "@/hooks/useAuth";
import { LayoutDashboard, Shield } from "lucide-react";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex min-h-14 items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="min-h-11 px-3 lg:hidden" aria-label="Open admin menu">
                  Menu
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72">
                <div className="text-sm font-semibold">Admin</div>
                <AdminNav className="mt-4" onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Admin Panel</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="text-xs text-muted-foreground">{user?.email ?? ""}</div>
          </div>
        </div>
      </header>

      <div className="container grid gap-6 pb-safe-bottom py-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="rounded-xl border bg-card p-3">
            <AdminNav />
          </div>
        </aside>

        <main className="min-w-0">
          <Routes>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analyses" element={<AdminAnalyses />} />
            <Route path="framework" element={<AdminFramework />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
