import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/masmer/AuthContext";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/masmer/Logo";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Masmer AI" },
      { name: "description", content: "Sign in to your free Masmer AI account." },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    suspended: s.suspended === "1" ? "1" : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      return toast.error("Password didn't match. Use Forgot password or create a new free account.");
    }
    await refresh();
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          {search.suspended && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Your account has been suspended. Contact us for help.
            </div>
          )}
          <h1 className="font-display text-3xl font-bold tracking-tight text-center">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Sign in to your Masmer AI account
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="email" required placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <div className="relative">
              <input
                type={show ? "text" : "password"} required minLength={6} placeholder="Password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background/60 px-4 py-3 pr-11 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
              />
              <button type="button" onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="mt-3 text-center">
            <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-orange">
              Forgot password?
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Link to="/signup"
            className="block w-full text-center rounded-md border border-border px-6 py-3 text-sm font-medium text-foreground hover:border-orange/40 hover:text-orange transition">
            Create free account →
          </Link>

          <p className="mt-6 text-[11px] text-center text-muted-foreground">
            Free to use • No credit card required
          </p>
          <p className="mt-1 text-[11px] text-center text-muted-foreground">
            Questions? <a href="mailto:jacob@casacapsolutions.com" className="text-orange hover:underline">jacob@casacapsolutions.com</a>
          </p>
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-orange">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}
