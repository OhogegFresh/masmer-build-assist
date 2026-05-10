import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type DemoInvite = {
  id: string;
  invite_code: string;
  invitee_name: string | null;
  invitee_email: string | null;
  invitee_company: string | null;
  expires_at: string;
  activated_at: string | null;
  is_active: boolean;
  page_views: number;
  last_seen: string | null;
};

type DemoContextValue = {
  isDemo: boolean;
  invite: DemoInvite | null;
  loading: boolean;
  daysRemaining: number;
  activate: (code: string) => Promise<DemoInvite | null>;
  exit: () => void;
};

const DemoCtx = createContext<DemoContextValue>({
  isDemo: false,
  invite: null,
  loading: true,
  daysRemaining: 0,
  activate: async () => null,
  exit: () => {},
});

export const useDemo = () => useContext(DemoCtx);

const STORAGE_KEY = "masmer_demo_code";

function daysLeft(expires: string) {
  const ms = new Date(expires).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

async function fetchInvite(code: string): Promise<DemoInvite | null> {
  const { data } = await (supabase as any)
    .from("demo_invites")
    .select("*")
    .eq("invite_code", code)
    .maybeSingle();
  return (data as DemoInvite) ?? null;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [invite, setInvite] = useState<DemoInvite | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const code = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (!code) {
      setLoading(false);
      return;
    }
    (async () => {
      const inv = await fetchInvite(code);
      if (!inv || !inv.is_active || new Date(inv.expires_at) < new Date()) {
        localStorage.removeItem(STORAGE_KEY);
        if (inv && path !== `/demo/${code}`) {
          navigate({ to: "/demo/$code", params: { code } });
        }
        setInvite(null);
      } else {
        setInvite(inv);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function activate(code: string) {
    const inv = await fetchInvite(code);
    if (!inv || !inv.is_active || new Date(inv.expires_at) < new Date()) return null;
    localStorage.setItem(STORAGE_KEY, code);
    const updates: Record<string, unknown> = {
      page_views: (inv.page_views ?? 0) + 1,
      last_seen: new Date().toISOString(),
    };
    if (!inv.activated_at) updates.activated_at = new Date().toISOString();
    await (supabase as any).from("demo_invites").update(updates).eq("id", inv.id);
    const next = { ...inv, ...updates } as DemoInvite;
    setInvite(next);
    return next;
  }

  function exit() {
    localStorage.removeItem(STORAGE_KEY);
    setInvite(null);
  }

  const value: DemoContextValue = {
    isDemo: !!invite,
    invite,
    loading,
    daysRemaining: invite ? daysLeft(invite.expires_at) : 0,
    activate,
    exit,
  };

  return <DemoCtx.Provider value={value}>{children}</DemoCtx.Provider>;
}

export function DemoBanner() {
  const { isDemo, daysRemaining } = useDemo();
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (!isDemo) return null;
  // Hide on the demo landing page itself & marketing pages
  if (path.startsWith("/demo/") || path === "/" || path.startsWith("/login")) return null;
  return (
    <div className="w-full bg-gradient-orange text-white text-sm">
      <div className="mx-auto max-w-7xl px-4 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center">
        <span className="font-semibold">🎯 Demo Mode — {daysRemaining} day{daysRemaining === 1 ? "" : "s"} remaining</span>
        <span className="opacity-80 hidden sm:inline">|</span>
        <a href="mailto:jacob@casacapsolutions.com" className="underline underline-offset-2 opacity-95 hover:opacity-100">
          Questions? jacob@casacapsolutions.com
        </a>
        <span className="opacity-80 hidden sm:inline">|</span>
        <Link to="/" className="font-semibold underline underline-offset-2">
          Upgrade to Pro →
        </Link>
      </div>
    </div>
  );
}
