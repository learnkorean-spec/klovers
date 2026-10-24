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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) console.warn("[KLOVERS World] session read failed", sessionError);
        if (!session) return;
        const uid = session.user.id;
        const [profile, role, review] = await Promise.all([
          supabase.from("profiles").select("level, course_level_key").eq("user_id", uid).maybeSingle(),
          supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
          // Words in the learner's review schedule: Cluby's Memory Garden opens with them.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (supabase as any).from("vocabulary_review_history").select("id", { count: "exact", head: true }).eq("user_id", uid),
        ]);
        if (cancelled) return;
        // A failed read never opens anything: no level → Hangul Village only,
        // no role → no preview. Logged so the failure is visible, not silent.
        if (profile.error) console.warn("[KLOVERS World] profile read failed", profile.error);
        if (role.error) console.warn("[KLOVERS World] role read failed", role.error);
        // course_level_key is what the placement test writes; `level` is older.
        const p = (profile.error ? null : profile.data) as { level?: string | null; course_level_key?: string | null } | null;
        if (review.error) console.warn("[KLOVERS World] review count read failed", review.error);
        setAccess(worldAccess(p?.course_level_key || p?.level || "", !role.error && !!role.data, review.error ? 0 : review.count ?? 0));
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
