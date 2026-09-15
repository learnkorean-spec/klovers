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
 * REPLY_TO_EMAIL pointed at Re's personal Gmail from 7 Sep 2026, because she
 * had stopped reading learnkorean@kloversegy.com (claude/ADMIN_ALERT_RECIPIENTS.md).
 * On 15 Sep she set that mailbox to forward to the same Gmail, which removes
 * the reason: the replies reach her either way, and a student pressing Reply
 * now sees the academy rather than the owner's personal address. So both ends
 * of a Klovers letter are on the domain again, and the one channel is kept by
 * the forward rather than by publishing a private address to every student.
 *
 * If that forward is ever turned off, replies from students go unread --
 * change this line back at the same time, not afterwards.
 */
export const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "Klovers <learnkorean@kloversegy.com>";
export const REPLY_TO_EMAIL = Deno.env.get("REPLY_TO_EMAIL") || "learnkorean@kloversegy.com";
