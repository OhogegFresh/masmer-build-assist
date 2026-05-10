import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Logo } from "./Logo";

interface LegalLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function LegalLayout({ title, subtitle, children }: LegalLayoutProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setProgress(total > 0 ? (h.scrollTop / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="fixed top-0 left-0 h-[3px] bg-orange z-50 transition-[width] duration-100"
        style={{ width: `${progress}%` }}
      />
      <header className="border-b border-border">
        <div className="mx-auto max-w-[740px] px-6 py-5 flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-[740px] px-6 py-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          Masmer AI — operated by 607 The Home Improvement CCS Group
        </p>
        <div className="mt-12 space-y-10 leading-[1.8] text-[15px] text-muted-foreground">
          {children}
        </div>
      </main>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-[20px] font-semibold text-orange">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}