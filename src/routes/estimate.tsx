import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/masmer/Logo";
import { ArrowLeft, Send, Download, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "AI Estimating Bot — Masmer AI" },
      {
        name: "description",
        content:
          "Chat with Masmer AI to instantly generate a professional contractor estimate with materials, labor, markup and payment schedule.",
      },
    ],
  }),
  component: EstimatePage,
});

type Msg = { role: "user" | "assistant"; content: string };

type Estimate = {
  project_title: string;
  project_summary: string;
  square_footage: number;
  timeline: string;
  materials: { item: string; qty: number; unit: string; unit_cost: number; total: number }[];
  labor: { task: string; hours: number; rate: number; total: number }[];
  materials_subtotal: number;
  labor_subtotal: number;
  contractor_markup: number;
  project_total: number;
};

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Hi! I'm your Masmer AI estimating assistant. Describe your project and I'll build you a full professional estimate.",
};

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function EstimatePage() {
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, estimate]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("estimate-chat", {
        body: { messages: next },
      });
      if (error) throw error;
      if (data?.estimate) {
        setEstimate(data.estimate);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              data.content ||
              "Your estimate is ready below. Review the materials, labor and payment schedule, then download the PDF.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data?.content ?? "Sorry, something went wrong." },
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Connection error. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const payment = estimate
    ? {
        deposit: Math.round(estimate.project_total * 0.33),
        midpoint: Math.round(estimate.project_total * 0.33),
        final: Math.round(estimate.project_total * 0.34),
      }
    : null;

  const downloadPdf = () => {
    if (!estimate || !payment) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(199, 161, 80);
    doc.text("Masmer AI — Project Estimate", 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(estimate.project_title, 14, 28);
    doc.setFontSize(9);
    doc.text(`${estimate.square_footage} sq ft  ·  ${estimate.timeline}`, 14, 34);
    const lines = doc.splitTextToSize(estimate.project_summary, 180);
    doc.text(lines, 14, 42);

    autoTable(doc, {
      startY: 42 + lines.length * 5 + 4,
      head: [["Material", "Qty", "Unit", "Unit Cost", "Total"]],
      body: estimate.materials.map((m) => [m.item, m.qty, m.unit, fmt(m.unit_cost), fmt(m.total)]),
      headStyles: { fillColor: [199, 161, 80] },
    });

    autoTable(doc, {
      head: [["Labor", "Hours", "Rate", "Total"]],
      body: estimate.labor.map((l) => [l.task, l.hours, fmt(l.rate), fmt(l.total)]),
      headStyles: { fillColor: [199, 161, 80] },
    });

    autoTable(doc, {
      head: [["Summary", "Amount"]],
      body: [
        ["Materials Subtotal", fmt(estimate.materials_subtotal)],
        ["Labor Subtotal", fmt(estimate.labor_subtotal)],
        ["Contractor Markup (20%)", fmt(estimate.contractor_markup)],
        ["Project Total", fmt(estimate.project_total)],
        ["Deposit (33%)", fmt(payment.deposit)],
        ["Midpoint (33%)", fmt(payment.midpoint)],
        ["Final (34%)", fmt(payment.final)],
      ],
      headStyles: { fillColor: [199, 161, 80] },
    });

    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    doc.setFontSize(8);
    doc.setTextColor(90);
    const disclaimer =
      "Disclaimer: This estimate is generated by Masmer AI based on user-provided information and standard market pricing. Final pricing subject to site inspection, material availability, and unforeseen conditions. General conditions, permits, taxes, and dump fees may apply. Valid 30 days from issue.";
    doc.text(doc.splitTextToSize(disclaimer, 180), 14, finalY + 10);

    doc.save(`${estimate.project_title.replace(/\s+/g, "-").toLowerCase()}-estimate.pdf`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gold transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-24 pb-12">
        <div className="text-center mb-6">
          <p className="text-gold font-bold uppercase tracking-widest text-xs mb-2">
            AI Estimating Bot
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Build a <span className="text-gradient-gold">Professional Estimate</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-gold/30 bg-card shadow-gold overflow-hidden flex flex-col h-[65vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gradient-gold text-background font-medium"
                      : "bg-secondary/60 border border-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-secondary/60 border border-border rounded-xl px-4 py-2.5">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="border-t border-border p-3 flex gap-2 bg-secondary/30"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your reply…"
              disabled={loading}
              className="flex-1 rounded-md bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-gold px-4 py-2.5 text-sm font-bold text-background disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>

        {estimate && payment && (
          <div className="mt-10 rounded-2xl border border-gold/40 bg-card shadow-gold overflow-hidden">
            <div className="p-6 border-b border-border flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-gold text-xs font-bold uppercase tracking-widest">
                  Project Estimate
                </p>
                <h2 className="text-2xl font-black">{estimate.project_title}</h2>
                <p className="text-sm text-muted-foreground">
                  {estimate.square_footage} sq ft · {estimate.timeline}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-3xl font-black text-gradient-gold">
                  {fmt(estimate.project_total)}
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-sm text-muted-foreground">{estimate.project_summary}</p>

              <section>
                <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-gold">
                  Materials
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-secondary/40 text-xs font-bold uppercase text-muted-foreground">
                    <span className="col-span-6">Item</span>
                    <span className="col-span-2">Qty</span>
                    <span className="col-span-2 text-right">Unit Cost</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {estimate.materials.map((m, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border text-sm"
                    >
                      <span className="col-span-6 truncate">{m.item}</span>
                      <span className="col-span-2 text-muted-foreground">
                        {m.qty} {m.unit}
                      </span>
                      <span className="col-span-2 text-right">{fmt(m.unit_cost)}</span>
                      <span className="col-span-2 text-right font-semibold">{fmt(m.total)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-gold">
                  Labor
                </h3>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-secondary/40 text-xs font-bold uppercase text-muted-foreground">
                    <span className="col-span-6">Task</span>
                    <span className="col-span-2">Hours</span>
                    <span className="col-span-2 text-right">Rate</span>
                    <span className="col-span-2 text-right">Total</span>
                  </div>
                  {estimate.labor.map((l, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-12 gap-2 px-3 py-2 border-t border-border text-sm"
                    >
                      <span className="col-span-6 truncate">{l.task}</span>
                      <span className="col-span-2 text-muted-foreground">{l.hours} h</span>
                      <span className="col-span-2 text-right">{fmt(l.rate)}</span>
                      <span className="col-span-2 text-right font-semibold">{fmt(l.total)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-border p-3 flex justify-between">
                  <span className="text-muted-foreground">Materials Subtotal</span>
                  <span className="font-bold">{fmt(estimate.materials_subtotal)}</span>
                </div>
                <div className="rounded-lg border border-border p-3 flex justify-between">
                  <span className="text-muted-foreground">Labor Subtotal</span>
                  <span className="font-bold">{fmt(estimate.labor_subtotal)}</span>
                </div>
                <div className="rounded-lg border border-border p-3 flex justify-between">
                  <span className="text-muted-foreground">Contractor Markup (20%)</span>
                  <span className="font-bold">{fmt(estimate.contractor_markup)}</span>
                </div>
                <div className="rounded-lg border border-gold/40 p-3 flex justify-between bg-gold/5">
                  <span className="font-bold">Project Total</span>
                  <span className="font-black text-gold">{fmt(estimate.project_total)}</span>
                </div>
              </section>

              <section>
                <h3 className="font-bold mb-2 text-sm uppercase tracking-wider text-gold">
                  Payment Schedule
                </h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Deposit (33%)</p>
                    <p className="font-bold">{fmt(payment.deposit)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Midpoint (33%)</p>
                    <p className="font-bold">{fmt(payment.midpoint)}</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="text-xs text-muted-foreground">Final (34%)</p>
                    <p className="font-bold">{fmt(payment.final)}</p>
                  </div>
                </div>
              </section>

              <section className="text-xs text-muted-foreground italic border-t border-border pt-4">
                <p className="font-bold not-italic text-foreground mb-1">
                  Disclaimer & General Conditions
                </p>
                This estimate is generated by Masmer AI based on user-provided information and
                standard market pricing. Final pricing is subject to site inspection, material
                availability, and unforeseen conditions. General conditions, permits, applicable
                taxes, dump fees, and change orders may apply and are not included unless stated.
                Estimate valid for 30 days from issue.
              </section>

              <button
                onClick={downloadPdf}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-gold px-6 py-3.5 text-sm font-bold text-background shadow-gold hover:scale-[1.01] transition-transform"
              >
                <Download className="h-4 w-4" />
                Download PDF Estimate
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}