import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDemo } from "./DemoContext";
import { useAuth } from "./AuthContext";

export function useRequireAuth(opts: { adminOnly?: boolean } = {}) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { isDemo, loading: demoLoading } = useDemo();
  const { loading: authLoading, session, appUser, isAdmin } = useAuth();

  useEffect(() => {
    if (demoLoading || authLoading) return;
    if (isDemo && !opts.adminOnly) { setReady(true); return; }
    if (!session) { navigate({ to: "/login" }); return; }
    if (!appUser) { navigate({ to: "/login" }); return; }
    if (!appUser.is_active) { navigate({ to: "/login", search: { suspended: "1" } as any }); return; }
    if (opts.adminOnly && !isAdmin) { navigate({ to: "/dashboard" }); return; }
    setReady(true);
  }, [navigate, isDemo, demoLoading, authLoading, session, appUser, isAdmin, opts.adminOnly]);

  return ready;
}