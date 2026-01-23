import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Skeleton className="mx-auto h-12 w-12 rounded-full" />
        <Skeleton className="mx-auto h-4 w-32" />
      </div>
    </div>
  );
}

function AdminDeniedRedirect() {
  const location = useLocation();

  useEffect(() => {
    toast({
      title: "Access denied",
      description: "Admin privileges required.",
      variant: "destructive",
    });
  }, []);

  return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode;
  requireAdmin?: boolean;
}) {
  const { user, isAdmin, isLoading, roles, isAdminAllowlisted } = useAuth();
  const location = useLocation();
  
  // Track if we've waited long enough for admin status to resolve
  const [adminCheckTimeout, setAdminCheckTimeout] = useState(false);
  
  // For admin routes, give a brief window for admin status to load
  // This prevents flashing "access denied" before admin check completes
  useEffect(() => {
    if (requireAdmin && user && roles.includes("admin") && !isAdminAllowlisted) {
      const timer = setTimeout(() => setAdminCheckTimeout(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [requireAdmin, user, roles, isAdminAllowlisted]);

  // Still loading initial auth state
  if (isLoading) return <PageLoader />;

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // Admin route handling
  if (requireAdmin) {
    // User has admin role and is allowlisted - allow access
    if (isAdmin) {
      return <>{children}</>;
    }
    
    // User has admin role but allowlist check not done yet - wait briefly
    if (roles.includes("admin") && !isAdminAllowlisted && !adminCheckTimeout) {
      return <PageLoader />;
    }
    
    // User doesn't have admin role or allowlist check timed out/failed
    return <AdminDeniedRedirect />;
  }

  return <>{children}</>;
}
