import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/masmer/Logo";
import {
  ArrowLeft,
  Send,
  Download,
  FileText,
  ClipboardList,
  ShoppingCart,
  ExternalLink,
  AlertTriangle,
  Check,
  Wrench,
  Home,
  TreePine,
  Hammer,
  Loader2,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/estimate")({
  head: () => ({
    meta: [
      { title: "AI Scope of Work Builder — Masmer AI" },
      {
        name: "description",
        content:
          "Describe your project and get a full scope of work, private materials list, and crew punchlist instantly.",
      },
    ],
  }),
  component: EstimatePage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Msg = { role: "user" | "assistant"; content: string };

type MaterialItem = {
  item: string;
  qty: number;
  qty_buffered: number;
  unit: string;
  unit_cost: number;
  total: number;
  hd_link: string;
  tbd_note: string;
};

type MaterialSection = {
  section_title: string;
  section_subtitle: string;
  items: MaterialItem[];
  section_total: number;
};

type WorkItem = {
  code: string;
  title: string;
  bullets: string[];
};

type ScopeSection = {
  section_label: string;
  work_items: WorkItem[];
};

type Project = {
  customer_name: string;
  project_address: string;
  project_title: string;
  project_summary: string;
  materials_sections: MaterialSection[];
  scope_sections: ScopeSection[];
  punchlist_items: string[];
  job_specific_disclaimers: string[];
  materials_grand_total: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

const INITIAL: Msg = {
  role: "assistant",
  content:
    "Hey! 👋 I'm your Masmer AI estimating assistant. I'll help you build a complete professional scope of work and materials list in just a few minutes.\n\nTo get started — what's your full name?",
};

// ─── Helper: confirmation detection ───────────────────────────────────────────
const CONFIRM_WORDS = ["yes", "correct", "looks good", "looks right", "generate", "sure", "go ahead", "yep", "yeah", "perfect", "confirm"];
function isConfirmation(text: string) {
  const t = text.toLowerCase();
  return CONFIRM_WORDS.some((w) => t.includes(w));
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
const GENERATING_MESSAGES = [
  "Analyzing your project...",
  "Calculating materials...",
  "Checking Home Depot pricing...",
  "Building your estimate...",
  "Applying 15% buffer...",
  "Generating scope of work...",
  "Almost ready...",
];

function TypingIndicator({ generating }: { generating: boolean }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % GENERATING_MESSAGES.length), 2000);
    return () => clearInterval(t);
  }, [generating]);

  if (!generating) {
    return (
      <div className="bg-secondary/60 border border-border rounded-xl px-4 py-3 inline-flex items-center gap-1.5">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    );
  }

  return (
    <div className="bg-secondary/60 border border-orange/40 rounded-xl px-4 py-3 inline-flex items-start gap-3 max-w-[85%]">
      <div className="h-7 w-7 rounded-full bg-gradient-orange flex items-center justify-center text-background font-black text-xs flex-shrink-0">
        M
      </div>
      <div>
        <div className="flex items-center gap-1.5 mb-1.5 h-3">
          <span className="typing-dot" />
          <span className="typing-dot" />
          <span className="typing-dot" />
        </div>
        <p className="text-xs text-muted-foreground transition-opacity duration-300">
          {GENERATING_MESSAGES[idx]}
        </p>
      </div>
    </div>
  );
}

// ─── Progress Steps ───────────────────────────────────────────────────────────
const STEP_LABELS = ["Your Info", "Project Details", "Measurements", "Confirm", "Estimate Ready"];

function computeStep(messages: Msg[], hasProject: boolean): number {
  if (hasProject) return 5;
  const userMsgs = messages.filter((m) => m.role === "user");
  const allText = userMsgs.map((m) => m.content).join(" \n ").toLowerCase();
  let step = 0;
  // Step 1: name + address
  const hasName = /\b[a-z]{2,}\s+[a-z]{2,}\b/i.test(allText);
  const hasAddress = /\d+\s+\w+|street|st\.|ave|road|rd\.|blvd|lane|ln\.|drive|dr\.|\b\d{5}\b/i.test(allText);
  if (hasName && hasAddress) step = 1;
  // Step 2: project description (a longer message)
  if (step >= 1 && userMsgs.some((m) => m.content.length > 25)) step = 2;
  // Step 3: measurements
  if (step >= 2 && /\d+\s*(ft|feet|sq|x|by|'|ft\.)/i.test(allText)) step = 3;
  // Step 4: confirmation
  if (step >= 3 && userMsgs.some((m) => isConfirmation(m.content))) step = 4;
  return step;
}

function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between mb-8 px-2 max-w-3xl mx-auto">
      {STEP_LABELS.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div
                className={[
                  "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  done
                    ? "bg-orange text-background border-2 border-orange"
                    : active
                      ? "bg-transparent text-orange border-2 border-orange step-pulse"
                      : "bg-transparent text-muted-foreground border-2 border-border",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className="text-[11px] font-medium text-center whitespace-nowrap"
                style={{ color: done || active ? "var(--orange)" : "var(--muted-foreground)" }}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={[
                  "flex-1 h-0.5 mx-2 -mt-6 transition-colors",
                  done ? "bg-orange" : "bg-border",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Quick Start Prompts ──────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: Wrench, title: "🔧 Interior Renovation", subtitle: "Flooring, drywall, painting", text: "I need help with an interior renovation" },
  { icon: Home, title: "🏠 Exterior Work", subtitle: "Siding, roofing, gutters", text: "I need exterior work done on my house" },
  { icon: TreePine, title: "🪵 Deck & Outdoor", subtitle: "Deck, railings, stairs", text: "I need deck work and outdoor improvements" },
  { icon: Hammer, title: "🔨 Handyman & Repairs", subtitle: "Multiple small fixes and repairs", text: "I have several repairs and handyman work needed" },
];

// ─── Confetti ─────────────────────────────────────────────────────────────────
function Confetti() {
  const pieces = Array.from({ length: 26 });
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const cx = (Math.random() - 0.5) * 160;
        const delay = Math.random() * 0.2;
        const isOrange = i % 2 === 0;
        return (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${left}%`,
              backgroundColor: isOrange ? "var(--orange)" : "#FFFFFF",
              animationDelay: `${delay}s`,
              ["--cx" as string]: `${cx}px`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}

// ─── Payment Schedule ─────────────────────────────────────────────────────────
function calcPayments(total: number, deposit: number) {
  const remaining = Math.max(0, total - deposit);
  return {
    deposit,
    p1: +(remaining * 0.5).toFixed(2),
    p2: +(remaining * 0.25).toFixed(2),
    p3: +(remaining * 0.15).toFixed(2),
    p4: +(remaining * 0.1).toFixed(2),
  };
}

// ─── PDF Generators ───────────────────────────────────────────────────────────

// NAVY + ORANGE brand colors
const NAVY = [31, 78, 121] as [number, number, number];
const ORANGE = [197, 90, 17] as [number, number, number];
const LIGHT_BLUE = [214, 228, 240] as [number, number, number];
const WHITE = [255, 255, 255] as [number, number, number];
const DARK = [26, 26, 26] as [number, number, number];
const GRAY = [245, 249, 252] as [number, number, number];

function addLetterhead(doc: jsPDF, project: Project, subtitle: string) {
  // Navy header bar
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 220, 28, "F");
  // Orange bottom border
  doc.setFillColor(...ORANGE);
  doc.rect(0, 28, 220, 2, "F");
  // Company name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("607 THE HOME IMPROVEMENT CCS GROUP", 14, 12);
  // Subtitle
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(214, 228, 240);
  doc.text(subtitle, 14, 20);
  doc.setFontSize(8);
  doc.text("Licensed  •  Insured  •  Professional", 14, 26);

  // Project info block
  doc.setFillColor(...GRAY);
  doc.rect(0, 32, 220, 32, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Customer:", 14, 42);
  doc.text("Address:", 14, 50);
  doc.text("Date:", 14, 58);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(project.customer_name, 45, 42);
  doc.text(project.project_address, 45, 50);
  doc.text(new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 45, 58);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Project:", 120, 42);
  doc.text("Contractor:", 120, 50);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(project.project_title, 148, 42);
  doc.text("607 The Home Improvement CCS Group", 148, 50);

  return 68; // y position after header
}

function addSectionHeader(doc: jsPDF, text: string, y: number): number {
  doc.setFillColor(...NAVY);
  doc.rect(10, y, 190, 8, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(10, y + 8, 190, 1, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(text.toUpperCase(), 14, y + 5.5);
  return y + 14;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 20): number {
  if (y + needed > 275) {
    doc.addPage();
    return 15;
  }
  return y;
}

// ── DOCUMENT 1: Full Scope of Work / Contract ──────────────────────────────
function generateContractPDF(project: Project, contractTotal: number, deposit: number) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pay = calcPayments(contractTotal, deposit);
  let y = addLetterhead(doc, project, "SCOPE OF WORK & SERVICE CONTRACT");

  // Total badge
  doc.setFillColor(...ORANGE);
  doc.roundedRect(140, 34, 60, 14, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...WHITE);
  doc.text("TOTAL CONTRACT", 170, 40, { align: "center" });
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(fmt(contractTotal), 170, 46, { align: "center" });

  // Scope of Work
  y = addSectionHeader(doc, "🔧  Scope of Work", y);

  for (const section of project.scope_sections) {
    y = checkPageBreak(doc, y, 25);
    // Section label
    doc.setFillColor(...LIGHT_BLUE);
    doc.rect(10, y, 190, 7, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(section.section_label, 14, y + 5);
    y += 10;

    for (const wi of section.work_items) {
      y = checkPageBreak(doc, y, 15);
      // Work item title
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...NAVY);
      doc.text(`${wi.code}  |  ${wi.title}`, 14, y);
      y += 5;

      for (const b of wi.bullets) {
        y = checkPageBreak(doc, y, 8);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text("•", 16, y);
        const lines = doc.splitTextToSize(b, 174);
        doc.text(lines, 20, y);
        y += lines.length * 4.5;
      }
      y += 3;
    }
    y += 2;
  }

  // Payment Schedule
  y = checkPageBreak(doc, y, 60);
  y = addSectionHeader(doc, "💰  Payment Schedule", y);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("All payments are due upon reaching the stated milestone unless otherwise agreed in writing.", 14, y);
  y += 8;

  const payRows = [
    ["Deposit", "—", fmt(pay.deposit), "Due at contract signing"],
    ["Payment 1", "50%", fmt(pay.p1), "Due when work begins / mobilization"],
    ["Payment 2", "25%", fmt(pay.p2), "Due after 60% of work is completed"],
    ["Payment 3", "15%", fmt(pay.p3), "Due after 90% of work is completed"],
    ["Final Payment", "10%", fmt(pay.p4), "Due after final walk-through & approval"],
    ["TOTAL CONTRACT", "100%", fmt(contractTotal), "Labor & Materials — All Inclusive"],
  ];

  for (const [milestone, pct, amount, when] of payRows) {
    y = checkPageBreak(doc, y, 8);
    const isTotal = milestone === "TOTAL CONTRACT";
    if (isTotal) {
      doc.setFillColor(...DARK);
      doc.rect(10, y - 4, 190, 8, "F");
    }
    doc.setFontSize(9);
    doc.setFont("helvetica", isTotal ? "bold" : "normal");
    doc.setTextColor(isTotal ? 255 : 31, isTotal ? 255 : 78, isTotal ? 255 : 121);
    doc.text(`•  ${milestone}`, 14, y);
    doc.setTextColor(isTotal ? 255 : 26, isTotal ? 165 : 26, isTotal ? 0 : 26);
    doc.text(`${pct}  —  ${amount}`, 80, y);
    doc.setTextColor(isTotal ? 200 : 100, isTotal ? 200 : 100, isTotal ? 200 : 100);
    doc.text(when, 130, y);
    y += 7;
  }
  y += 4;

  // General Conditions
  y = checkPageBreak(doc, y, 30);
  y = addSectionHeader(doc, "📄  General Conditions", y);
  const gc = [
    "All work shall be performed in a professional and workmanlike manner in accordance with industry standards and applicable local building codes.",
    "607 The Home Improvement CCS Group carries full general liability insurance. Proof of insurance is available upon request.",
    "Any changes to the scope of work must be agreed upon in writing via a signed Change Order before additional work begins.",
    "The contractor is not responsible for pre-existing conditions, hidden defects, code violations, or structural issues discovered during the course of work.",
    "The customer is responsible for clearing and providing access to all work areas prior to the scheduled start date.",
    "607 The Home Improvement CCS Group will remove all project-related debris upon project completion.",
    "The contractor reserves the right to substitute materials of equal or greater quality if specified products are unavailable.",
    "Project timeline is an estimate and subject to change due to material availability, weather, or unforeseen site conditions.",
    "This contract constitutes the entire agreement between both parties. No verbal agreements are binding.",
    "All permits required for this scope of work are the responsibility of the contractor unless otherwise noted in writing.",
    "Final payment authorizes project close-out. Withholding final payment without documented written cause is not permitted.",
  ];
  for (const item of gc) {
    y = checkPageBreak(doc, y, 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text("•", 14, y);
    const lines = doc.splitTextToSize(item, 178);
    doc.text(lines, 18, y);
    y += lines.length * 4.5;
  }
  y += 4;

  // Disclaimer
  y = checkPageBreak(doc, y, 30);
  y = addSectionHeader(doc, "⚠️  Disclaimer", y);
  const stdDisclaimers = [
    "607 The Home Improvement CCS Group provides labor and installation services as described in this scope of work. This contract does not include services or costs not explicitly listed herein.",
    "Warranty: All labor performed under this contract is warranted for 1 year from final project completion, covering defects in workmanship only.",
    "Dispute Resolution: Any disputes shall first be addressed through good-faith negotiation, then mediation before any legal action is taken.",
    "By signing below, both parties confirm they have read, understood, and agreed to all terms, conditions, and the full scope of work.",
  ];
  const allDisclaimers = [...project.job_specific_disclaimers, ...stdDisclaimers];
  for (const item of allDisclaimers) {
    y = checkPageBreak(doc, y, 8);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    doc.text("•", 14, y);
    const lines = doc.splitTextToSize(item, 178);
    doc.text(lines, 18, y);
    y += lines.length * 4.5;
  }
  y += 8;

  // Signature Block
  y = checkPageBreak(doc, y, 35);
  y = addSectionHeader(doc, "✍️  Authorization & Signatures", y);
  y += 4;
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("CUSTOMER SIGNATURE", 14, y);
  doc.text("CONTRACTOR SIGNATURE", 110, y);
  y += 12;
  doc.setDrawColor(...DARK);
  doc.line(14, y, 95, y);
  doc.line(110, y, 200, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.text(project.customer_name, 14, y);
  doc.text("607 The Home Improvement CCS Group", 110, y);
  y += 8;
  doc.text("Date: _____________________________", 14, y);
  doc.text("Date: _____________________________", 110, y);

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "italic");
  doc.text(
    "607 The Home Improvement CCS Group  |  Professional Home Improvement Services",
    105,
    285,
    { align: "center" },
  );

  doc.save(
    `${project.customer_name.replace(/\s+/g, "-")}_Contract_607CCS.pdf`,
  );
}

// ── DOCUMENT 2: Private Materials List ────────────────────────────────────────
function generateMaterialsPDF(project: Project) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = addLetterhead(doc, project, "PRIVATE MATERIALS LIST — FOR OFFICE USE ONLY");

  // Confidential banner
  doc.setFillColor(...DARK);
  doc.rect(0, y - 4, 220, 8, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 215, 0);
  doc.text("⚠️  CONFIDENTIAL — DO NOT SHARE WITH CUSTOMER", 105, y + 1, { align: "center" });
  y += 10;

  // Note
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...ORANGE);
  doc.text(
    "All quantities include a 15% overage buffer for waste, cuts, and adjustments. Prices sourced from Home Depot.",
    14,
    y,
  );
  y += 8;

  for (const section of project.materials_sections) {
    y = checkPageBreak(doc, y, 30);
    y = addSectionHeader(doc, `🛒  ${section.section_title}`, y);

    // Subtitle
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(80, 80, 80);
    const subLines = doc.splitTextToSize(section.section_subtitle, 186);
    doc.text(subLines, 14, y);
    y += subLines.length * 4 + 2;

    // Table
    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      head: [["Item Description", "Qty (+15%)", "Unit", "Unit Price", "Total", "Home Depot"]],
      body: section.items.map((item) => [
        item.tbd_note ? `${item.item}\n⚠ ${item.tbd_note}` : item.item,
        String(item.qty_buffered),
        item.unit,
        fmt(item.unit_cost),
        fmt(item.total),
        item.hd_link,
      ]),
      foot: [["Section Subtotal", "", "", "", fmt(section.section_total), ""]],
      headStyles: {
        fillColor: NAVY,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 7.5,
      },
      footStyles: {
        fillColor: DARK,
        textColor: WHITE,
        fontStyle: "bold",
        fontSize: 8,
      },
      bodyStyles: { fontSize: 7.5 },
      alternateRowStyles: { fillColor: [243, 247, 251] },
      columnStyles: {
        0: { cellWidth: 52 },
        1: { cellWidth: 16, halign: "center" },
        2: { cellWidth: 12, halign: "center" },
        3: { cellWidth: 20, halign: "right" },
        4: { cellWidth: 20, halign: "right", fillColor: LIGHT_BLUE, textColor: NAVY, fontStyle: "bold" },
        5: { cellWidth: 48, fontSize: 6, textColor: [5, 99, 193] },
      },
      didParseCell: (data) => {
        if (data.cell.raw && String(data.cell.raw).includes("⚠")) {
          data.cell.styles.textColor = ORANGE as [number, number, number];
          data.cell.styles.fontStyle = "italic";
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;
  }

  // Grand total
  y = checkPageBreak(doc, y, 16);
  autoTable(doc, {
    startY: y,
    margin: { left: 10, right: 10 },
    body: [["🧾  ESTIMATED MATERIALS GRAND TOTAL (All Sections + 15% Buffer)", fmt(project.materials_grand_total)]],
    bodyStyles: {
      fillColor: DARK,
      textColor: WHITE,
      fontStyle: "bold",
      fontSize: 10,
    },
    columnStyles: {
      0: { cellWidth: 150, halign: "right" },
      1: { cellWidth: 40, halign: "right", fillColor: ORANGE, textColor: WHITE },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...ORANGE);
  doc.text(
    "* Add your labor markup and profit margin to arrive at the final customer quote price.",
    14,
    y,
  );

  doc.save(
    `${project.customer_name.replace(/\s+/g, "-")}_Materials_CONFIDENTIAL_607CCS.pdf`,
  );
}

// ── DOCUMENT 3: Quick Crew Punchlist ─────────────────────────────────────────
function generatePunchlistPDF(project: Project) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Simple clean header
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 220, 20, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 20, 220, 2, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text("607 THE HOME IMPROVEMENT CCS GROUP", 105, 10, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("CREW PUNCHLIST", 105, 17, { align: "center" });

  let y = 30;

  // Customer info block
  doc.setFillColor(...LIGHT_BLUE);
  doc.rect(10, y, 190, 26, "F");
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text(project.customer_name, 16, y + 9);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK);
  doc.text(project.project_address, 16, y + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ORANGE);
  doc.text(project.project_title, 16, y + 22);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(
    `Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    150,
    y + 9,
  );
  y += 34;

  // Divider
  doc.setFillColor(...ORANGE);
  doc.rect(10, y, 190, 1.5, "F");
  y += 8;

  // Punchlist items
  doc.setFontSize(12);
  for (const item of project.punchlist_items) {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    // Checkbox
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.5);
    doc.rect(14, y - 4.5, 5, 5);
    // Text
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(item, 164);
    doc.text(lines, 22, y);
    y += lines.length * 6.5 + 2;
  }

  // Footer
  y += 10;
  if (y < 260) {
    doc.setFillColor(...GRAY);
    doc.rect(10, y, 190, 16, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text("Crew Supervisor Sign-off:", 16, y + 7);
    doc.setDrawColor(...DARK);
    doc.line(70, y + 7, 140, y + 7);
    doc.text("Date:", 148, y + 7);
    doc.line(158, y + 7, 196, y + 7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(7);
    doc.text("607 The Home Improvement CCS Group — Internal Use Only", 105, y + 13, { align: "center" });
  }

  doc.save(
    `${project.customer_name.replace(/\s+/g, "-")}_Punchlist_607CCS.pdf`,
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function EstimatePage() {
  const [messages, setMessages] = useState<Msg[]>([INITIAL]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [contractTotal, setContractTotal] = useState("");
  const [deposit, setDeposit] = useState("1000");
  const [priceStep, setPriceStep] = useState(false);
  const [activeDoc, setActiveDoc] = useState<"contract" | "materials" | "punchlist">("contract");
  const scrollRef = useRef<HTMLDivElement>(null);
  const estimateRef = useRef<HTMLDivElement>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pulseDownloads, setPulseDownloads] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading, project]);

  // Detect if the AI is generating the final estimate (after user confirmation)
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const isGeneratingEstimate = loading && !!lastUserMsg && isConfirmation(lastUserMsg.content);
  const currentStep = computeStep(messages, !!project);
  const userHasSent = messages.some((m) => m.role === "user");

  // Estimate ready celebration
  useEffect(() => {
    if (!project) return;
    setShowCelebration(true);
    setPulseDownloads(true);
    const t1 = setTimeout(() => {
      setShowCelebration(false);
      estimateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 1500);
    const t2 = setTimeout(() => setPulseDownloads(false), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [project]);

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
      if (data?.project) {
        setProject(data.project);
        setPriceStep(true);
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content:
              data.content ||
              "✅ I've gathered all the project details! Your materials list, scope of work, and punchlist are ready. Review the materials cost below, then enter your total contract price to generate all 3 documents.",
          },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: data?.content ?? "Sorry, something went wrong. Please try again." },
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

  const totalNum = parseFloat(contractTotal.replace(/[^0-9.]/g, "")) || 0;
  const depositNum = parseFloat(deposit.replace(/[^0-9.]/g, "")) || 0;
  const pay = totalNum > 0 ? calcPayments(totalNum, depositNum) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/70 border-b border-border">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Logo />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-orange transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pt-24 pb-16">
        {/* Title */}
        <div className="text-center mb-8">
          <p className="text-orange font-bold uppercase tracking-widest text-xs mb-2">
            AI Project Builder
          </p>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
            Build Your <span className="text-gradient-orange">Scope of Work</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-lg mx-auto">
            Describe the project and I'll generate your contract, materials list, and crew punchlist instantly.
          </p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps current={currentStep} />

        {/* Chat Window */}
        <div className="rounded-2xl border border-orange/30 bg-card shadow-orange overflow-hidden flex flex-col h-[55vh] mb-8">
          <div className="border-b border-border px-5 py-3 bg-secondary/30 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-orange animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground">
              Masmer AI — Project Assistant
            </span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gradient-orange text-background font-medium"
                      : "bg-secondary/60 border border-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <TypingIndicator generating={isGeneratingEstimate} />
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="border-t border-border p-3 flex gap-2 bg-secondary/30"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={project ? "Ask a follow-up question…" : "Describe your project…"}
              disabled={loading}
              className="flex-1 rounded-md bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-orange/60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-md bg-gradient-orange px-4 py-2.5 text-sm font-bold text-background disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Send
            </button>
          </form>
        </div>

        {/* Quick start prompts (before first user message) */}
        {!userHasSent && !project && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8 -mt-4">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setInput(p.text)}
                className="text-left rounded-xl border border-border border-l-4 border-l-orange/70 bg-card hover:shadow-orange hover:border-orange/60 transition-all p-4 cursor-pointer"
              >
                <p className="font-bold text-sm">{p.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5" style={{ fontWeight: 400 }}>
                  {p.subtitle}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* Celebration overlay */}
        {showCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm pointer-events-none">
            <div className="relative flex flex-col items-center gap-4">
              <Confetti />
              <div className="check-pop h-20 w-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <Check className="h-10 w-10 text-green-400" strokeWidth={3} />
              </div>
              <p className="font-display text-2xl font-bold text-foreground animate-fade-in">
                Estimate Ready! 🎉
              </p>
            </div>
          </div>
        )}

        {/* Materials Summary (shown after project generated) */}
        {project && (
          <div ref={estimateRef} className="space-y-6 slide-up-fade">
            {/* Materials Cost Card */}
            <div className="rounded-2xl border border-orange/30 bg-card shadow-orange overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-orange" />
                  <div>
                    <p className="font-bold">Materials Estimate</p>
                    <p className="text-xs text-muted-foreground">
                      Private — office use only • includes 15% buffer
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Est. Materials Total</p>
                  <p className="text-2xl font-black text-gradient-orange">
                    {fmt(project.materials_grand_total)}
                  </p>
                </div>
              </div>

              {/* Materials sections preview */}
              <div className="divide-y divide-border">
                {project.materials_sections.map((sec, si) => (
                  <div key={si} className="p-4">
                    <p className="text-xs font-bold text-orange uppercase tracking-wider mb-2">
                      {sec.section_title}
                    </p>
                    <div className="space-y-1">
                      {sec.items.map((item, ii) => (
                        <div
                          key={ii}
                          className="grid grid-cols-12 gap-2 text-xs py-1 border-b border-border/40 last:border-0"
                        >
                          <span className="col-span-5 text-foreground">
                            {item.item}
                            {item.tbd_note && (
                              <span className="ml-1 text-orange-400 flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />
                                TBD
                              </span>
                            )}
                          </span>
                          <span className="col-span-2 text-muted-foreground text-center">
                            {item.qty_buffered} {item.unit}
                          </span>
                          <span className="col-span-2 text-right text-muted-foreground">
                            {fmt(item.unit_cost)}
                          </span>
                          <span className="col-span-2 text-right font-semibold text-foreground">
                            {fmt(item.total)}
                          </span>
                          <a
                            href={item.hd_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="col-span-1 flex items-center justify-end text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <span className="text-xs font-bold text-orange">
                        Section Total: {fmt(sec.section_total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Entry */}
            {priceStep && (
              <div className="rounded-2xl border border-orange/40 bg-card shadow-orange p-6">
                <h3 className="font-bold text-lg mb-1">Enter Your Contract Price</h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Materials estimate: <strong className="text-orange">{fmt(project.materials_grand_total)}</strong>.
                  Add your labor, markup, and profit margin, then enter the total below.
                </p>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Total Contract Price
                    </label>
                    <input
                      type="text"
                      value={contractTotal}
                      onChange={(e) => setContractTotal(e.target.value)}
                      placeholder="e.g. 24,500"
                      className="w-full rounded-md border border-orange/40 bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:border-orange"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Deposit Amount
                    </label>
                    <input
                      type="text"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="e.g. 1000"
                      className="w-full rounded-md border border-border bg-background px-4 py-3 text-lg font-bold focus:outline-none focus:border-orange"
                    />
                  </div>
                </div>

                {/* Payment Schedule Preview */}
                {pay && (
                  <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
                    <p className="text-xs font-bold text-orange uppercase tracking-wider mb-3">
                      Payment Schedule Preview
                    </p>
                    <div className="space-y-2 text-sm">
                      {[
                        { label: "Deposit", amount: pay.deposit, when: "At contract signing" },
                        { label: "Payment 1 (50%)", amount: pay.p1, when: "When work begins" },
                        { label: "Payment 2 (25%)", amount: pay.p2, when: "After 60% completed" },
                        { label: "Payment 3 (15%)", amount: pay.p3, when: "After 90% completed" },
                        { label: "Final (10%)", amount: pay.p4, when: "After walk-through" },
                      ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="font-bold text-orange">• {p.label}</span>
                          <span className="font-bold">{fmt(p.amount)}</span>
                          <span className="text-muted-foreground text-xs">{p.when}</span>
                        </div>
                      ))}
                      <div className="border-t border-border pt-2 flex items-center justify-between font-black">
                        <span>Total</span>
                        <span className="text-gradient-orange">{fmt(totalNum)}</span>
                        <span className="text-muted-foreground text-xs">Labor & Materials</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Download Buttons */}
                {totalNum > 0 && (
                  <div className={`space-y-3 ${pulseDownloads ? "btn-pulse-once" : ""}`}>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                      Download Your Documents
                    </p>
                    <div className="grid sm:grid-cols-3 gap-3">
                      <button
                        onClick={() => generateContractPDF(project, totalNum, depositNum)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-orange/40 bg-gradient-orange p-4 text-background font-bold hover:scale-[1.02] transition-transform"
                      >
                        <FileText className="h-6 w-6" />
                        <span className="text-sm">Scope of Work</span>
                        <span className="text-xs font-normal opacity-80">Full Contract PDF</span>
                      </button>
                      <button
                        onClick={() => generateMaterialsPDF(project)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-foreground font-bold hover:border-orange/40 transition-colors"
                      >
                        <ShoppingCart className="h-6 w-6 text-orange" />
                        <span className="text-sm">Materials List</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          Confidential • Office Only
                        </span>
                      </button>
                      <button
                        onClick={() => generatePunchlistPDF(project)}
                        className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-foreground font-bold hover:border-orange/40 transition-colors"
                      >
                        <ClipboardList className="h-6 w-6 text-orange" />
                        <span className="text-sm">Crew Punchlist</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          Simple field sheet
                        </span>
                      </button>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <button
                        onClick={() => {
                          generateContractPDF(project, totalNum, depositNum);
                          setTimeout(() => generateMaterialsPDF(project), 500);
                          setTimeout(() => generatePunchlistPDF(project), 1000);
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-6 py-3.5 text-sm font-bold text-background shadow-orange hover:scale-[1.01] transition-transform"
                      >
                        <Download className="h-4 w-4" />
                        Download All 3 Documents
                      </button>
                    </div>

                    <div className="mt-2">
                      <button
                        disabled={saving || saved}
                        onClick={async () => {
                          if (saving || saved) return;
                          setSaving(true);
                          const scopeText = project.scope_sections
                            .map((s) =>
                              `${s.section_label}\n` +
                                s.work_items
                                  .map((w) =>
                                    `  ${w.code ? `[${w.code}] ` : ""}${w.title}` +
                                    (w.bullets?.length ? `\n` + w.bullets.map((b) => `    - ${b}`).join("\n") : "")
                                  )
                                  .join("\n")
                            )
                            .join("\n\n");
                          const { data, error } = await supabase
                            .from("projects")
                            .insert({
                              customer_name: project.customer_name,
                              customer_address: project.project_address,
                              project_title: project.project_title,
                              contract_total: totalNum,
                              deposit: depositNum,
                              status: "new",
                              progress_pct: 0,
                              deposit_paid: false,
                              payment1_paid: false,
                              payment2_paid: false,
                              payment3_paid: false,
                              final_paid: false,
                              punchlist_items: project.punchlist_items,
                              scope_of_work: scopeText,
                            })
                            .select("id")
                            .single();
                          setSaving(false);
                          if (error || !data) {
                            toast.error("Failed to save project");
                            return;
                          }
                          setSaved(true);
                          toast.success("Saved to Projects CRM");
                          setTimeout(() => {
                            navigate({ to: "/projects/$id", params: { id: data.id } });
                          }, 700);
                        }}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-md border bg-card px-6 py-3.5 text-sm font-bold transition-colors ${
                          saved
                            ? "border-green-500/60 text-green-500"
                            : "border-orange/60 text-orange hover:bg-orange/10"
                        }`}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : saved ? (
                          <>
                            <Check className="h-4 w-4" />
                            Saved!
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4" />
                            Save to Projects CRM
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-xs text-center text-muted-foreground">
                        Saves customer, scope, punchlist & payment schedule to your dashboard.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Punchlist Preview */}
            {project.punchlist_items.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="h-5 w-5 text-orange" />
                  <p className="font-bold">Quick Crew Punchlist Preview</p>
                </div>
                <div className="space-y-2">
                  {project.punchlist_items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <div className="mt-0.5 h-4 w-4 rounded border border-orange/60 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
