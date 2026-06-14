import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/masmer/AuthContext";
import { Reveal } from "./Reveal";
import { Loader2 } from "lucide-react";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your name").max(120),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be 8+ characters").max(128),
});

export function Waitlist() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setSubmitting(true);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { data, error: signErr } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: { data: { full_name: parsed.data.fullName }, emailRedirectTo: redirectUrl },
      });
      if (signErr) throw signErr;

      if (data.user) {
        await (supabase as any).from("app_users").insert({
          email: parsed.data.email,
          full_name: parsed.data.fullName,
          role: "user",
          is_active: true,
          user_id: data.user.id,
        });
      }

      supabase.functions.invoke("send-welcome-email", {
        body: { email: parsed.data.email, full_name: parsed.data.fullName, source: "landing_signup" },
      }).catch((err) => console.error("welcome email failed", err));

      if (data.session) {
        await refresh();
        toast.success("Welcome to Masmer!");
        navigate({ to: "/dashboard" });
      } else {
        toast.success("Check your email to confirm your account");
        navigate({ to: "/login" });
      }
    } catch (err) {
      const msg = (err as Error).message || "Could not create account";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="contact" className="py-24 md:py-32 border-t border-border bg-secondary">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tighter">
              Start using Masmer <span className="text-gradient-orange">Free</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Instant access. No credit card required.
            </p>
          </div>
        </Reveal>
        <Reveal>
          <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-8 shadow-card space-y-4">
            <input
              type="text" required placeholder="Full name"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-5 py-4 text-base focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40 transition-colors"
            />
            <input
              type="email" required placeholder="you@yourbusiness.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-5 py-4 text-base focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40 transition-colors"
            />
            <input
              type="password" required minLength={8} placeholder="Create a password (8+ characters)"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-5 py-4 text-base focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40 transition-colors"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit" disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-4 text-base font-bold text-white hover:bg-orange/90 transition disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Creating account..." : "Create Free Account →"}
            </button>
            <p className="text-xs text-muted-foreground text-center">
              By signing up you agree to our Privacy Policy and Terms of Service
            </p>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
