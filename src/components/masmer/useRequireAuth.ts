import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useDemo } from "./DemoContext";

export function useRequireAuth() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const { isDemo, loading: demoLoading } = useDemo();

  useEffect(() => {
    let mounted = true;
    if (demoLoading) return;
    if (isDemo) {
      setReady(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (!data.user) {
        navigate({ to: "/login" });
      } else {
        setReady(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [navigate, isDemo, demoLoading]);

  return ready;
}