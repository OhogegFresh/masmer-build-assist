import { Logo } from "./Logo";
import { Link } from "@tanstack/react-router";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how", label: "How It Works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/estimate"
            className="hidden sm:inline text-sm font-semibold text-gold hover:text-gold/80 transition-colors"
          >
            Try Estimating Bot
          </Link>
          <Link
            to="/login"
            className="hidden sm:inline text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            Sign in
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center justify-center rounded-md bg-gradient-gold px-4 py-2 text-sm font-bold text-background hover:shadow-gold transition-shadow"
          >
            Get Early Access
          </a>
        </div>
      </div>
    </header>
  );
}