import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./AuthContext";

export function useRequireAuth(opts: { adminOnly?: boolean } = {}) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { loading: authLoading, session } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!session) { navigate({ to: "/login" }); return; }
    setReady(true);
  }, [navigate, authLoading, session]);

  return ready;
}
