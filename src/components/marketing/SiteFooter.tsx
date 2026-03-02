import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { extensions } from "@/data/extensions";

export function SiteFooter() {
  return (
    <footer className="zr-site-footer py-16">
      <div className="zr-content">
        <div className="zr-panel flex flex-col items-center gap-6 px-6 py-10 text-center">
          <Logo />
          <p className="max-w-xl text-sm text-muted-foreground">Browser extensions that respect your time and privacy.</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {extensions.map((ext) => (
              <Link key={ext.slug} to={ext.path} className="zr-link">
                {ext.name}
              </Link>
            ))}
            <Link to="/privacy" className="zr-link">
              Privacy
            </Link>
            <Link to="/terms" className="zr-link">
              Terms
            </Link>
            <Link to="/support" className="zr-link">
              Support
            </Link>
          </nav>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ZeroRetry</p>
        </div>
      </div>
    </footer>
  );
}
