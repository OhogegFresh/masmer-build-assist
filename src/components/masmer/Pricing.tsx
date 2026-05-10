import { Check } from "lucide-react";
import { Reveal } from "./Reveal";

const plans = [
  {
    name: "Essentials",
    price: "$199",
    highlight: false,
    features: [
      "AI Receptionist",
      "Lead Follow-Up Agent",
      "Job Scheduling Agent",
      "Monthly Performance Report",
    ],
  },
  {
    name: "Full Suite",
    price: "$399",
    highlight: true,
    features: [
      "Everything in Essentials, plus:",
      "AI Estimating Bot",
      "Home Depot Materials Cart Builder",
      "Professional Estimate Generator (PDF)",
      "Payment Schedule Builder",
      "Disclaimer & General Conditions Templates",
      "Dedicated Setup Support",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="text-center mb-14">
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Simple, <span className="text-gradient-gold">Transparent</span>{" "}
              Pricing
            </h2>
            <p className="mt-4 text-muted-foreground">
              First month free for the first 10 contractors who sign up.
            </p>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 120}>
              <div
                className={`relative h-full rounded-2xl border p-8 shadow-card transition-all ${
                  p.highlight
                    ? "border-gold bg-card shadow-gold scale-[1.02]"
                    : "border-border bg-card hover:border-gold/40"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-gold px-4 py-1 text-xs font-black uppercase tracking-widest text-background shadow-gold">
                    Most Popular
                  </span>
                )}
                <h3 className="text-2xl font-black">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-5xl font-black text-gradient-gold">
                    {p.price}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="h-5 w-5 text-gold shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#contact"
                  className={`mt-8 inline-flex w-full items-center justify-center rounded-md px-5 py-3 text-sm font-bold transition-all ${
                    p.highlight
                      ? "bg-gradient-gold text-background hover:shadow-gold"
                      : "border border-gold/60 text-gold hover:bg-gold/10"
                  }`}
                >
                  Get Started
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}