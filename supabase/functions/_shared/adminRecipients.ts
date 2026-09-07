/**
 * Where internal Klovers alerts land.
 *
 * These were hardcoded to a single personal Gmail address. That is one point of
 * failure for every operational signal the system produces: if that inbox
 * filters, fills, or is simply not the one being read that week, the alert is
 * gone and nothing records that it was missed.
 *
 * Business alerts now also go to the business mailbox on the domain that sends
 * them, so an alert about kloversegy.com is readable from kloversegy.com.
 *
 * Override with ADMIN_ALERT_TO (comma-separated) to change the list without a
 * redeploy. An empty or whitespace-only value falls back to the defaults rather
 * than sending nowhere — silence is the one failure mode worth ruling out.
 */

const DEFAULT_RECIPIENTS = [
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
