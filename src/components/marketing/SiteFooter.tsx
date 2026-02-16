import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { extensions } from "@/data/extensions";

export function SiteFooter() {
  return (
    <footer className="border-t py-12">
      <div className="container">
        <div className="flex flex-col items-center gap-6 text-center">
          <Logo />
          <p className="text-sm text-muted-foreground">
            Browser extensions that respect your time and privacy.
          </p>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {extensions.map((ext) => (
              <Link
                key={ext.slug}
                to={ext.path}
                className="hover:text-foreground transition-colors"
              >
                {ext.name}
              </Link>
            ))}
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link to="/support" className="hover:text-foreground transition-colors">
              Support
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZeroRetry
          </p>
        </div>
      </div>
    </footer>
  );
}
