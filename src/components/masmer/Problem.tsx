import { PhoneOff, UserX, Clock } from "lucide-react";
import { Reveal } from "./Reveal";

const pains = [
  {
    icon: PhoneOff,
    title: "You're on the job site",
    text: "Your phone goes to voicemail and leads disappear into the void.",
  },
  {
    icon: UserX,
    title: "Leads call once",
    text: "If you don't answer, they call your competitor — and never call back.",
  },
  {
    icon: Clock,
    title: "Endless admin work",
    text: "Estimating, scheduling, and follow-up eat hours you don't have.",
  },
];

export function Problem() {
  return (
    <section className="py-24 md:py-32 border-t border-border">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <h2 className="text-center text-4xl md:text-6xl font-black tracking-tighter">
            Contractors Lose
            <br />
            <span className="text-gradient-orange">$17,000/Month</span> in Missed Calls
          </h2>
        </Reveal>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {pains.map((p, i) => (
            <Reveal key={p.title} delay={i * 100}>
              <div className="h-full rounded-xl border border-border bg-card p-8 shadow-card hover:border-orange/40 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange/10 text-orange mb-5">
                  <p.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{p.title}</h3>
                <p className="text-muted-foreground">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}