import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t py-10">
      <div className="container">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
            <p className="text-sm font-medium">Prompt Perfector</p>
            <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground hover:underline">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-foreground hover:underline">
                Terms of Service
              </Link>
              <a 
                href="mailto:support@promptperfector.com" 
                className="hover:text-foreground hover:underline"
              >
                Contact
              </a>
            </nav>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Prompt Perfector. All rights reserved.</p>
            <p className="mt-1 text-xs">
              Built for ChatGPT, Claude, Gemini & more. No affiliation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
