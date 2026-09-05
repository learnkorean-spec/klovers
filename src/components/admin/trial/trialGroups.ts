/**
 * Everyone waiting for a trial, split into the three groups that can actually
 * be acted on differently.
 *
 * WHY GROUPS AT ALL
 * -----------------
 * The existing bulk button sends to every unscheduled student whose invitation
 * is stale — one list, one number, one press. On 4 September 2026 that was 57
 * people, and pressing it would have invited a Level 6 student to a Hangul
 * cohort and a student who never told us their level to a class we cannot
 * place them in.
 *
 * The split is not cosmetic. Each group has a different next step:
 *
 *   hangul   Both Hangul cohorts exist and are bookable, so a trial here has
 *            somewhere to go afterwards. These are the only people who can be
 *            sold to today.
 *   levels   Told us a level above Hangul. No cohort is open for them, so the
 *            trial ends with a question nobody can answer yet.
 *   noLevel  Never told us where they are. They need the placement test, not
 *            an invitation — after it they sort themselves into the two above.
 *
 * WHAT THIS FILE DELIBERATELY IS NOT
 * ----------------------------------
 * It does not decide who is *due* an invitation. That is pickRebookTargets in
 * ./rebookTargets, which is the single source of truth for the list the sender
 * actually mails, and it stays that way — grouping runs on whatever that
 * returns. Keeping the two apart is what stops the number on a button drifting
 * from the number of emails again.
 */

export type TrialGroupKey = "hangul" | "levels" | "noLevel";

export interface GroupableBooking {
  id: string;
  email: string;
  level?: string | null;
  class_language?: string | null;
  rebook_email_sent_at?: string | null;
}

/**
 * Level strings as they actually appear in trial_bookings.
 *
 * Measured on production 2026-09-04: `hangul`, `level_1`, `level_2`, `level_4`,
 * `level_6`, and empty. These are the OLD keys — the canonical set in
 * src/constants/levels.ts is `hangul`, `l1`…`l6` — because the rows predate
 * that rename and nothing backfilled them. Both spellings are accepted here so
 * this keeps working after a backfill, and so a row written today by a newer
 * form lands in the right group.
 *
 * Anything unrecognised counts as a level rather than as missing: someone who
 * typed something we do not parse still told us they are not a beginner, and
 * putting them in "no level given" would send them a placement test they do
 * not need.
 */
const HANGUL_ALIASES = new Set(["hangul", "hangeul", "level_0", "l0", "0"]);

export function normaliseLevel(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim().toLowerCase();
  return v.length ? v : null;
}

export function groupOf(booking: GroupableBooking): TrialGroupKey {
  const level = normaliseLevel(booking.level);
  if (!level) return "noLevel";
  if (HANGUL_ALIASES.has(level)) return "hangul";
  return "levels";
}

export interface GroupCounts {
  total: number;
  arabic: number;
  english: number;
  neverInvited: number;
  reInvite: number;
}

export interface TrialGroup {
  key: TrialGroupKey;
  rows: GroupableBooking[];
  counts: GroupCounts;
  /** Level -> count, for the group that has a mix worth showing. */
  levelBreakdown: { level: string; count: number }[];
}

export type TrialGroups = Record<TrialGroupKey, TrialGroup>;

/**
 * Arabic or not, decided the same way the letter's language is.
 *
 * emailLanguageFor treats `arabic`/`ar` as Arabic and everything else as
 * English, so this must agree with it — a chip saying "Arabic 9" beside a
 * button that mails 8 Arabic letters is worse than no chip.
 */
function isArabic(booking: GroupableBooking): boolean {
  const lang = (booking.class_language ?? "").trim().toLowerCase();
  return lang === "arabic" || lang === "ar";
}

function countsFor(rows: GroupableBooking[]): GroupCounts {
  let arabic = 0;
  let neverInvited = 0;
  for (const r of rows) {
    if (isArabic(r)) arabic += 1;
    if (!r.rebook_email_sent_at) neverInvited += 1;
  }
  return {
    total: rows.length,
    arabic,
    english: rows.length - arabic,
    neverInvited,
    reInvite: rows.length - neverInvited,
  };
}

/**
 * Levels present in a group, commonest first, so the label reads
 * "L1 · 6  L2 · 5" rather than making someone open the table to find out
 * whether one Level 6 student is holding up a decision about fourteen.
 */
function breakdownFor(rows: GroupableBooking[]): { level: string; count: number }[] {
  const tally = new Map<string, number>();
  for (const r of rows) {
    const level = normaliseLevel(r.level);
    if (!level) continue;
    tally.set(level, (tally.get(level) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([level, count]) => ({ level, count }))
    .sort((a, b) => b.count - a.count || a.level.localeCompare(b.level));
}

const EMPTY = (key: TrialGroupKey): TrialGroup => ({
  key,
  rows: [],
  counts: { total: 0, arabic: 0, english: 0, neverInvited: 0, reInvite: 0 },
  levelBreakdown: [],
});

/**
 * Split a list — normally the output of pickRebookTargets — into the three
 * groups. Order within a group is the order it arrived in, so a table renders
 * stably between renders.
 */
export function groupTrialTargets(rows: GroupableBooking[]): TrialGroups {
  const buckets: Record<TrialGroupKey, GroupableBooking[]> = {
    hangul: [],
    levels: [],
    noLevel: [],
  };
  for (const row of rows) buckets[groupOf(row)].push(row);

  const build = (key: TrialGroupKey): TrialGroup =>
    buckets[key].length === 0
      ? EMPTY(key)
      : {
          key,
          rows: buckets[key],
          counts: countsFor(buckets[key]),
          levelBreakdown: key === "levels" ? breakdownFor(buckets[key]) : [],
        };

  return {
    hangul: build("hangul"),
    levels: build("levels"),
    noLevel: build("noLevel"),
  };
}

/** Only the Arabic-track rows of a group, for the "Arabic only" send. */
export function arabicOnly(rows: GroupableBooking[]): GroupableBooking[] {
  return rows.filter(isArabic);
}

/** Only the English-track rows of a group. */
export function englishOnly(rows: GroupableBooking[]): GroupableBooking[] {
  return rows.filter((r) => !isArabic(r));
}

/** "level_1" -> "Level 1", "l1" -> "Level 1", "hangul" -> "Hangul". */
export function levelLabel(raw: string | null | undefined): string {
  const level = normaliseLevel(raw);
  if (!level) return "—";
  if (HANGUL_ALIASES.has(level)) return "Hangul";
  const m = level.match(/^(?:level_|l)(\d)$/);
  return m ? `Level ${m[1]}` : level;
}
