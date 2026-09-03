/**
 * Who should be invited to pick a trial date.
 *
 * The subtlety is what "already invited" means. `rebook_email_sent_at` records
 * that SOME invitation went out, not which dates it named. On 2 July 2026 fifty
 * students were emailed about a July trial block; that block is long gone and
 * the current slots were last written on 1 September. Treating that timestamp
 * as "done" leaves those students holding an invitation to dates that have
 * already passed, and the admin sees a button reading (0) with nothing wrong.
 *
 * So an invitation counts only if it was sent AFTER the dates it is inviting
 * people to were last changed. Move a slot, and everyone who was invited to the
 * old date becomes eligible again — which is the behaviour you want anyway,
 * because their invitation is now wrong.
 */

export interface RebookCandidate {
  id: string;
  email: string;
  status: string;
  class_language?: string | null;
  rebook_email_sent_at?: string | null;
}

/**
 * Was this student's last invitation written before the current dates were?
 *
 * No invitation at all is stale by definition. If we cannot tell when the slots
 * last changed (no slots, or no timestamps), fall back to the old rule — never
 * re-mail someone on a guess.
 */
export function isStaleInvitation(
  sentAt: string | null | undefined,
  slotsUpdatedAt: Date | null,
): boolean {
  if (!sentAt) return true;
  if (!slotsUpdatedAt) return false;
  const sent = Date.parse(sentAt);
  if (Number.isNaN(sent)) return true;
  return sent < slotsUpdatedAt.getTime();
}

/**
 * One row per person, keeping the first.
 *
 * A student who booked twice without picking a date has two unscheduled rows,
 * and the bulk sender used to mail them once per row.
 */
function dedupeByEmail<T extends { email?: string | null }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => {
    const key = (r.email ?? "").trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * The exact list the button counts and the sender sends to — one function, so
 * the number on the button cannot drift from the number of emails again.
 */
export function pickRebookTargets<T extends RebookCandidate>(
  rows: T[],
  slotsUpdatedAt: Date | null,
): T[] {
  return dedupeByEmail(
    rows.filter(
      (b) =>
        b.status !== "cancelled" &&
        !!b.email &&
        isStaleInvitation(b.rebook_email_sent_at, slotsUpdatedAt),
    ),
  );
}
