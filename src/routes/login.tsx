import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Masmer AI" },
      { name: "description", content: "Sign in to manage Masmer AI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Signed in");
      navigate({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) return toast.error(error.message);
      toast.success("Account created. Check your email to confirm.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-card">
        <Link to="/" className="text-xs text-muted-foreground hover:text-orange">
          ← Back to site
        </Link>
        <h1 className="mt-4 text-3xl font-black tracking-tighter">
          {mode === "signin" ? "Admin Sign In" : "Create Account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to view waitlist signups."
            : "Create an account, then have an admin grant you access."}
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-gradient-orange px-6 py-3 text-sm font-black text-background shadow-orange disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-xs text-muted-foreground hover:text-orange"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have one? Sign in"}
        </button>
      </div>
    </div>
  );
}