/**
 * What may be shown of a stored `profiles.name` when somebody OTHER than its
 * owner is looking at it.
 *
 * WHY THIS EXISTS
 * ---------------
 * The rule used to be written by hand at each call site as
 * `name.split(" ")[0]`, described in a comment as "first name only for
 * privacy". It is not. `split(" ")[0]` takes everything up to the first space,
 * and an email address has no space in it — so for a profile whose `name` is
 * an email, the "first name" is the entire address.
 *
 * That is not hypothetical: on 2026-09-08 the all-time XP leaderboard on
 * /games rendered a student's full gmail address at rank 10, to every
 * signed-in visitor, because the same one-liner was written in SQL inside
 * get_xp_leaderboard(). 2 of 102 profiles hold an email in `name`, and
 * handle_new_user() will keep putting whatever the signup form sends there.
 *
 * KEEP IN STEP WITH THE SERVER
 * ----------------------------
 * public.public_display_name(text) in
 * supabase/migrations/20260908160000_leaderboard_display_name_privacy.sql is
 * the same rule, and it is the one that actually protects the leaderboard —
 * the boards are aggregated server-side, so nothing on the client can undo a
 * leak there. This module is the client-side half, for names that reach the
 * browser through a plain table read. Change the two together.
 */

/** Shown when the stored name is missing or is not safe to render. */
export const DISPLAY_NAME_FALLBACK = "Student";

/** Digits and phone punctuation only — a phone number, not a first name. */
const IDENTIFIER_SHAPED = /^[-+0-9()._ ]+$/;

/**
 * The first name in `name`, or {@link DISPLAY_NAME_FALLBACK} when what is
 * stored is an email address, a handle, a phone number, or nothing at all.
 *
 * The '@' test is applied to the first token rather than to the whole string
 * on purpose: `"Ahmed ahmed@example.com"` should still render as `"Ahmed"`,
 * not collapse a perfectly good first name into "Student".
 */
export function toPublicDisplayName(name: string | null | undefined): string {
  const token = (name ?? "").trim().split(" ")[0]?.trim() ?? "";

  if (!token) return DISPLAY_NAME_FALLBACK;
  if (token.includes("@")) return DISPLAY_NAME_FALLBACK;
  if (IDENTIFIER_SHAPED.test(token)) return DISPLAY_NAME_FALLBACK;

  return token;
}
