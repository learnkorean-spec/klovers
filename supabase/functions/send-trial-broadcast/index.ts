import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://kloversegy.com";
const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

/**
 * The address Gmail/Yahoo POST to for a one-click unsubscribe (RFC 8058).
 *
 * This must be a server route. It used to be `${SITE_URL}/unsubscribe?token=`,
 * which is a client-side React route: the POST gets an empty HTML shell with a
 * 200, nothing is written, and the provider records an unsubscribe we never
 * honoured. The edge function below writes the row.
 */
function headerUnsubscribeUrl(token: string | null): string {
  return token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=ar`
    : `${SITE_URL}/unsubscribe`;
}

/** The link a human clicks in the footer -- the page, not the endpoint. */
function footerUnsubscribeUrl(token: string | null): string {
  return token ? `${SITE_URL}/unsubscribe?token=${token}` : `${SITE_URL}/unsubscribe`;
}

type Recipient = {
  email: string;
  name: string | null;
  unsubscribe_token: string | null;
  user_id: string | null;
  level: string | null;
  origin: "profile" | "lead";
};

// Resend batch API -- sends up to 100 emails per call
async function sendBatch(emails: { to: string; subject: string; html: string; text: string; unsubscribeUrl: string }[]) {
  const payload = emails.map((e) => ({
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to: [e.to],
    subject: e.subject,
    html: e.html,
    text: e.text,
    headers: {
      // RFC 8058 one-click unsubscribe — required by Gmail/Yahoo bulk sender guidelines
      "List-Unsubscribe": `<${e.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }));
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend batch error: ${await res.text()}`);
  return await res.json();
}

function buildBroadcastEmail(
  name: string | null,
  unsubscribeToken: string | null,
): { subject: string; html: string; text: string } {
  const displayName = name?.trim() || "Student";
  const unsubUrl = footerUnsubscribeUrl(unsubscribeToken);

  const subject = "Free Korean Class — احجز مجاناً 🎓";

  // Plain-text version (deliverability + accessibility)
  const text = `Hi ${displayName},

We're opening FREE trial Korean classes and you're invited! 🌟

TRIAL SCHEDULE (Cairo Time):
• Saturday   — 4:00 PM
• Sunday     — 6:30 PM
• Wednesday  — 5:30 PM

⏰ Booking closes 1 day before each class.

Book now → ${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast

---
أهلاً ${displayName}،

نفتح حصصًا تجريبية مجانية في اللغة الكورية، والدعوة مفتوحة لحجز مقعد الآن.

المواعيد (توقيت القاهرة):
• السبت    — 4:00 مساءً
• الأحد    — 6:30 مساءً
• الأربعاء — 5:30 مساءً

الأماكن محدودة وتكتمل بسرعة.
احجز: ${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast

---
To unsubscribe: ${unsubUrl}
KLovers Academy — kloversegy.com`;

  const html = `
<!DOCTYPE html>
<html lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 16px 8px !important; }
      .email-body { padding: 24px 20px !important; }
      .cta-btn { padding: 14px 28px !important; font-size: 15px !important; }
      .slot-table td { font-size: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Arial,sans-serif;">
<!-- Preheader: shown in inbox preview, hidden in email body -->
<div style="display:none;font-size:1px;color:#f3f4f6;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  Book a free live Korean class — limited spots, no credit card. احجز كلاسك المجاني الآن! 🎓
</div>
<table class="email-wrapper" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

  <!-- Header -->
  <tr>
    <td style="background:#000000;padding:32px 40px;text-align:center;">
      <p style="margin:0 0 8px;color:#FFFF00;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">KLovers Academy</p>
      <h1 style="margin:0;color:#ffffff;font-size:23px;font-weight:700;line-height:1.4;">
        🎓 Free Trial Class — Limited Spots!<br>
        <span style="font-size:19px;color:#e5e5e5;">كلاس تجريبي مجاني — أماكن محدودة!</span>
      </h1>
    </td>
  </tr>

  <!-- Body -->
  <tr>
    <td class="email-body" style="padding:36px 40px;">

      <!-- English -->
      <p style="color:#374151;font-size:17px;line-height:1.8;margin:0 0 10px;">
        Hi <strong>${displayName}</strong>,
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
        We're opening <strong>free trial Korean classes</strong> and you're invited to book your spot! 🌟
      </p>
      <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
        Spots are limited — first come, first served.
      </p>

      <hr style="border:none;border-top:1px dashed #e5e7eb;margin:0 0 24px;">

      <!-- Arabic -->
      <div dir="rtl" style="text-align:right;">
        <p style="color:#374151;font-size:17px;line-height:1.8;margin:0 0 10px;">
          أهلاً <strong>${displayName}</strong>،
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 6px;">
          نفتح <strong>حصصًا تجريبية مجانية</strong> في اللغة الكورية، والدعوة مفتوحة لحجز مقعد الآن.
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.8;margin:0 0 24px;">
          الأماكن محدودة وتكتمل بسرعة.
        </p>
      </div>

      <!-- Schedule box -->
      <div style="background:#fafafa;border:2px solid #FFFF00;border-radius:10px;padding:22px 26px;margin:0 0 20px;">
        <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">📅 Trial Schedule / مواعيد الكلاسات</p>
        <p style="margin:0 0 16px;font-size:12px;color:#6b7280;">Cairo Time / توقيت القاهرة</p>
        <table class="slot-table" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">Saturday / السبت</strong>
              <span style="color:#6b7280;"> — 4:00 PM</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;font-size:15px;">
              🗓️ <strong style="color:#111827;">Sunday / الأحد</strong>
              <span style="color:#6b7280;"> — 6:30 PM</span>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 0;font-size:15px;">
              🗓️ <strong style="color:#111827;">Wednesday / الأربعاء</strong>
              <span style="color:#6b7280;"> — 5:30 PM</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- Deadline -->
      <div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:13px 18px;margin:0 0 28px;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          ⏰ <strong>Booking closes 1 day before each class</strong><br>
          <span dir="rtl">آخر موعد للحجز: يوم واحد قبل الكلاس — لا تأخرش!</span>
        </p>
      </div>

      <!-- CTA -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:0 0 28px;">
          <a href="${SITE_URL}/trial-booking?utm_source=email&utm_medium=broadcast&utm_campaign=trial_broadcast"
             class="cta-btn"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:16px 44px;border-radius:8px;font-size:17px;font-weight:700;display:inline-block;">
            Book My Free Class ← احجز الآن
          </a>
        </td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 18px;">

      <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0 0 10px;text-align:center;">
        Questions? Reply to this email or reach us on WhatsApp.<br>
        <span dir="rtl">للأسئلة: الرد على هذه الرسالة أو التواصل معنا عبر واتساب.</span><br><br>
        <strong style="color:#111827;">The KLovers Team / فريق KLovers</strong>
      </p>

      <!-- Unsubscribe -->
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin:12px 0 0;">
        <a href="${unsubUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe / إلغاء الاشتراك</a>
        &nbsp;·&nbsp; KLovers Academy, Egypt
      </p>

    </td>
  </tr>

</table>
</td></tr></table>
</body></html>`;

  return { subject, html, text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ok = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // ── Admin auth guard ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return err("Unauthorized — admin JWT required", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return err("Unauthorized", 401);

    const { data: roleRow } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return err("Forbidden — admin role required", 403);

    // ── Parse body ────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false;
    // broadcast_key defaults to today's date so the same admin can't fire twice in a day
    const broadcast_key: string = body.broadcast_key ?? `trial_broadcast_${new Date().toISOString().slice(0, 10)}`;
    // Optional level segmentation: only send to people with this level value.
    // E.g. body.level_filter = "beginner" targets only beginners.
    const level_filter: string | null = body.level_filter ?? null;
    // Leads without an account are included by default; pass false to go back to
    // account holders only.
    const include_leads: boolean = body.include_leads !== false;

    // ── Idempotency check ─────────────────────────────────────────────────────
    if (!dry_run) {
      const { data: existing } = await supabase
        .from("trial_broadcasts")
        .select("id, sent_count, created_at")
        .eq("broadcast_key", broadcast_key)
        .maybeSingle();

      if (existing) {
        return err(
          `Broadcast '${broadcast_key}' already sent (${existing.sent_count} emails on ${existing.created_at}). ` +
          `Pass a different broadcast_key to send again.`,
          409
        );
      }
    }

    // ── Fetch both identity tables ────────────────────────────────────────────
    // Unfiltered on email_unsubscribed on purpose: the suppression set is built
    // from every row in both tables before anyone is added to the audience, so a
    // person who unsubscribed on one side is never reachable through the other.
    const [{ data: profiles, error: profileErr }, { data: leads, error: leadErr }] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, name, email, email_unsubscribed, unsubscribe_token, level")
        .not("email", "is", null),
      supabase
        .from("leads")
        .select("user_id, name, email, email_unsubscribed, unsubscribe_token, level, created_at")
        .not("email", "is", null),
    ]);

    if (profileErr) throw profileErr;
    if (leadErr) throw leadErr;

    const key = (e: string | null) => (e ?? "").trim().toLowerCase();

    // Suppression: flagged on EITHER side means do not send. `true` is the only
    // value that suppresses -- false and NULL both mean subscribed.
    const suppressed = new Set<string>();
    for (const row of [...(profiles ?? []), ...(leads ?? [])]) {
      if (row.email_unsubscribed === true && key(row.email)) suppressed.add(key(row.email));
    }

    // Build the audience: profiles first, then leads that add a new address.
    // The profile wins on a collision -- it carries the real account name and
    // the token that the account's own unsubscribe page knows about.
    const byEmail = new Map<string, Recipient>();

    for (const p of profiles ?? []) {
      const k = key(p.email);
      if (!k || suppressed.has(k)) continue;
      if (level_filter && p.level !== level_filter) continue;
      byEmail.set(k, {
        email: p.email as string,
        name: p.name ?? null,
        unsubscribe_token: p.unsubscribe_token ?? null,
        user_id: p.user_id ?? null,
        level: p.level ?? null,
        origin: "profile",
      });
    }

    if (include_leads) {
      // Newest lead row first, so a person captured twice is greeted by the name
      // she gave most recently.
      const sortedLeads = [...(leads ?? [])].sort((a, b) =>
        String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
      );
      for (const l of sortedLeads) {
        const k = key(l.email);
        if (!k || suppressed.has(k) || byEmail.has(k)) continue;
        if (level_filter && l.level !== level_filter) continue;
        byEmail.set(k, {
          email: l.email as string,
          name: l.name ?? null,
          unsubscribe_token: l.unsubscribe_token ?? null,
          user_id: l.user_id ?? null,
          level: l.level ?? null,
          origin: "lead",
        });
      }
    }

    const recipients = [...byEmail.values()];
    const from_profiles = recipients.filter((r) => r.origin === "profile").length;
    const from_leads = recipients.filter((r) => r.origin === "lead").length;
    const without_unsubscribe_link = recipients.filter((r) => !r.unsubscribe_token).length;

    if (!recipients.length) {
      return ok({
        dry_run,
        sent: 0,
        skipped: 0,
        total: 0,
        level_filter,
        include_leads,
        suppressed: suppressed.size,
      });
    }

    // ── Dry run ───────────────────────────────────────────────────────────────
    if (dry_run) {
      return ok({
        dry_run: true,
        sent: 0,
        skipped: recipients.length,
        total: recipients.length,
        from_profiles,
        from_leads,
        without_unsubscribe_link,
        suppressed: suppressed.size,
        level_filter,
        include_leads,
        preview_subject: buildBroadcastEmail("Student", null).subject,
        recipients: recipients.map((r) => r.email),
      });
    }

    // ── Build Resend batch payload ────────────────────────────────────────────
    const BATCH_SIZE = 100; // Resend batch limit
    let totalSent = 0;
    let totalErrors = 0;
    const errorLog: string[] = [];

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      const emails = chunk.map((r) => {
        const { subject, html, text } = buildBroadcastEmail(r.name, r.unsubscribe_token);
        return {
          to: r.email,
          subject,
          html,
          text,
          unsubscribeUrl: headerUnsubscribeUrl(r.unsubscribe_token),
        };
      });

      try {
        await sendBatch(emails);
        totalSent += emails.length;

        // Log lead_events for funnel tracking (non-blocking)
        const events = chunk.map((r) => ({
          session_id: crypto.randomUUID(),
          user_id: r.user_id ?? null,
          source_type: "email",
          source_page: "/email/trial-broadcast",
          cta_label: "trial_broadcast_sent",
          campaign: "trial_broadcast",
          utm_source: "email",
          utm_medium: "broadcast",
        }));
        await supabase.from("lead_events").insert(events).catch((e: unknown) =>
          console.warn("lead_events insert failed:", e)
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[trial-broadcast] Batch ${i}-${i + BATCH_SIZE} failed:`, msg);
        totalErrors += emails.length;
        errorLog.push(msg);
      }
    }

    // ── Record broadcast for idempotency ──────────────────────────────────────
    await supabase.from("trial_broadcasts").insert({
      broadcast_key,
      sent_count: totalSent,
      error_count: totalErrors,
      triggered_by: user.id,
    }).catch((e: unknown) => console.warn("trial_broadcasts insert failed:", e));

    console.log(
      `[trial-broadcast] key=${broadcast_key} sent=${totalSent} errors=${totalErrors} ` +
      `profiles=${from_profiles} leads=${from_leads} suppressed=${suppressed.size}`
    );

    return ok({
      dry_run: false,
      broadcast_key,
      sent: totalSent,
      errors: totalErrors,
      total: recipients.length,
      from_profiles,
      from_leads,
      without_unsubscribe_link,
      suppressed: suppressed.size,
      include_leads,
      errorLog,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[trial-broadcast] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
