/**
 * How many admin alerts are sitting unread.
 *
 * WHY THIS EXISTS
 *
 * The backend has good monitoring. `check_cron_health()` runs every six hours,
 * notices when a scheduled edge invocation is skipped or failing, and writes a
 * plain-language row into `admin_notifications`. It has been doing that
 * correctly since 15 August — 36 times — naming `send-trial-followups` and
 * `send-trial-rollover-notifications` in the message.
 *
 * Nobody ever saw one. The table holds 174 notifications and **not a single
 * row is marked read**: cron health, 23 backend self-check failures, a
 * calendar-drift warning from this week, new trial bookings, new enrollments.
 *
 * The detection was never the gap. The delivery was. `AdminShell` renders a
 * bell that takes `badges.notifications`, and nothing in the app has ever
 * passed a value for it — a permanently silent alarm mounted beside a table
 * that was quietly filling with things that needed attention.
 *
 * So the count comes from here, and the shell fetches it itself rather than
 * waiting for a caller to remember.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Types that represent something being WRONG, as opposed to something having
 * happened. A new trial booking is good news and belongs in the list; it
 * should not make the bell red.
 */
export const ALERT_TYPES = [
  "cron_health",
  "self_verification",
  "calendar_drift",
  "pgnet_failure",
] as const;

export interface UnreadAlerts {
  /** Unread rows whose type means something is broken. */
  problems: number;
  /** Every unread row, including ordinary activity. */
  total: number;
}

export function useUnreadAlerts() {
  return useQuery<UnreadAlerts>({
    queryKey: ["admin", "unread-alerts"],
    queryFn: async () => {
      // head:true — Postgres returns the count and no rows cross the wire.
      const [problems, total] = await Promise.all([
        supabase
          .from("admin_notifications")
          .select("*", { count: "exact", head: true })
          .eq("read", false)
          .in("type", ALERT_TYPES as unknown as string[]),
        supabase
          .from("admin_notifications")
          .select("*", { count: "exact", head: true })
          .eq("read", false),
      ]);

      if (problems.error) throw problems.error;
      if (total.error) throw total.error;

      return {
        problems: problems.count ?? 0,
        total: total.count ?? 0,
      };
    },
    // A badge, not a payment. Cheap enough to keep current, slow enough to be
    // invisible.
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
