/**
 * Who Klovers mail comes from.
 *
 * This used to be copied into every function that sends, which is how the
 * reply-to drifted onto a personal Gmail while the From said "noreply" -- the
 * letters ask a student to reply and the address told her not to.
 *
 * The domain is authenticated for both senders: Resend signs at the root
 * (resend._domainkey.kloversegy.com) and Workspace signs at google._domainkey,
 * with SPF and DMARC on kloversegy.com. So any @kloversegy.com local part is
 * deliverable; the address below is a real mailbox that a person reads.
 *
 * REPLY_TO_EMAIL points at Re's personal Gmail, not learnkorean@kloversegy.com,
 * because she confirmed on 7 Sep 2026 she no longer reads that inbox (see
 * claude/ADMIN_ALERT_RECIPIENTS.md). Sending from the authenticated domain but
 * replying to an address she actually reads is what lets every Klovers letter
 * — platform-sent and previously Gmail-sent alike — live on one channel.
 */
export const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Klovers <learnkorean@kloversegy.com>";
export const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL") || "reham.elshrkawy@gmail.com";
