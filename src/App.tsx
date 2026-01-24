import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CookieConsentBanner } from "@/components/CookieConsentBanner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

// Eager loaded pages (critical path)
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy loaded pages (code splitting)
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Pricing = lazy(() => import("./pages/Pricing"));
const DashboardLayout = lazy(() => import("./pages/dashboard/DashboardLayout"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

// Minimal loading fallback - only shown during lazy chunk loading
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

// Redirect logged-in users away from auth pages
function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  // Only show loader on initial auth check, not on re-renders
  if (isLoading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        
        {/* Auth pages - redirect if already logged in */}
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
        <Route path="/forgot-password" element={<AuthRedirect><ForgotPassword /></AuthRedirect>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* Protected pages */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <CookieConsentBanner />
    </Suspense>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AnalyticsProvider>
          <AuthProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </AnalyticsProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
