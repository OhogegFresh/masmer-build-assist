import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppUser = {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  business_name: string | null;
  role: string;
  is_active: boolean;
};

type AuthCtx = {
  loading: boolean;
  session: boolean;
  appUser: AppUser | null;
  isAdmin: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  loading: true, session: false, appUser: null, isAdmin: false,
  refresh: async () => {}, signOut: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(false);
  const [appUser, setAppUser] = useState<AppUser | null>(null);

  async function loadAppUser(email: string | undefined) {
    if (!email) { setAppUser(null); return; }
    const { data } = await (supabase as any)
      .from("app_users").select("*").eq("email", email).maybeSingle();
    setAppUser((data as AppUser) ?? null);
  }

  async function refresh() {
    const { data } = await supabase.auth.getSession();
    const s = data.session;
    setSession(!!s);
    await loadAppUser(s?.user?.email);
  }

  useEffect(() => {
    let mounted = true;
    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      if (!mounted) return;
      setSession(!!s);
      await loadAppUser(s?.user?.email);
    });
    refresh().finally(() => mounted && setLoading(false));
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setAppUser(null);
    setSession(false);
    if (typeof window !== "undefined") window.location.href = "/login";
  }

  return (
    <Ctx.Provider value={{
      loading, session, appUser,
      isAdmin: appUser?.role === "admin",
      refresh, signOut,
    }}>{children}</Ctx.Provider>
  );
}