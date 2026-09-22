// ⚠️ DISABLED as of 20260922100000_stop_admin_notification_emails.sql.
//
// Nothing calls this anymore. It used to be invoked by trg_notify_admin_email
// on EVERY insert into admin_notifications — every signup, every payment,
// every trial booking, every system alert — which meant one immediate email
// per event, all day. Re asked (22 Sep 2026) for that to stop and be
// replaced by a single weekly report instead; see
// supabase/functions/send-weekly-report and
// supabase/migrations/20260922100000_stop_admin_notification_emails.sql /
// 20260922100100_weekly_report_cron.sql.
//
// Left in place rather than deleted in case a future feature wants an
// instant single-event email again (e.g. a genuinely urgent alert type) and
// can reattach a trigger to it deliberately — don't resurrect the old
// fire-on-every-insert trigger by accident.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { adminRecipients } from "../_shared/adminRecipients.ts";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Message and type come from an admin_notifications row. Nothing writes those
 * columns from user input today, but they are text columns in a table any
 * future feature could write to, and this string goes straight into an HTML
 * document. Escaping here costs nothing and removes the question.
 */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const record = payload.record || payload;

    const rawMessage = String(record.message || "New notification");
    const rawType = String(record.type || "info");
    const message = esc(rawMessage);
    const type = esc(rawType);
    const createdAt = record.created_at
      ? new Date(record.created_at).toLocaleString("en-US", { timeZone: "Africa/Cairo" })
      : new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" });

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

    /**
     * DARK MODE
     * ---------
     * The previous version was a bare <div> with no document wrapper, no
     * color-scheme declaration, and no background on the outer container. In a
     * dark-mode client that produces the worst case: the client force-inverts
     * what it can, the transparent outer area stays dark, and #374151 body text
     * sits on it unreadable. The white card inverted to near-black while its
     * text stayed dark grey.
     *
     * Three things fix it, and all three are needed:
     *
     *   1. A real document with <meta name="color-scheme"> and
     *      "supported-color-schemes". This is what tells Gmail, Apple Mail and
     *      Outlook that the email handles both schemes itself, which stops the
     *      blunt automatic inversion.
     *   2. prefers-color-scheme overrides that repaint deliberately, so dark
     *      mode is a designed state rather than an inverted accident.
     *   3. An explicit background on EVERY container including the outer one.
     *      A transparent container borrows the client's own background, which
     *      is the single most common way an email breaks in dark mode.
     *
     * bgcolor attributes sit alongside the CSS because Outlook on Windows
     * ignores much of the CSS but honours the attribute.
     *
     * The black header and yellow button are left alone in both schemes: they
     * are already high-contrast and on-brand either way.
     */
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>KLovers Admin Alert</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }

  @media (prefers-color-scheme: dark) {
    .page  { background: #0f0f0f !important; }
    .card  { background: #1b1b1b !important; border-color: #333333 !important; }
    .t-key { color: #ffffff !important; }
    .t-val { color: #d6d6d6 !important; }
    .t-mut { color: #8a8a8a !important; }
  }
</style>
</head>
<body class="page" bgcolor="#f5f5f5" style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="#f5f5f5" style="background:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <tr>
            <td bgcolor="#000000" style="background:#000000;padding:20px 30px;border-radius:8px 8px 0 0;text-align:center;">
              <h2 style="margin:0;color:#FFFF00;font-size:20px;font-family:Arial,Helvetica,sans-serif;">KLovers Admin Alert</h2>
            </td>
          </tr>

          <tr>
            <td class="card" bgcolor="#ffffff" style="background:#ffffff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">

              <p style="margin:0 0 8px;font-size:15px;font-family:Arial,Helvetica,sans-serif;">
                <span class="t-key" style="color:#111827;font-weight:bold;">Type:</span>
                <span class="t-val" style="color:#374151;">${type}</span>
              </p>

              <p style="margin:0 0 8px;font-size:15px;font-family:Arial,Helvetica,sans-serif;">
                <span class="t-key" style="color:#111827;font-weight:bold;">Message:</span>
                <span class="t-val" style="color:#374151;">${message}</span>
              </p>

              <p class="t-mut" style="color:#6b7280;font-size:13px;margin:16px 0 0;font-family:Arial,Helvetica,sans-serif;">
                ${createdAt} (Cairo time)
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto 0;">
                <tr>
                  <td bgcolor="#FFFF00" style="background:#FFFF00;border-radius:6px;">
                    <a href="https://kloversegy.com/admin"
                       style="display:inline-block;padding:10px 24px;color:#000000;text-decoration:none;font-size:14px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">
                      Open Admin Dashboard
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <tr>
            <td class="t-mut" align="center" style="color:#999999;font-size:11px;padding-top:16px;font-family:Arial,Helvetica,sans-serif;">
              Automated notification from KLovers
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Both mailboxes, so an alert about kloversegy.com is readable from
    // kloversegy.com and not only from one personal inbox.
    const to = adminRecipients();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        reply_to: REPLY_TO_EMAIL,
        to,
        subject: `[KLovers] ${rawType}: ${rawMessage.substring(0, 80)}`,
        html,
        // A plain-text part is what a client falls back to when it cannot or
        // will not render the HTML, and its absence is also a spam signal on a
        // domain that has no DMARC record yet.
        text: `KLovers Admin Alert\n\nType: ${rawType}\nMessage: ${rawMessage}\n\n${createdAt} (Cairo time)\n\nOpen the admin dashboard: https://kloversegy.com/admin`,
      }),
    });

    const result = await res.json();
    console.log(`Email sent to ${to.join(", ")}:`, JSON.stringify(result));

    return new Response(JSON.stringify({ success: true, to, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("notify-admin-email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
