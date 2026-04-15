// Backfills lead_events.user_id for the current anonymous session
// once the user signs in. Idempotent. Safe to call multiple times.
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/leadSession";

export async function attachSessionToUser(): Promise<void> {
  try {
    const sessionId = getSessionId();
    if (!sessionId) return;
    await supabase.rpc("attach_session_to_user", { p_session: sessionId });
  } catch {
    /* swallow */
  }
}
