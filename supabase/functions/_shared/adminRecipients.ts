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
 * THE RETIRED ADDRESS
 * -------------------
 * The first version of this file used learnkorean@kloversegy.com — the address
 * funnel-digest had been sending a daily summary to for months. Re confirmed on
 * 2026-09-07 that she does not read that mailbox any more, and that
 * kloversegy.com is the replacement. So admin@kloversegy.com is the business
 * recipient now, and learnkorean@ appears nowhere.
 *
 * WHY THE PERSONAL GMAIL IS STILL HERE
 * ------------------------------------
 * On purpose, and it should stay until the domain mailbox is proven. If
 * admin@kloversegy.com has not been created as a Workspace user, group or alias
 * yet, that recipient bounces — and with a second address on the message the
 * alert still lands somewhere it will be read. Shipping the domain address alone
 * would turn an unprovisioned mailbox into a silent single point of failure,
 * which is the exact fault this file exists to remove.
 *
 * Once delivery to admin@kloversegy.com is confirmed, drop the Gmail with
 * ADMIN_ALERT_TO rather than by editing this list.
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
 */

const DEFAULT_RECIPIENTS = [
  "admin@kloversegy.com",
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
