// Backfills lead_events.user_id for the current anonymous session
// once the user signs in. Idempotent. Safe to call multiple times.
import { supabase } from "@/integrations/supabase/client";
import { getSessionId } from "@/lib/leadSession";

/**
 * Sessions already attached in this page load, and the calls still running.
 *
 * The RPC is idempotent, so calling it repeatedly was never wrong - it was
 * just four identical round-trips on every load of the homepage. Two callers
 * (App.tsx calls both attachLeadToUser, itself a wrapper around this, and
 * attachSessionToUser) times the auth events Supabase fires while booting.
 *
 * Only a SUCCESSFUL call is recorded, so a failure stays retryable on the
 * next auth event. `inFlight` collapses the concurrent case: all four calls
 * land within milliseconds of each other, so without it each would start
 * before any had finished and the set would never get the chance to help.
 */
const attached = new Set<string>();
const inFlight = new Map<string, Promise<void>>();

export async function attachSessionToUser(): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId || attached.has(sessionId)) return;

  const running = inFlight.get(sessionId);
  if (running) return running;

  const call = (async () => {
    try {
      const { error } = await supabase.rpc("attach_session_to_user", { p_session: sessionId });
      if (!error) attached.add(sessionId); // a 5xx comes back as { error }: stay retryable
    } catch {
      /* swallow — stays retryable, nothing the visitor can act on */
    } finally {
      inFlight.delete(sessionId);
    }
  })();

  inFlight.set(sessionId, call);
  return call;
}
