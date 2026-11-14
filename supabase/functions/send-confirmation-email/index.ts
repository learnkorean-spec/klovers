import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";
import { levelLabel, type EmailLanguage } from "../_shared/levelLabel.ts";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

// The templates live in ./templates/ since 2026-09-01. This file had grown to
// ~128 KB, past what the GitHub contents API accepts in a single write, which
// made it impossible to edit through the assistant's only write path. The
// split is a pure move - all 25 templates were rendered before and after, in
// both languages, and the output matched byte for byte.
//
// Since that split this file is ~13 KB and is editable again. The handoff of
// 2026-09-15 still carried the old warning and it cost a session: the payment
// letter was designed around a signature that could not be changed, when in
// fact it could. Trust the directory listing over the note.
import type {
  EmailPayload,
} from "./templates/common.ts";
// Value import, not a type: the List-Unsubscribe header below is built from
// it. Same constant the templates use for their footer links.
import { FUNCTION_BASE } from "./templates/common.ts";
import {
  buildTrialConfirmedEmail,
  buildTrialAttendanceConfirmationEmail, buildTrialGroupFullEmail,
  buildTrialRolloverEmail, buildTrialPrepEmail,
  buildTrialFollowupDay3Email, buildTrialFollowupDay7Email,
} from "./templates/trial.ts";
// The invitation lives on its own since 2026-09-02, so its copy can be edited
// without resending 58 KB of trial.ts. trial.ts still exports a stale copy of
// buildTrialRebookEmail that nothing imports - delete it there next time that
// file is opened.
import { buildTrialRebookEmail } from "./templates/trialRebook.ts";
import { buildPlacementResultEmail } from "./templates/placementResult.ts";
import { buildAdminMessageEmail } from "./templates/adminMessage.ts";
// The two payment letters live on their own since 2026-09-15, for the same
// reason. lifecycle.ts still exports the stale copies - delete them there next
// time that file is opened.
import {
  buildPaymentMethodReminderEmail, buildReceiptNudgeEmail,
} from "./templates/payment.ts";
// The post-trial letter, likewise, since 2026-09-15. It keeps the
// `trial_followup_day1` slug and is now sent two hours after the class ends
// rather than two days later. trial.ts still exports the stale copy.
import { buildTrialFollowupDay1Email } from "./templates/postTrial.ts";
// The trial book letter, since 2026-09-15. Sent by send-trial-guide the day
// before (and on the day of) each trial, and only to bookings whose
// `attendance_response` is 'yes'. Its slug is the third one deliberately
// absent from the template union in common.ts, so it is dispatched ahead of
// the switch below rather than as a case inside it.
import { buildTrialGuideEmail } from "./templates/trialGuide.ts";
// The second ask, since 2026-09-15. Sent by send-trial-reask to bookings that
// were asked whether they are coming and never answered. Written as a new
// opening, not a chase, and deliberately without the book link - the book is
// for the students who confirm. Fourth slug absent from that union.
import { buildTrialReaskEmail } from "./templates/trialReask.ts";
// The day-before group class reminder, since 2026-09-16. Sent by
// send-class-reminders to seated students of started groups, with the
// group's own room. Fifth slug absent from that union.
import { buildClassReminderEmail } from "./templates/classReminder.ts";
// The trial-day reminder, since 2026-09-17. Sent by send-trial-reminder about
// two hours before each trial, to every live booking on that day that has not
// declined - confirmed or silent, unlike the book. Sixth slug absent from that
// union.
import { buildTrialReminderEmail } from "./templates/trialReminder.ts";
// The private-student payment letter, since 2026-09-18. Sent by
// admin_send_bundle_payment_ask() when Re asks for a bundle to be paid. Every
// other payment template here is built on `enrollments`, which a private
// student does not have, so before this one nothing in the system could tell
// her what she owed. Seventh slug absent from that union.
import { buildPrivateBundlePaymentEmail } from "./templates/privateBundlePayment.ts";
// The course welcome, since 2026-09-21. Sent by hand from the admin Groups
// screen to every seated student of one group: where and when the class is,
// the book, and what the dashboard answers (schedule, attendance, payments).
// Eighth slug absent from that union.
import { buildCourseWelcomeEmail } from "./templates/courseWelcome.ts";
import {
  buildWelcomeEmail, buildEnrollmentEmail, buildGroupMatchEmail,
  buildSlotConfirmedEmail, buildApprovalEmail, buildPendingReviewEmail,
  buildRejectionEmail,
  buildPaymentConfirmedEmail, buildGroupFormingEmail,
  buildClassLinkEmail, buildGroupFormingEscalationEmail,
  buildRejectionFollowupEmail, buildPreClassReminderEmail,
  buildClassFeedbackEmail,
} from "./templates/lifecycle.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Re asked (18 Sep 2026) to be copied on the trial-booking confirmation, then
// (14 Nov 2026) widened that to every trial-facing letter — booking,
// reminders, the guide, follow-ups, rollover — so she always sees the same
// letter the student gets, with the same links, not a summary of it. Blind-
// copied, not CC'd: the student should not see Re's personal inbox in the
// header of her own letter. See the bccList assignment below for the scope.
const TRIAL_BCC_EMAIL = "reham.elshrkawy@gmail.com";

/**
 * The URL that belongs in the RFC 8058 `List-Unsubscribe` header.
 *
 * It points at the EDGE FUNCTION, never at `kloversegy.com/unsubscribe`.
 * One-click unsubscribe is an unattended POST from Gmail's own servers: it
 * must reach something that answers without a browser, and the site route is a
 * single-page app that does nothing until JavaScript has run. The same
 * reasoning is already written into process-email-campaign,
 * send-profile-reminders and send-name-collection-email. The visible footer
 * link the templates render is a separate thing and stays pointed at the page.
 *
 * Returns undefined when the caller passed no token, which is how this stays
 * scoped: see the call site.
 */
function listUnsubscribeUrl(token: string | undefined, isAr: boolean): string | undefined {
  const t = (token ?? "").trim();
  if (!t) return undefined;
  return `${FUNCTION_BASE}/unsubscribe-email?token=${t}&lang=${isAr ? "ar" : "en"}`;
}

async function logEmail(opts: {
  template: string;
  toEmail: string;
  toName?: string;
  status: "sent" | "failed";
  resendId?: string;
  error?: string;
}) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/email_logs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({
        template: opts.template,
        to_email: opts.toEmail,
        to_name: opts.toName,
        status: opts.status,
        resend_id: opts.resendId,
        error: opts.error,
      }),
    });
  } catch {
    // never throw from logging
  }
}

async function sendEmail(
  to: string, subject: string, html: string,
  attachments?: Array<{ filename: string; content: string; content_type?: string }>,
  bcc?: string[],
  unsubscribeUrl?: string,
) {
  const body: Record<string, unknown> = {
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to: [to],
    subject,
    html,
  };
  if (attachments?.length) body.attachments = attachments;
  if (bcc?.length) body.bcc = bcc;
  // The row Gmail renders next to the sender name. Without it the easiest
  // exit a reader has is "Report spam", and on a list this size a couple of
  // complaints moves inbox placement for everybody.
  if (unsubscribeUrl) {
    body.headers = {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const authorization = await authorizeRequest(req, "admin-or-service");
  if (!authorization.ok) return authorizationError(authorization, corsHeaders);

  // Declared out here on purpose. It used to be `let payload` INSIDE the try,
  // which is block-scoped - so in the catch below `typeof payload` was always
  // "undefined" and the failure branch of logEmail has never once run. That is
  // why a template throwing for every Arabic reader left no trace in
  // email_logs: the crash and the record of the crash were both swallowed.
  let payload: EmailPayload | undefined;

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    payload = await req.json();

    // The templates render `level` / `group_level` straight into the letter,
    // title-cased, which turned the canonical key `l1` into "L1" for every
    // enrolling student - and in Arabic dropped the English key into Arabic
    // copy, because \b\w matches no Arabic letter. Resolved once here rather
    // than in two 54 KB template files, so every template downstream receives
    // a name a student can actually read.
    if (payload) {
      const lang: EmailLanguage = payload.language === "ar" ? "ar" : "en";
      const withLevels = payload as unknown as {
        level?: string | null;
        group_level?: string | null;
      };
      if (withLevels.level) withLevels.level = levelLabel(withLevels.level, lang);
      if (withLevels.group_level) withLevels.group_level = levelLabel(withLevels.group_level, lang);
    }

    const { email, name, language, template } = payload!;

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Missing email or name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate required fields per template
    if (template === "class_link" && (!payload!.class_link_url || payload!.class_link_url.trim() === "")) {
      return new Response(JSON.stringify({ error: "class_link_url is required for the class_link template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (template === "payment_method_reminder" && !payload!.enrollment_id) {
      return new Response(JSON.stringify({ error: "enrollment_id is required for the payment_method_reminder template" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // The book letter is nothing but a link to the book. Without the URL its
    // one button would go nowhere, so it is refused here rather than sent as a
    // letter with a dead button in it.
    if ((template as string) === "trial_guide") {
      const guideUrl = ((payload! as { guide_url?: string }).guide_url || "").trim();
      if (!guideUrl) {
        return new Response(JSON.stringify({ error: "guide_url is required for the trial_guide template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // A class reminder without the room is a reminder to stand outside a door.
    if ((template as string) === "class_reminder") {
      if (!payload!.class_link_url || payload!.class_link_url.trim() === "") {
        return new Response(JSON.stringify({ error: "class_link_url is required for the class_reminder template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // The welcome letter's whole job is to tell a student where her class is
    // and where her book is. The book is optional here - a group can genuinely
    // not have one yet, and the admin screen is what insists on the link
    // before it will send - but a group name is not: without it the letter
    // welcomes her to nothing in particular.
    if ((template as string) === "course_welcome") {
      const groupName = (payload!.group_name || "").trim();
      if (!groupName) {
        return new Response(JSON.stringify({ error: "group_name is required for the course_welcome template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Same rule for the trial-day reminder, whose room arrives as
    // `meeting_url` (the column the booking carries) rather than
    // `class_link_url`. Its book link is optional on purpose: the letter is a
    // reminder, so a missing book costs it a second link, not its send.
    if ((template as string) === "trial_reminder") {
      const room = ((payload! as { meeting_url?: string }).meeting_url || "").trim();
      if (!room) {
        return new Response(JSON.stringify({ error: "meeting_url is required for the trial_reminder template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // A payment letter exists to state a figure. Without one it is a request
    // for money with a blank where the amount belongs, which is worse than
    // sending nothing at all.
    if ((template as string) === "private_bundle_payment") {
      const owed = Number((payload! as { amount?: number | string }).amount);
      if (!Number.isFinite(owed) || owed <= 0) {
        return new Response(JSON.stringify({ error: "a positive amount is required for the private_bundle_payment template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // Both links in the second ask are the confirmation page carrying this
    // booking's own token. Without it the letter asks the reader to confirm
    // and then cannot tell who confirmed.
    if ((template as string) === "trial_reask") {
      const token = (payload!.confirmation_token || "").trim();
      if (!token) {
        return new Response(JSON.stringify({ error: "confirmation_token is required for the trial_reask template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    // The free-text sender carries no words of its own, so an empty subject or
    // body is not a letter with a gap in it - it is a blank page going out
    // under the school's name. Rejected here rather than rendered.
    if ((template as string) === "admin_message") {
      const adminSubject = ((payload! as { subject?: string }).subject || "").trim();
      const adminBody = ((payload! as { body?: string }).body || "").trim();
      if (!adminSubject || !adminBody) {
        return new Response(JSON.stringify({ error: "subject and body are both required for the admin_message template" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let subject: string;
    let html: string;
    let emailAttachments: Array<{ filename: string; content: string; content_type?: string }> | undefined;

    // `placement_result` is dispatched AHEAD of the switch rather than as a
    // case inside it, because its key is deliberately absent from the template
    // union in common.ts. That file is 18 KB and is the single import of all
    // 25 existing templates, and the only write path available here is a
    // whole-file rewrite: a transcription slip in it breaks every letter
    // Klovers sends. The only caller of this template is a database trigger,
    // which is not type-checked against that union in any case. If common.ts
    // is ever opened for another reason, move this into the switch.
    // `admin_message` is here for exactly the reason given above, and is the
    // second key deliberately absent from that union. `trial_guide` is the
    // third, `trial_reask` the fourth, `class_reminder` the fifth,
    // `trial_reminder` the sixth, `private_bundle_payment` the seventh and
    // `course_welcome` the eighth; their only callers are the send-trial-guide
    // cron, the send-trial-reask endpoint, the send-class-reminders cron, the
    // send-trial-reminder cron, the admin_send_bundle_payment_ask database
    // function and the admin Groups screen.
    if ((template as string) === "admin_message") {
      const adminMessage = buildAdminMessageEmail(payload!);
      subject = adminMessage.subject;
      html = adminMessage.html;
    } else if ((template as string) === "placement_result") {
      const placementResult = buildPlacementResultEmail(payload!);
      subject = placementResult.subject;
      html = placementResult.html;
    } else if ((template as string) === "trial_guide") {
      const trialGuide = buildTrialGuideEmail(payload!);
      subject = trialGuide.subject;
      html = trialGuide.html;
    } else if ((template as string) === "trial_reask") {
      const trialReask = buildTrialReaskEmail(payload!);
      subject = trialReask.subject;
      html = trialReask.html;
    } else if ((template as string) === "class_reminder") {
      const classReminder = buildClassReminderEmail(payload!);
      subject = classReminder.subject;
      html = classReminder.html;
    } else if ((template as string) === "course_welcome") {
      const courseWelcome = buildCourseWelcomeEmail(payload!);
      subject = courseWelcome.subject;
      html = courseWelcome.html;
    } else if ((template as string) === "trial_reminder") {
      const trialReminder = buildTrialReminderEmail(payload!);
      subject = trialReminder.subject;
      html = trialReminder.html;
    } else if ((template as string) === "private_bundle_payment") {
      const bundlePayment = buildPrivateBundlePaymentEmail(payload!);
      subject = bundlePayment.subject;
      html = bundlePayment.html;
    } else switch (template) {
      case "welcome":
        ({ subject, html } = buildWelcomeEmail(name, language || "en"));
        break;
      case "group_match":
        ({ subject, html } = buildGroupMatchEmail(payload!));
        break;
      case "slot_confirmed":
        ({ subject, html } = buildSlotConfirmedEmail(payload!));
        break;
      case "approval":
        ({ subject, html } = buildApprovalEmail(payload!));
        break;
      case "pending_review":
        ({ subject, html } = buildPendingReviewEmail(payload!));
        break;
      case "payment_confirmed":
        ({ subject, html } = buildPaymentConfirmedEmail(payload!));
        break;
      case "class_link": {
        const classLinkResult = buildClassLinkEmail(payload!);
        subject = classLinkResult.subject;
        html = classLinkResult.html;
        if (classLinkResult.icsAttachment) emailAttachments = [classLinkResult.icsAttachment];
        break;
      }
      // Takes the whole payload since 2026-09-15. It used to be called with
      // (name, enrollment_id, language), which is why the letter could not
      // print a price - the amount was in the payload the whole time and the
      // template was never handed it.
      case "payment_method_reminder":
        ({ subject, html } = buildPaymentMethodReminderEmail(payload!));
        break;
      case "rejection":
        ({ subject, html } = buildRejectionEmail(payload!));
        break;
      case "trial_confirmed": {
        const trialResult = buildTrialConfirmedEmail(payload!);
        subject = trialResult.subject;
        html = trialResult.html;
        if (trialResult.icsAttachment) emailAttachments = [trialResult.icsAttachment];
        break;
      }
      case "trial_rebook_request":
        ({ subject, html } = buildTrialRebookEmail(payload!));
        break;
      case "trial_prep":
        ({ subject, html } = buildTrialPrepEmail(payload!));
        break;
      case "trial_followup_day1":
        ({ subject, html } = buildTrialFollowupDay1Email(payload!));
        break;
      case "trial_followup_day3":
        ({ subject, html } = buildTrialFollowupDay3Email(payload!));
        break;
      case "trial_followup_day7":
        ({ subject, html } = buildTrialFollowupDay7Email(payload!));
        break;
      case "group_forming":
        ({ subject, html } = buildGroupFormingEmail(payload!));
        break;
      case "receipt_nudge":
        ({ subject, html } = buildReceiptNudgeEmail(payload!));
        break;
      case "group_forming_escalation":
        ({ subject, html } = buildGroupFormingEscalationEmail(payload!));
        break;
      case "rejection_followup":
        ({ subject, html } = buildRejectionFollowupEmail(payload!));
        break;
      case "pre_class_reminder":
        ({ subject, html } = buildPreClassReminderEmail(payload!));
        break;
      case "class_feedback":
        ({ subject, html } = buildClassFeedbackEmail(payload!));
        break;
      case "trial_attendance_confirmation": {
        const attendResult = buildTrialAttendanceConfirmationEmail(payload!);
        subject = attendResult.subject;
        html = attendResult.html;
        if (attendResult.icsAttachment) emailAttachments = [attendResult.icsAttachment];
        break;
      }
      case "trial_group_full":
        ({ subject, html } = buildTrialGroupFullEmail(payload!));
        break;
      case "trial_rollover":
        ({ subject, html } = buildTrialRolloverEmail(payload!));
        break;
      case "enrollment":
      default:
        ({ subject, html } = buildEnrollmentEmail(payload!));
        break;
    }

    // Re's ask (14 Nov 2026): every email a trial student gets, from the
    // booking confirmation through to the trial-day reminder and the
    // post-trial follow-ups, should land in her own inbox too — same
    // subject, same body, same links (the real meeting_url, the real
    // confirmation token) — not a summary of it, the actual letter the
    // student received. That way nothing about trial assigning, booking or
    // follow-up can go wrong for a real student without her seeing it happen
    // to a "student" of her own first.
    //
    // Every trial-facing template's slug starts with "trial_"
    // (trial_confirmed, trial_prep, trial_reminder, trial_guide,
    // trial_reask, trial_rollover, trial_followup_day1/3/7,
    // trial_attendance_confirmation, trial_group_full,
    // trial_rebook_request) — group-class and payment templates
    // (class_reminder, course_welcome, payment_method_reminder, etc.) do
    // not, so this widens on its own as new trial letters are added without
    // a template-name list to keep in sync here.
    const bccList = (template as string).startsWith("trial_") ? [TRIAL_BCC_EMAIL] : undefined;

    // Present only when the CALLER passed an unsubscribe token, and that is
    // what scopes this correctly without a list of template names to keep in
    // step: the senders that write to a list (trial followups, the second ask,
    // the trial-day reminder) resolve a token and pass it, while the
    // transactional letters — booking confirmed, payment, class link, the
    // course welcome — do not, and must not. You do not get to opt out of
    // being told your class moved.
    const unsubscribeUrl = listUnsubscribeUrl(
      (payload! as { unsubscribe_token?: string }).unsubscribe_token,
      language === "ar",
    );

    const result = await sendEmail(email, subject, html, emailAttachments, bccList, unsubscribeUrl);
    console.log(`Email sent to ${email} (${template || "enrollment"}):`, result);
    await logEmail({ template: template || "enrollment", toEmail: email, toName: name, status: "sent", resendId: result.id });

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Email error:", msg);
    // best-effort log — payload may be undefined if error happened during req.json()
    try {
      if (payload) {
        await logEmail({ template: payload.template || "unknown", toEmail: payload.email || "unknown", toName: payload.name, status: "failed", error: msg });
      }
    } catch { /* ignore */ }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
