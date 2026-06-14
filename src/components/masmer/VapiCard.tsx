import { Phone, Clock } from "lucide-react";

export const VAPI_PHONE_DISPLAY = "(607) 698-8129";
export const VAPI_PHONE_TEL = "+16076988129";
export const VAPI_PHONE_FULL = "+1 (607) 698-8129";

export function VapiCard() {
  return (
    <div className="rounded-xl border-2 border-orange/60 bg-card p-6 md:p-8 shadow-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange/15 border border-orange/40 text-orange px-2.5 py-1 text-xs font-semibold uppercase tracking-wider">
          <Phone className="h-3 w-3" /> Live Demo
        </span>
      </div>
      <h2 className="font-display text-2xl md:text-3xl font-bold">
        Try Our AI Receptionist Live
      </h2>
      <p className="mt-3 text-muted-foreground max-w-2xl">
        Call our AI receptionist right now and experience how Masmer answers calls,
        qualifies leads, and books appointments — 24/7 automatically.
      </p>
      <a
        href={`tel:${VAPI_PHONE_TEL}`}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-orange px-6 py-4 text-lg font-bold text-white shadow-orange hover:scale-[1.02] transition-transform"
      >
        <Phone className="h-5 w-5" />
        Call Now — {VAPI_PHONE_DISPLAY}
      </a>
      <p className="mt-3 text-sm text-muted-foreground">
        or dial directly: <span className="text-foreground font-mono">{VAPI_PHONE_FULL}</span>
      </p>
      <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="h-3 w-3" />
        Average call: 2-3 minutes • AI answers instantly • No hold time
      </p>
    </div>
  );
}
