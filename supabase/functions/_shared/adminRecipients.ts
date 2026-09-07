/**
 * Where internal Klovers alerts land.
 *
 * These were hardcoded to a single personal Gmail address, in three separate
 * functions. That is one point of failure for every operational signal the
 * system produces: if that inbox filters, fills, or is simply not the one being
 * read that week, the alert is gone and nothing records that it was missed.
 * There were 174 unread admin_notifications rows when this was written, which is
 * what that failure mode looks like from the other side.
 *
 * WHY THE DEFAULT IS STILL ONE GMAIL ADDRESS
 * ------------------------------------------
 * The obvious fix is to add a mailbox on the sending domain, so an alert about
 * kloversegy.com is readable from kloversegy.com. The first version of this file
 * did exactly that with learnkorean@kloversegy.com — the address funnel-digest
 * already uses.
 *
 * Re confirmed on 2026-09-07 that she does not read that mailbox any more.
 * Shipping it would have recreated the same failure on a new address: delivery
 * to somewhere nobody opens, which is worse than a single inbox because it reads
 * as redundancy.
 *
 * The domain CAN receive — its MX records point at Google Workspace
 * (aspmx.l.google.com). There is simply no confirmed live mailbox on it yet. So
 * the default stays the address known to work, and the domain mailbox gets added
 * through ADMIN_ALERT_TO the moment one exists.
 *
 * TO ADD THE DOMAIN MAILBOX
 * -------------------------
 * Set ADMIN_ALERT_TO in the Supabase edge function secrets, comma-separated:
 *
 *   ADMIN_ALERT_TO="reham.elshrkawy@gmail.com,admin@kloversegy.com"
 *
 * No redeploy, no code change. An empty or malformed value falls back to the
 * default rather than sending nowhere — silence is the one failure mode worth
 * ruling out.
 */

const DEFAULT_RECIPIENTS = [
  "reham.elshrkawy@gmail.com",
];

export function adminRecipients(): string[] {
  const raw = Deno.env.get("ADMIN_ALERT_TO");
  if (!raw) return DEFAULT_RECIPIENTS;

  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.includes("@"));

  return list.length > 0 ? list : DEFAULT_RECIPIENTS;
}
