import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

/**
 * Checks if the logged-in user's profile.reset_version matches
 * the current app_reset_version. If not, signs them out and
 * redirects to /signup with a reset message.
 *
 * Returns { loading, resetBlocked } so callers can show a spinner.
 */
export function useResetGate() {
  const [loading, setLoading] = useState(true);
  const [resetBlocked, setResetBlocked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setLoading(false);
          return;
        }

        // Check if user is admin — admins are never blocked
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (roleData) {
          if (!cancelled) setLoading(false);
          return; // admin, skip gate
        }

        // Get current app reset version
        const { data: setting } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "app_reset_version")
          .single();

        const currentVersion = setting?.value || "1";

        // Get user's profile reset_version
        const { data: profile } = await supabase
          .from("profiles")
          .select("reset_version")
          .eq("user_id", session.user.id)
          .maybeSingle();

        const userVersion = profile?.reset_version;

        if (!userVersion || userVersion !== currentVersion) {
          // User is from before the reset — force sign out
          await supabase.auth.signOut();
          if (!cancelled) {
            setResetBlocked(true);
            setLoading(false);
            navigate("/signup?reset=true", { replace: true });
          }
          return;
        }

        if (!cancelled) setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    };

    check();
    return () => { cancelled = true; };
  }, [navigate]);

  return { loading, resetBlocked };
}
