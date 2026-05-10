import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/masmer/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/masmer/Logo";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your free account — Masmer AI" },
      { name: "description", content: "Sign up free for Masmer AI. No credit card required." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : undefined;
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: redirectUrl },
      });
      if (error) throw error;

      // Insert app_users row (RLS allows self-insert when role='user' and email matches JWT)
      if (data.user) {
        await (supabase as any).from("app_users").insert({
          email, full_name: fullName, role: "user", is_active: true, user_id: data.user.id,
        });
      }

      // Fire-and-forget welcome email
      supabase.functions.invoke("send-welcome-email", {
        body: { email, full_name: fullName, source: "signup" },
      }).catch((err) => console.error("welcome email failed", err));

      // If session exists (auto-confirm), go straight to dashboard
      if (data.session) {
        await refresh();
        toast.success("Welcome to Masmer AI!");
        navigate({ to: "/dashboard" });
      } else {
        // Email confirmation required
        toast.success("Check your email to confirm your account");
        navigate({ to: "/login" });
      }
    } catch (err) {
      const msg = (err as Error).message || "Could not create account";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-center">
            Create free account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Free for contractors. No credit card required.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="text" required placeholder="Full name"
              value={fullName} onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <input
              type="email" required placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <div className="relative">
              <input
                type={show ? "text" : "password"} required minLength={8} placeholder="Password (8+ characters)"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background/60 px-4 py-3 pr-11 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <input
              type={show ? "text" : "password"} required minLength={8} placeholder="Confirm password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Free Account →
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-orange hover:underline">Sign in</Link>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-orange">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}
