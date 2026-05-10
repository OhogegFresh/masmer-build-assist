import { Quote } from "lucide-react";
import { Reveal } from "./Reveal";

const stats = [
  { value: "40%", label: "of contractor calls go unanswered" },
  { value: "$17K", label: "lost per contractor every month" },
  { value: "3-5h", label: "wasted per estimate" },
];

export function SocialProof() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl md:text-5xl font-black tracking-tighter mb-14">
            Built by Someone Who's{" "}
            <span className="text-gradient-orange">Been on the Job Site</span>
          </h2>
        </Reveal>
        <Reveal>
          <figure className="relative max-w-3xl mx-auto rounded-2xl border border-orange/30 bg-card p-10 shadow-card">
            <Quote className="absolute -top-5 left-8 h-10 w-10 text-orange bg-background p-1.5 rounded-full" />
            <blockquote className="text-lg md:text-xl leading-relaxed text-foreground/90">
              "I'm a contractor and project manager from New York. I built
              Masmer AI because I know firsthand what it costs to miss a call
              or spend 3 hours on an estimate while you're juggling 4 jobs.
              This platform was built from the ground up for the trades."
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-orange flex items-center justify-center font-black text-background">
                O
              </div>
              <div>
                <p className="font-bold">Omer</p>
                <p className="text-sm text-muted-foreground">
                  Founder, Masmer AI
                </p>
              </div>
            </figcaption>
          </figure>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 100}>
              <div className="rounded-xl border border-border bg-card p-8 text-center shadow-card">
                <p className="text-5xl font-black text-gradient-orange">
                  {s.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}