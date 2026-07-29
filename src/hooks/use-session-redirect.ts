import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { resolveHomePath as resolveHomePathFromAuth } from "@/lib/api/auth";

export async function resolveHomePath(): Promise<"/dashboard" | "/admin"> {
  return resolveHomePathFromAuth();
}

/**
 * Public pages (landing, auth): send already-authenticated visitors to their home.
 * Returns true while the session is still being resolved.
 */
export function useRedirectIfAuthenticated() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session) {
        setChecking(false);
        return;
      }
      const to = await resolveHomePath();
      if (cancelled) return;
      navigate({ to, replace: true });
    }

    check();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        resolveHomePath().then((to) => {
          if (!cancelled) navigate({ to, replace: true });
        });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return checking;
}
