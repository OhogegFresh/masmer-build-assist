import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthContext";

export function useRequireAuth(opts: { adminOnly?: boolean } = {}) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { loading: authLoading, session, appUser, isAdmin } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    if (!appUser) { navigate({ to: "/login" }); return; }
    if (!appUser.is_active) { navigate({ to: "/login", search: { suspended: "1" } as any }); return; }
    if (opts.adminOnly && !isAdmin) { navigate({ to: "/dashboard" }); return; }
    setReady(true);
  }, [navigate, authLoading, session, appUser, isAdmin, opts.adminOnly]);

  return ready;
}
