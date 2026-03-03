import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
const loadForgotPassword = () => import("./pages/ForgotPassword");
const loadResetPassword = () => import("./pages/ResetPassword");
const loadPricing = () => import("./pages/Pricing");
const loadDashboardLayout = () => import("./pages/dashboard/DashboardLayout");
const loadAdminLayout = () => import("./pages/admin/AdminLayout");
const loadPrivacy = () => import("./pages/Privacy");
const loadTerms = () => import("./pages/Terms");
const loadSupport = () => import("./pages/Support");
const loadUninstallFeedback = () => import("./pages/feedback/UninstallFeedback");
const loadZeroRetryIndexPage = () => import("./pages/extensions/ZeroRetryIndexPage");
const loadZeroDistractPage = () => import("./pages/extensions/ZeroDistractPage");
const loadZeroPinPage = () => import("./pages/extensions/ZeroPinPage");

const ForgotPassword = lazy(loadForgotPassword);
const ResetPassword = lazy(loadResetPassword);
const Pricing = lazy(loadPricing);
const DashboardLayout = lazy(loadDashboardLayout);
const AdminLayout = lazy(loadAdminLayout);
const Privacy = lazy(loadPrivacy);
const Terms = lazy(loadTerms);
const Support = lazy(loadSupport);
const UninstallFeedback = lazy(loadUninstallFeedback);
const ZeroRetryIndexPage = lazy(loadZeroRetryIndexPage);
const ZeroDistractPage = lazy(loadZeroDistractPage);
const ZeroPinPage = lazy(loadZeroPinPage);

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

function RouteChunkPrefetcher() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefetch = () => {
      void loadPrivacy();
      void loadTerms();
      void loadSupport();
      void loadPricing();
      void loadZeroRetryIndexPage();
      void loadZeroDistractPage();
      void loadZeroPinPage();
    };

    let timeoutId: number | undefined;
    let idleId: number | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(() => prefetch(), { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(prefetch, 900);
    }

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      if (idleId !== undefined && idleWindow.cancelIdleCallback) {
        idleWindow.cancelIdleCallback(idleId);
      }
    };
  }, []);

  return null;
}

function HashScrollHandler() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const targetId = decodeURIComponent(location.hash.replace("#", ""));
    if (!targetId) return;

    const timer = window.setTimeout(() => {
      const element = document.getElementById(targetId);
      if (!element) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  return null;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HashScrollHandler />
      <RouteChunkPrefetcher />
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/support" element={<Support />} />
        <Route path="/extensions/zeroretry-index" element={<ZeroRetryIndexPage />} />
        <Route path="/extensions/zero-distract" element={<ZeroDistractPage />} />
        <Route path="/extensions/zeropin" element={<ZeroPinPage />} />
        <Route path="/feedback/uninstall" element={<UninstallFeedback />} />
        
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
