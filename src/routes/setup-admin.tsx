import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/masmer/Logo";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/setup-admin")({
  head: () => ({ meta: [{ title: "Admin Setup — Masmer AI" }, { name: "robots", content: "noindex" }] }),
  component: SetupAdminPage,
});

function SetupAdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("setup-admin", {
          body: { check: true },
          method: "GET" as any,
        });
        if (error) throw error;
        setAdminExists(!!(data as any)?.adminExists);
      } catch (e) {
        console.error(e);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("setup-admin", {
      body: { password },
    });
    setSubmitting(false);
    if (error || (data as any)?.error) {
      return toast.error((data as any)?.error || error?.message || "Setup failed");
    }
    toast.success("Admin account created");
    navigate({ to: "/login", search: { team: "true" } as any });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[460px]">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-center inline-flex items-center justify-center gap-2 w-full">
            <ShieldCheck className="h-6 w-6 text-orange" />
            Admin Setup
          </h1>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            One-time bootstrap for the founder account
          </p>

          {checking && (
            <div className="mt-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Checking status…
            </div>
          )}

          {!checking && adminExists && (
            <div className="mt-6 space-y-4">
              <div className="rounded-md border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground inline-flex items-center gap-2">
                <Lock className="h-4 w-4 text-orange" />
                An admin account already exists. This setup is disabled.
              </div>
              <Link to="/login" search={{ team: "true" } as any}
                className="block w-full text-center rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 transition">
                Go to Team Login
              </Link>
            </div>
          )}

          {!checking && !adminExists && (
            <form onSubmit={onSubmit} className="mt-6 space-y-3">
              <div className="rounded-md border border-orange/30 bg-orange/5 px-3 py-2 text-xs text-muted-foreground">
                Will create: <span className="text-foreground font-medium">jacob@casacapsolutions.com</span>
              </div>
              <input type="password" required minLength={8} placeholder="Password (min 8 chars)"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40" />
              <input type="password" required minLength={8} placeholder="Confirm password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40" />
              <button type="submit" disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Admin Account
              </button>
            </form>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-orange">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}