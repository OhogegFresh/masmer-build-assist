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
          <a href="#" className="hover:text-orange transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-orange transition-colors">Terms of Service</a>
          <a href="#contact" className="hover:text-orange transition-colors">Contact</a>
        </nav>
        <p className="md:text-right text-xs text-muted-foreground">
          © 2026 Masmer AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}