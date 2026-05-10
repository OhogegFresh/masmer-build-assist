import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Logo } from "@/components/masmer/Logo";
import { useDemo, type DemoInvite } from "@/components/masmer/DemoContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Hammer, ShoppingCart, ClipboardList, PhoneCall, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/demo/")({
  head: () => ({
    meta: [
      { title: "Private Demo — Masmer AI" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: DemoLanding,
});

function daysLeft(expires: string) {
  const ms = new Date(expires).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

function DemoLanding() {
  const { code } = Route.useParams();
  const navigate = useNavigate();
  const { activate } = useDemo();
  const [invite, setInvite] = useState<DemoInvite | null>(null);
  const [status, setStatus] = useState<"loading" | "invalid" | "expired" | "ok">("loading");
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from("demo_invites")
        .select("*")
        .eq("invite_code", code)
        .maybeSingle();
      if (cancelled) return;
      const inv = (data as DemoInvite) ?? null;
      if (!inv || !inv.is_active) {
        setStatus("invalid");
        return;
      }
      if (new Date(inv.expires_at) < new Date()) {
        setInvite(inv);
        setStatus("expired");
        return;
      }
      // Track view
      const updates: Record<string, unknown> = {
        page_views: (inv.page_views ?? 0) + 1,
        last_seen: new Date().toISOString(),
      };
      if (!inv.activated_at) updates.activated_at = new Date().toISOString();
      await (supabase as any).from("demo_invites").update(updates).eq("id", inv.id);
      setInvite({ ...inv, ...updates } as DemoInvite);
      setStatus("ok");
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  async function enter() {
    setEntering(true);
    const inv = await activate(code);
    setEntering(false);
    if (!inv) {
      setStatus("expired");
      return;
    }
    navigate({ to: "/dashboard" });
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-orange" />
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <DemoShell>
        <div className="text-center max-w-lg mx-auto py-20">
          <h1 className="font-display text-4xl font-bold">Invalid invite</h1>
          <p className="mt-3 text-muted-foreground">
            This demo link doesn't exist or has been revoked. Reach out to{" "}
            <a className="text-orange underline" href="mailto:jacob@casacapsolutions.com">jacob@casacapsolutions.com</a>{" "}
            for access.
          </p>
        </div>
      </DemoShell>
    );
  }

  if (status === "expired" && invite) {
    return (
      <DemoShell>
        <div className="text-center max-w-lg mx-auto py-20">
          <h1 className="font-display text-4xl font-bold">This demo has expired</h1>
          <p className="mt-3 text-muted-foreground">
            Hi {invite.invitee_name ?? "there"} — your trial window ended on{" "}
            {new Date(invite.expires_at).toLocaleDateString()}. Email{" "}
            <a className="text-orange underline" href="mailto:jacob@casacapsolutions.com">
              jacob@casacapsolutions.com
            </a>{" "}
            to extend your access.
          </p>
        </div>
      </DemoShell>
    );
  }

  if (!invite) return null;

  const days = daysLeft(invite.expires_at);
  const features = [
    { icon: Hammer, title: "Scope of Work Builder", desc: "Build full contracts in minutes" },
    { icon: ShoppingCart, title: "Materials Estimator", desc: "Auto-priced Home Depot lists" },
    { icon: ClipboardList, title: "Crew Punchlist", desc: "Instant field sheets for your crew" },
    { icon: PhoneCall, title: "AI Receptionist", desc: "See how we answer your calls 24/7" },
  ];

  return (
    <DemoShell>
      <div className="max-w-4xl mx-auto py-12 md:py-20">
        <div className="text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
            Welcome, {invite.invitee_name ?? "friend"}! 👋
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            You've been invited to try Masmer AI — the complete AI platform for contractors.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-orange/15 border border-orange/40 text-orange px-4 py-2 text-sm font-semibold">
            <Clock className="h-4 w-4" />
            {days} day{days === 1 ? "" : "s"} remaining
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="h-10 w-10 rounded-lg bg-orange/15 text-orange flex items-center justify-center">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button
            onClick={enter}
            disabled={entering}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-orange px-8 py-4 text-lg font-bold text-white shadow-lg hover:opacity-95 disabled:opacity-60"
          >
            {entering ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Enter Masmer AI <ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>

        <div className="mt-12 text-center text-sm text-muted-foreground space-y-1">
          <p>
            Questions? Contact{" "}
            <a className="text-orange underline" href="mailto:jacob@casacapsolutions.com">
              jacob@casacapsolutions.com
            </a>
          </p>
          <p>This demo expires on {new Date(invite.expires_at).toLocaleDateString(undefined, { dateStyle: "long" })}</p>
        </div>
      </div>
    </DemoShell>
  );
}

function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between">
          <Logo />
          <span className="rounded-full bg-orange/15 border border-orange/40 text-orange px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Private Demo Access
          </span>
        </div>
      </header>
      <main className="px-4 md:px-8">{children}</main>
    </div>
  );
}
