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
    <section id="how" className="py-24 md:py-32 border-t border-border bg-secondary">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl md:text-6xl font-black tracking-tighter">
            Up and Running in <span className="text-gradient-orange">48 Hours</span>
          </h2>
        </Reveal>
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden
            className="hidden md:block absolute top-12 left-[16%] right-[16%] border-t-2 border-dashed border-orange/40"
          />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 120}>
              <div className="relative h-full rounded-xl border border-border bg-card p-8 shadow-card text-center">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-orange text-foreground text-2xl font-bold shadow-orange ring-4 ring-background">
                  {s.n}
                </div>
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