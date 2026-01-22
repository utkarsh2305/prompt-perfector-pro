import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="pp-hero-bg flex min-h-screen items-center justify-center">
      <div className="pp-surface mx-auto max-w-md rounded-xl border p-6 text-center">
        <h1 className="text-5xl font-semibold tracking-tight">404</h1>
        <p className="mt-3 text-muted-foreground">That page doesn’t exist.</p>
        <a href="/" className="mt-5 inline-block text-primary underline underline-offset-4 hover:opacity-90">
          Return to home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
