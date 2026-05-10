import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32 bg-background"
    >
      <div className="absolute inset-0 blueprint-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-background" />
      <div
        className="absolute top-24 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full opacity-30 blur-3xl animate-pulse"
        style={{ background: "var(--gradient-orange)" }}
      />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-semibold text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-orange animate-pulse" />
          Built by a contractor. Built for contractors.
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-[1.05]">
          The <span className="text-gradient-orange">AI Brain</span>
          <br />
          Behind Your Business
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Free AI platform for contractors. Build estimates, manage projects,
          and let AI answer your calls — all in one place. No credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-md bg-gradient-orange px-6 py-3.5 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
          >
            Create Free Account
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 px-2 py-3.5 text-sm font-semibold text-muted-foreground hover:text-orange transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}