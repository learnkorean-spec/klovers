import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { authorizationError, authorizeRequest } from "../_shared/authorize.ts";
import { levelLabel, type EmailLanguage } from "../_shared/levelLabel.ts";

// The templates live in ./templates/ since 2026-09-01. This file had grown to
// ~128 KB, past what the GitHub contents API accepts in a single write, which
// made it impossible to edit through the assistant's only write path. The
// split is a pure move - all 25 templates were rendered before and after, in
// both languages, and the output matched byte for byte.
import type {
  EmailPayload,
} from "./templates/common.ts";
import {
  buildTrialConfirmedEmail,
  buildTrialAttendanceConfirmationEmail, buildTrialGroupFullEmail,
  buildTrialRolloverEmail, buildTrialPrepEmail, buildTrialFollowupDay1Email,
  buildTrialFollowupDay3Email, buildTrialFollowupDay7Email,
} from "./templates/trial.ts";
// The invitation lives on its own since 2026-09-02, so its copy can be edited
// without resending 58 KB of trial.ts. trial.ts still exports a stale copy of
// buildTrialRebookEmail that nothing imports - delete it there next time that
// file is opened.
import { buildTrialRebookEmail } from "./templates/trialRebook.ts";
import {
  buildWelcomeEmail, buildEnrollmentEmail, buildGroupMatchEmail,
  buildSlotConfirmedEmail, buildApprovalEmail, buildPendingReviewEmail,
  buildRejectionEmail, buildPaymentMethodReminderEmail,
  buildPaymentConfirmedEmail, buildGroupFormingEmail, buildReceiptNudgeEmail,
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
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";

/**
 * Where a reply actually lands.
 *
 * Mail goes out from noreply@, and several templates — the trial invitation
 * among them — invite the reader to "reply to this email". Without this header
 * every one of those replies is dropped on the floor, and the people who reply
 * rather than click are usually the ones with a single question holding them
 * back. Mirrors CONTACT_EMAIL in src/lib/siteConfig.ts; edge functions cannot
 * import from src/, so keep the two in step by hand.
 */
const REPLY_TO_EMAIL = "koreanlovers.net@gmail.com";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

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
  attachments?: Array<{ filename: string; content: string; content_type?: string }>
) {
  const body: Record<string, unknown> = {
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to: [to],
    subject,
    html,
  };
  if (attachments?.length) body.attachments = attachments;
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

    let subject: string;
    let html: string;
    let emailAttachments: Array<{ filename: string; content: string; content_type?: string }> | undefined;

    switch (template) {
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
      case "payment_method_reminder":
        ({ subject, html } = buildPaymentMethodReminderEmail(name, payload!.enrollment_id!, language || "en"));
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

    const result = await sendEmail(email, subject, html, emailAttachments);
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
