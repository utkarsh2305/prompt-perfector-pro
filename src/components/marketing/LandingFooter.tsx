import { NavLink } from "@/components/NavLink";

export function LandingFooter() {
  return (
    <footer className="border-t">
      <div className="container py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-sm font-semibold">Prompt Perfector</div>
            <p className="mt-2 text-sm text-muted-foreground">
              Write clearer prompts, get better AI results, and waste less time.
            </p>
            <div className="mt-4 flex gap-3 text-sm">
              <a
                className="story-link text-muted-foreground hover:text-foreground"
                href="#"
                aria-label="Twitter"
              >
                Twitter
              </a>
              <a
                className="story-link text-muted-foreground hover:text-foreground"
                href="#"
                aria-label="LinkedIn"
              >
                LinkedIn
              </a>
              <a
                className="story-link text-muted-foreground hover:text-foreground"
                href="#"
                aria-label="GitHub"
              >
                GitHub
              </a>
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Product</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#features">
                  Features
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#pricing">
                  Pricing
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#how-it-works">
                  Extension
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Changelog
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Company</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  About
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Blog
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Contact
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-sm font-semibold">Legal</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Privacy
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Terms
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Security
                </a>
              </li>
              <li>
                <a className="story-link text-muted-foreground hover:text-foreground" href="#">
                  Cookies
                </a>
              </li>
              <li>
                <NavLink className="story-link text-muted-foreground hover:text-foreground" to="/login">
                  Sign in
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2025 Prompt Perfector</p>
          <p>Works with ChatGPT, Claude, Gemini, and more.</p>
        </div>
      </div>
    </footer>
  );
}
