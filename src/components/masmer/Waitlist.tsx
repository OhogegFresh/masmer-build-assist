import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "./Reveal";
import { CheckCircle2, Loader2, Mail, Phone } from "lucide-react";

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  business_name: z.string().trim().min(2, "Enter your business").max(120),
  phone: z.string().trim().min(7, "Enter a valid phone").max(30),
  email: z.string().trim().email("Invalid email").max(160),
  contractor_type: z.string().min(1, "Select a type"),
  feature_interest: z.string().min(1, "Select a feature"),
});

const contractorTypes = [
  "General Contractor",
  "HVAC",
  "Plumber",
  "Roofer",
  "Electrician",
  "Painter",
  "Flooring",
  "Drywall",
  "Other",
];

const featureInterests = [
  "AI Receptionist",
  "AI Estimating Bot",
  "Lead Follow-Up",
  "All of the Above",
];

const fieldClass =
  "w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/40 transition-colors";

export function Waitlist() {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ email: string; phone: string } | null>(
    null,
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your inputs.");
      return;
    }
    setSubmitting(true);
    const { data: inserted, error: dbError } = await supabase
      .from("waitlist_signups")
      .insert(parsed.data)
      .select("email, phone")
      .single();
    setSubmitting(false);
    if (dbError) {
      setError("Something went wrong. Please try again.");
      toast.error("Submission failed. Please try again.");
      return;
    }
    setSaved({ email: inserted?.email ?? parsed.data.email, phone: inserted?.phone ?? parsed.data.phone });
    toast.success("You're on the waitlist!", {
      description: `Saved ${inserted?.email ?? parsed.data.email}`,
    });
    setDone(true);
  }

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-3xl px-6">
        <Reveal>
          <div className="text-center mb-10">
            <p className="text-gold font-bold uppercase tracking-widest text-xs mb-3">
              Founding Members
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              Be One of the First{" "}
              <span className="text-gradient-gold">10 Contractors</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get your first month free and lock in founding member pricing.
            </p>
          </div>
        </Reveal>
        <Reveal>
          {done && saved ? (
            <div className="rounded-2xl border border-gold/40 bg-card p-10 text-center shadow-gold">
              <CheckCircle2 className="mx-auto h-12 w-12 text-gold" />
              <h3 className="mt-4 text-2xl font-black">You're on the list.</h3>
              <p className="mt-2 text-muted-foreground">
                We'll reach out within 24 hours to set up your AI agents.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-background/60 p-5 text-left">
                <p className="text-xs uppercase tracking-widest text-gold font-bold mb-3">
                  Saved to our database
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-gold shrink-0" />
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-mono text-foreground break-all">{saved.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-gold shrink-0" />
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-mono text-foreground">{saved.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <input name="full_name" placeholder="Full name" className={fieldClass} />
                <input name="business_name" placeholder="Business name" className={fieldClass} />
                <input name="phone" placeholder="Phone number" className={fieldClass} />
                <input name="email" type="email" placeholder="Email" className={fieldClass} />
                <select name="contractor_type" defaultValue="" className={fieldClass}>
                  <option value="" disabled>
                    Type of contractor
                  </option>
                  {contractorTypes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select name="feature_interest" defaultValue="" className={fieldClass}>
                  <option value="" disabled>
                    Most interested in
                  </option>
                  {featureInterests.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-gold px-6 py-4 text-sm font-black text-background shadow-gold hover:scale-[1.01] transition-transform disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Submitting..." : "Claim My Spot"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                We'll never share your info. By submitting you agree to be
                contacted about Masmer AI.
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}