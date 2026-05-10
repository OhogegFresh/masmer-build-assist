import { Reveal } from "./Reveal";

const steps = [
  {
    n: "01",
    title: "Tell us about your business",
    text: "We learn your services, pricing, and service area.",
  },
  {
    n: "02",
    title: "We build your AI agents",
    text: "Custom-trained on your business in 48 hours.",
  },
  {
    n: "03",
    title: "Sit back and grow",
    text: "Your agents handle calls, leads, bookings and estimates on autopilot.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-24 md:py-32 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl md:text-6xl font-black tracking-tighter">
            Up and Running in <span className="text-gradient-gold">48 Hours</span>
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="h-full rounded-xl border border-border bg-card p-8 shadow-card">
                <p className="text-5xl font-black text-gradient-gold mb-4">
                  {s.n}
                </p>
                <h3 className="text-xl font-bold mb-2">{s.title}</h3>
                <p className="text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}