import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/masmer/Logo";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ForgotPage,
});

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Check your email for the reset link");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-center">
            Reset password
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            We'll send you a link to set a new password.
          </p>
          {sent ? (
            <p className="mt-6 text-sm text-center text-muted-foreground">
              Check <span className="text-foreground font-semibold">{email}</span> for the reset link.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <input
                type="email" required placeholder="Your email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
              <button type="submit" disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          )}
          <p className="mt-6 text-xs text-center text-muted-foreground">
            <Link to="/login" className="text-orange hover:underline">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
