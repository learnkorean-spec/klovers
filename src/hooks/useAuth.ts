import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Central auth hook — subscribe to Supabase auth state once,
 * share the result everywhere instead of calling getSession() per component.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    // Get current session immediately. getSession() waits on a token refresh
    // when the stored token has expired; if the backend is down (17 Oct 2026)
    // that never settles, so stop "loading" after 6 s and treat the visitor as
    // signed out until onAuthStateChange says otherwise.
    let settled = false;
    const settle = (session: Session | null) => {
      settled = true;
      setState({ user: session?.user ?? null, session, loading: false });
    };
    const fallback = setTimeout(() => {
      if (!settled) setState((s) => (s.loading ? { ...s, loading: false } : s));
    }, 6000);
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => settle(session))
      .catch(() => {
        if (!settled) setState((s) => ({ ...s, loading: false }));
      });

    // Keep in sync with all future auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      settle(session);
    });

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
