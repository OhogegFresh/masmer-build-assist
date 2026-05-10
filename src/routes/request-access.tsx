import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/masmer/Logo";

export const Route = createFileRoute("/request-access")({
  head: () => ({
    meta: [
      { title: "Request Access — Masmer AI" },
      { name: "description", content: "Request access to Masmer AI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: RequestAccessPage,
});

const BUSINESS_TYPES = [
  "General Contractor", "Home Improvement", "Roofing", "Plumbing",
  "Electrical", "HVAC", "Landscaping", "Other",
];
const REFERRAL_SOURCES = ["Friend/Referral", "Google", "Social Media", "Other"];

function RequestAccessPage() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", business_name: "",
    business_type: BUSINESS_TYPES[0], referral_source: REFERRAL_SOURCES[0], message: "",
  });

  function set<K extends keyof typeof form>(k: K, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await (supabase as any).from("access_requests").insert(form);
    if (error) {
      setLoading(false);
      return toast.error("Failed to submit. Please try again.");
    }
    try {
      await supabase.functions.invoke("send-access-request-email", { body: form });
    } catch (err) {
      console.warn("email notify failed", err);
    }
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-[480px] rounded-2xl border border-border bg-card p-10 text-center">
          <CheckCircle2 className="mx-auto h-14 w-14 text-orange" />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">Request received! 🎉</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            We'll review your request and get back to you within 24 hours.
          </p>
          <button onClick={() => navigate({ to: "/" })}
            className="mt-8 inline-flex items-center justify-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 transition">
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[480px]">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight">Request Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">Tell us about your business and we'll get back to you within 24 hours.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input required placeholder="Full Name *" value={form.full_name}
              onChange={(e) => set("full_name", e.target.value)} className={inputCls} />
            <input required type="email" placeholder="Email *" value={form.email}
              onChange={(e) => set("email", e.target.value)} className={inputCls} />
            <input required type="tel" placeholder="Phone number *" value={form.phone}
              onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            <input required placeholder="Business name *" value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)} className={inputCls} />
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Type of business</label>
              <select value={form.business_type} onChange={(e) => set("business_type", e.target.value)} className={inputCls}>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">How did you hear about us?</label>
              <select value={form.referral_source} onChange={(e) => set("referral_source", e.target.value)} className={inputCls}>
                {REFERRAL_SOURCES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <textarea placeholder="Tell us about your business" value={form.message}
              onChange={(e) => set("message", e.target.value)} rows={4}
              className={inputCls + " resize-none"} />
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Request Access →
            </button>
          </form>
        </div>
        <div className="mt-4 text-center">
          <Link to="/login" className="text-xs text-muted-foreground hover:text-orange">← Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}