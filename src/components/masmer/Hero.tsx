import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-32 pb-24 md:pt-40 md:pb-32"
    >
      <div className="absolute inset-0 blueprint-grid opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-gold)" }}
      />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-semibold text-muted-foreground mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
          Built by a contractor. Built for contractors.
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.05]">
          The <span className="text-gradient-gold">AI Brain</span>
          <br />
          Behind Your Business
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Masmer AI answers your calls, books your estimates, follows up on
          leads, schedules your jobs, and builds your estimates — 24/7. So you
          can stay on the job site.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/estimate"
            className="group inline-flex items-center gap-2 rounded-md bg-gradient-gold px-6 py-3.5 text-sm font-bold text-background shadow-gold hover:scale-[1.02] transition-transform"
          >
            Try the Estimating Bot Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-md border border-gold/60 px-6 py-3.5 text-sm font-bold text-gold hover:bg-gold/10 transition-colors"
          >
            <PlayCircle className="h-4 w-4" />
            See How It Works
          </a>
        </div>
      </div>
    </section>
  );
}