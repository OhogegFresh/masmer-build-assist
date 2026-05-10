import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Logo } from "@/components/masmer/Logo";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set new password — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-[400px]">
        <div className="flex justify-center mb-8"><Logo /></div>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-center">
            Set new password
          </h1>
          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            <input
              type="password" required minLength={8} placeholder="New password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <input
              type="password" required minLength={8} placeholder="Confirm password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-border bg-background/60 px-4 py-3 text-sm focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/40"
            />
            <button type="submit" disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-orange px-6 py-3 text-sm font-bold text-white hover:bg-orange/90 disabled:opacity-60 transition">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update Password
            </button>
          </form>
          <p className="mt-6 text-xs text-center text-muted-foreground">
            <Link to="/login" className="text-orange hover:underline">← Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
