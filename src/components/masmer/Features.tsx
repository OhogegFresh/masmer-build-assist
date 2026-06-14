import { PhoneCall, CalendarCheck, MessageSquare, CalendarClock, FileText } from "lucide-react";
import { Reveal } from "./Reveal";

const features = [
  {
    icon: PhoneCall,
    title: "AI Receptionist",
    text: "Answers every call 24/7, speaks like a real person, never misses a lead.",
  },
  {
    icon: CalendarCheck,
    title: "Estimate Booker",
    text: "Qualifies leads and books estimate appointments automatically.",
  },
  {
    icon: MessageSquare,
    title: "Lead Follow-Up Agent",
    text: "Texts and emails leads automatically after first contact.",
  },
  {
    icon: CalendarClock,
    title: "Job Scheduler",
    text: "Manages your calendar, sends reminders, reduces no-shows.",
  },
  {
    icon: FileText,
    title: "Eliko",
    text: "Describe your project and get a full estimate with materials, Home Depot cart, payment schedule, and contract — in minutes.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-orange font-bold uppercase tracking-widest text-xs mb-3">
              The Solution
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Meet Your <span className="text-gradient-orange">AI Team</span>
            </h2>
          </div>
        </Reveal>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 80}>
              <div className="group relative h-full rounded-xl border border-border bg-card p-8 shadow-card border-l-4 border-l-orange hover:border-orange/60 hover:shadow-orange hover:-translate-y-1 transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-orange text-foreground mb-5 group-hover:shadow-orange transition-shadow">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}