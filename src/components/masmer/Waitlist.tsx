import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Reveal } from "./Reveal";
import { CheckCircle2, Loader2 } from "lucide-react";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

export function Waitlist() {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    if (!consent) {
      setError("Please agree to receive updates to continue");
      return;
    }
    setSubmitting(true);
    const { error: dbError } = await supabase.from("waitlist_signups").insert({
      email: parsed.data,
      marketing_consent: true,
      consent_timestamp: new Date().toISOString(),
      source: "landing_page_demo",
    } as any);
    if (dbError) {
      setSubmitting(false);
      setError("Something went wrong. Please try again.");
      toast.error("Submission failed");
      return;
    }
    // Trigger welcome email + auto-create demo account
    supabase.functions
      .invoke("send-welcome-email", {
        body: { email: parsed.data, source: "landing_page_demo" },
      })
      .catch((e) => console.error("welcome email failed", e));

    setSubmitting(false);
    setDone(parsed.data);
    toast.success("Check your email!");
  }

  return (
    <section
      id="contact"
      className="py-24 md:py-32 border-t border-border bg-secondary"
    >
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">
              Try Masmer AI <span className="text-gradient-orange">Free</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Get instant demo access — no credit card required
            </p>
          </div>
        </Reveal>
        <Reveal>
          {done ? (
            <div className="rounded-2xl border border-orange/40 bg-card p-10 text-center shadow-orange animate-in fade-in zoom-in-95 duration-500">
              <div className="mx-auto h-16 w-16 rounded-full bg-green-500/15 border-2 border-green-500 flex items-center justify-center animate-in zoom-in-50 duration-500">
                <CheckCircle2 className="h-9 w-9 text-green-500" strokeWidth={2.5} />
              </div>
              <h3 className="font-display mt-5 text-2xl font-bold">
                Check your email! 📬
              </h3>
              <p className="mt-3 text-muted-foreground">
                We sent your demo access link to{" "}
                <span className="text-foreground font-semibold break-all">{done}</span>
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Didn't get it? Check your spam folder.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Usually arrives within 2 minutes
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-5"
            >
              <div>
                <label htmlFor="demo_email" className="sr-only">
                  Email address
                </label>
                <input
                  id="demo_email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@yourbusiness.com"
                  className="w-full rounded-md border border-border bg-background/60 px-5 py-4 text-base text-foreground placeholder:text-muted-foreground focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40 transition-colors"
                />
              </div>

              <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-orange flex-shrink-0"
                />
                <span>
                  I agree to receive product updates, tips, and news from Masmer AI.
                  You can unsubscribe anytime.
                </span>
              </label>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-4 text-base font-bold text-white hover:bg-orange/90 transition disabled:opacity-60"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {submitting ? "Sending..." : "Get Free Demo Access →"}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting you agree to our Privacy Policy and Terms of Service
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
