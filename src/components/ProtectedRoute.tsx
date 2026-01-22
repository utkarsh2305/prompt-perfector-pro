import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

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
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (requireAdmin && !isAdmin) {
    return <AdminDeniedRedirect />;
  }

  return <>{children}</>;
}
