import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export function LandingFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Stop guessing. Start prompting.
          </p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">
              Pricing
            </a>
            <a 
              href="https://chrome.google.com/webstore" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Extension
            </a>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZeroRetry Index
          </p>
        </div>
      </div>
    </footer>
  );
}
