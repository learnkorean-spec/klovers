import { attachSessionToUser } from "@/lib/attachSessionToUser";

/**
 * Links anonymous lead_events to the authenticated user.
 *
 * This is a thin wrapper around attachSessionToUser() kept for backward
 * compatibility — App.tsx calls both attachLeadToUser and attachSessionToUser
 * on auth state change. The real work happens in attachSessionToUser which
 * calls the attach_session_to_user RPC to backfill user_id on all
 * lead_events rows that share the current localStorage session id.
 */
export async function attachLeadToUser(_user: { id: string; email?: string }) {
    try {
          await attachSessionToUser();
    } catch {
          /* swallow — never block auth flow */
    }
}
