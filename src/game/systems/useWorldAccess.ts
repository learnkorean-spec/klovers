import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GUEST_ACCESS, worldAccess, type WorldAccess } from "./access";

/**
 * Reads the signed-in learner's course level and admin role, and turns them
 * into world access. Guests, and any failed read, get the guest set — the
 * world never breaks because a query did.
 */
export function useWorldAccess(): WorldAccess {
  const [access, setAccess] = useState<WorldAccess>(GUEST_ACCESS);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const uid = session.user.id;
        const [profile, role] = await Promise.all([
          supabase.from("profiles").select("level, course_level_key").eq("user_id", uid).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
        ]);
        if (cancelled) return;
        // course_level_key is what the placement test writes; `level` is older.
        const p = profile.data as { level?: string | null; course_level_key?: string | null } | null;
        setAccess(worldAccess(p?.course_level_key || p?.level || "", !!role.data));
      } catch (err) {
        console.warn("[KLOVERS World] could not read world access", err);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return access;
}
