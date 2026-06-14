import {
  MessageSquareText,
  ListChecks,
  Package,
  ShoppingCart,
  FileCheck,
  ArrowRight,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { Link } from "@tanstack/react-router";

const steps = [
  {
    icon: MessageSquareText,
    title: "Describe your project",
    text: '"I need to renovate a bathroom, 80 sq ft."',
  },
  {
    icon: ListChecks,
    title: "Asks smart questions",
    text: "Room dimensions, materials, tile size, fixture grade.",
  },
  {
    icon: Package,
    title: "Materials list generated",
    text: "Itemized list of every material with exact quantities.",
  },
  {
    icon: ShoppingCart,
    title: "Home Depot cart built",
    text: "Auto-matched to real Home Depot products with current pricing.",
  },
  {
    icon: FileCheck,
    title: "Full estimate delivered",
    text: "Labor, payment schedule, disclaimers — client-ready PDF.",
  },
];

const sampleLines = [
  { name: "Porcelain Tile 12x24 — Matte Gray", qty: "85 sq ft", price: "$382.50" },
  { name: "Mortar — 50 lb bag", qty: "4", price: "$96.00" },
  { name: "Toilet — Kohler Cimarron", qty: "1", price: "$298.00" },
  { name: "Vanity — 36in Shaker White", qty: "1", price: "$549.00" },
  { name: "Shower Trim Kit — Brushed Nickel", qty: "1", price: "$184.00" },
];

export function EstimatingBot() {
  return (
    <section className="relative py-24 md:py-32 border-t border-border overflow-hidden">
      <div className="absolute inset-0 blueprint-grid opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6">
        <Reveal>
          <div className="text-center mb-16">
            <p className="text-orange font-bold uppercase tracking-widest text-xs mb-3">
              Hero Feature
            </p>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
              Your Smartest{" "}
              <span className="text-gradient-orange">Estimating Tool</span> Yet
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop spending hours building estimates. Describe the project,
              answer a few questions, and Masmer does the rest.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-5 mb-16">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 100}>
              <div className="relative h-full rounded-xl border border-border bg-card p-6 shadow-card hover:border-orange/50 transition-colors">
                <div className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-orange text-background text-xs font-black shadow-orange">
                  {i + 1}
                </div>
                <s.icon className="h-7 w-7 text-orange mb-3" />
                <h3 className="font-bold mb-1.5">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="rounded-2xl border border-orange/30 bg-card shadow-orange overflow-hidden max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/40">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive/70" />
                <div className="h-3 w-3 rounded-full bg-orange/70" />
                <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />
              </div>
              <p className="text-xs text-muted-foreground">
                estimate-#1042-bathroom-reno.pdf
              </p>
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-orange text-xs font-bold uppercase tracking-widest">
                    Project Estimate
                  </p>
                  <h4 className="text-2xl font-black">Bathroom Renovation</h4>
                  <p className="text-sm text-muted-foreground">
                    Client: J. Rivera · 80 sq ft · 14 day timeline
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-3xl font-black text-gradient-orange">
                    $14,820
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden mb-6">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-secondary/40 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="col-span-7">Materials</span>
                  <span className="col-span-2">Qty</span>
                  <span className="col-span-3 text-right">Subtotal</span>
                </div>
                {sampleLines.map((l) => (
                  <div
                    key={l.name}
                    className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-border text-sm"
                  >
                    <span className="col-span-7 truncate">{l.name}</span>
                    <span className="col-span-2 text-muted-foreground">
                      {l.qty}
                    </span>
                    <span className="col-span-3 text-right font-semibold">
                      {l.price}
                    </span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6 text-sm">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Deposit (25%)</p>
                  <p className="font-bold">$3,705</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">
                    Milestone (50%)
                  </p>
                  <p className="font-bold">$7,410</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Final (25%)</p>
                  <p className="font-bold">$3,705</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                General conditions and disclaimer auto-included. Materials priced
                from Home Depot live catalog.
              </p>
            </div>
          </div>
        </Reveal>

        <div className="text-center mt-12">
          <Link
            to="/signup"
            className="group inline-flex items-center gap-2 rounded-md bg-gradient-orange px-7 py-4 text-sm font-bold text-foreground shadow-orange hover:scale-[1.02] transition-transform"
          >
            Try Eliko Free
            <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}