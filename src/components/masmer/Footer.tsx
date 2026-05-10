import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-6 grid gap-8 md:grid-cols-3 items-start">
        <div>
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground max-w-xs">
            The AI Brain Behind Your Business. Built by a contractor, for
            contractors.
          </p>
        </div>
        <nav className="flex md:justify-center gap-6 text-sm text-muted-foreground">
          <Link to="/privacy" className="hover:text-orange transition-colors">
            Privacy Policy
          </Link>
          <Link to="/terms" className="hover:text-orange transition-colors">
            Terms of Service
          </Link>
          <a href="#contact" className="hover:text-orange transition-colors">
            Contact
          </a>
        </nav>
        <p className="md:text-right text-xs text-muted-foreground">
          © 2026 Masmer AI. All rights reserved.
        </p>
      </div>
      <div className="mx-auto max-w-7xl px-6 mt-8 pt-6 border-t border-border text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-2 justify-center text-center">
        <span>© 2026 Masmer AI — 607 The Home Improvement CCS Group</span>
        <span className="opacity-50">|</span>
        <Link to="/privacy" className="hover:text-orange transition-colors">
          Privacy Policy
        </Link>
        <span className="opacity-50">|</span>
        <Link to="/terms" className="hover:text-orange transition-colors">
          Terms of Service
        </Link>
        <span className="opacity-50">|</span>
        <a
          href="mailto:jacob@casacapsolutions.com"
          className="hover:text-orange transition-colors"
        >
          jacob@casacapsolutions.com
        </a>
      </div>
    </footer>
  );
}