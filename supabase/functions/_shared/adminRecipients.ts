/**
 * Where internal Klovers alerts land.
 *
 * These were hardcoded, per function, to a single personal Gmail address. That
 * is one point of failure for every operational signal the system produces: if
 * that inbox filters, fills, or is simply not the one being read that week, the
 * alert is gone and nothing records that it was missed. There were 174 unread
 * admin_notifications rows when this was written, which is what that failure
 * mode looks like from the other side.
 *
 * THE THREE ADDRESSES
 * -------------------
 * admin@kloversegy.com is the business recipient.
 *
 * reham.elshrkawy@gmail.com is here on purpose and should stay until the domain
 * mailboxes are proven. If a domain address has not been created as a Workspace
 * user, group or alias, that recipient bounces — and with a second address on
 * the message the alert still lands somewhere it will be read. Shipping a
 * domain address alone would turn an unprovisioned mailbox into a silent single
 * point of failure, which is the exact fault this file exists to remove.
 *
 * learnkorean@kloversegy.com was removed on 2026-09-07, when Re said she no
 * longer read it, and restored on 2026-09-08 at her instruction.
 *
 * ⚠️ IT DOES NOT RECEIVE YET. On 2026-09-08 the Squarespace account console
 * showed "We couldn't reach the email address learnkorean@kloversegy.com" —
 * Squarespace mails that address itself, so that is direct evidence, not an
 * inference. email_logs has never carried a send to any @kloversegy.com
 * address, so this codebase has no counter-evidence either way.
 *
 * Until the mailbox exists in Workspace, every alert to it bounces. Bounces
 * cost sending reputation on the same domain that carries the class
 * confirmations, so this is not free. Provision it (Admin console → Directory →
 * Users, as a user or an alias) and the line below starts doing something.
 *
 * THE OVERRIDE
 * ------------
 * ADMIN_ALERT_TO, comma-separated, changes the list with no redeploy:
 *
 *   ADMIN_ALERT_TO="admin@kloversegy.com"
 *   ADMIN_ALERT_TO="admin@kloversegy.com,reham.elshrkawy@gmail.com"
 *
 * An empty or malformed value falls back to the defaults rather than sending
 * nowhere — silence is the one failure mode worth ruling out.
 *
 * Prefer the override for a temporary change. Edit the list below only when the
 * new set is meant to be the standing one.
 */

const DEFAULT_RECIPIENTS = [
  "admin@kloversegy.com",
  "reham.elshrkawy@gmail.com",
  "learnkorean@kloversegy.com",
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
