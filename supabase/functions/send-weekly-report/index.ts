// Weekly report — replaces the per-event "KLovers Admin Alert" email that
// notify-admin-email used to fire on every single admin_notifications insert
// (every signup, every payment, every trial booking, every system alert).
// Re, 22 Sep 2026: "this email is unnecessary, stop it, and only send on the
// weekend Saturday with the week report — who signed up and important
// information related to the website."
//
// So: one email, once a week, Saturday morning Cairo time. The trigger that
// called notify-admin-email on every admin_notifications row is dropped in
// supabase/migrations/20260922100000_stop_admin_notification_emails.sql —
// this function is the replacement, not an addition. admin_notifications
// itself keeps being written to on every event exactly as before, so the
// in-app notification center is unaffected; only the "email me right now"
// side effect is gone, folded into this weekly digest instead.
//
// Content, per Re's ask:
//   - Who signed up this week (name / email / country / when)
//   - Trial bookings and payments this week, with revenue
//   - Any system alerts (cron/pgnet/etc.) logged this week, so real technical
//     problems aren't silently buried now that they no longer email instantly
//
// Triggered hourly by pg_cron with a guard so it only sends once, on the
// Saturday-in-Cairo tick — checked against the real Cairo-local weekday and
// hour, not fixed UTC values, so the gate stays correct across the DST
// boundary (same technique funnel-digest uses for its daily 8am send).
//
// verify_jwt MUST stay false (supabase/config.toml) — the same trap
// send-trial-guide hit on 15 Sep 2026: deployed with the default true, the
// gateway answers 401 UNAUTHORIZED_INVALID_JWT_FORMAT to pg_cron's
// Bearer <service_role_key> before a line of this file runs. Because the
// gateway can't be trusted to gate this, isCronOrAdmin() below does — the
// same check send-trial-guide and send-trial-reminder use, so the endpoint
// is neither open-to-anyone (this response carries every new signup's name,
// email and country) nor blockable by the gateway's own JWT check. It also
// doubles as the auth for AdminNotifications.tsx's "Send now" button: an
// admin's own session JWT passes it, so no separate secret is needed there.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, cairoHour, cairoWeekday, shiftDateKey, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { adminRecipients } from "../_shared/adminRecipients.ts";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

/** WEEKLY_REPORT_TO overrides the recipient list for just this report, same pattern as FUNNEL_DIGEST_TO. */
function reportRecipients(): string[] {
  const override = Deno.env.get("WEEKLY_REPORT_TO");
  if (override) {
    const list = override.split(",").map((s) => s.trim()).filter((s) => s.includes("@"));
    if (list.length > 0) return list;
  }
  return adminRecipients();
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface Signup { name: string | null; email: string | null; country: string | null; created_at: string }
interface AlertGroup { type: string; count: number; latest_message: string }

interface ReportData {
  rangeLabel: string;
  signups: Signup[];
  signupsTotal: number;
  trialBookings: number;
  paidCount: number;
  revenue: number;
  currency: string;
  registeredTotal: number;
  revenueTotal: number;
  alerts: AlertGroup[];
}

/**
 * DARK MODE — same three-part fix as notify-admin-email and funnel-digest:
 * color-scheme meta so clients stop force-inverting, prefers-color-scheme
 * overrides that repaint deliberately, and an explicit background on every
 * container (a transparent one borrows the client's own background, which is
 * how these emails have broken in the past).
 */
const STYLE = `
  :root { color-scheme: light dark; supported-color-schemes: light dark; }

  @media (prefers-color-scheme: dark) {
    .page   { background: #0f0f0f !important; }
    .card   { background: #1b1b1b !important; border-color: #333333 !important; }
    .band   { background: #242424 !important; }
    .cell   { border-bottom-color: #333333 !important; }
    .t-body { color: #e4e4e4 !important; }
    .t-mut  { color: #9a9a9a !important; }
    .t-good { color: #6ee7a8 !important; }
  }
`;

function buildHtml(data: ReportData): string {
  const td = `padding:6px 10px;border-bottom:1px solid #eeeeee;`;
  const h3 = `margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;`;

  const signupRows = data.signups.length === 0
    ? `<tr><td colspan="4" class="t-mut" style="padding:10px;color:#666666;text-align:center;">No new signups this week</td></tr>`
    : data.signups.map((s) => {
        const when = new Date(s.created_at).toLocaleString("en-US", { timeZone: "Africa/Cairo", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
        return `<tr>` +
          `<td class="cell t-body" style="${td}color:#222222;">${esc(s.name || "no name")}</td>` +
          `<td class="cell t-body" style="${td}color:#222222;">${esc(s.email || "no email")}</td>` +
          `<td class="cell t-mut" style="${td}color:#666666;">${esc(s.country || "—")}</td>` +
          `<td class="cell t-mut" style="${td}color:#666666;white-space:nowrap;">${when}</td>` +
          `</tr>`;
      }).join("");

  const alertRows = data.alerts.length === 0
    ? `<tr><td colspan="2" class="t-good" style="padding:10px;color:#007700;text-align:center;">✓ No system alerts this week</td></tr>`
    : data.alerts.map((a) =>
        `<tr>` +
        `<td class="cell t-body" style="${td}color:#222222;"><strong>${esc(a.type)}</strong> × ${a.count}<br><span class="t-mut" style="color:#666666;font-size:12px;">${esc(a.latest_message)}</span></td>` +
        `</tr>`
      ).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Klovers Weekly Report — ${data.rangeLabel}</title>
<style>${STYLE}</style>
</head>
<body class="page" bgcolor="#f5f5f5" style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="#f5f5f5" style="background:#f5f5f5;">
<tr><td align="center" style="padding:20px;">

<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#ffffff" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #dddddd;">
  <tr><td bgcolor="#000000" style="background:#000000;padding:18px 24px;color:#FFFF00;font-weight:bold;font-size:16px;border-radius:12px 12px 0 0;">📬 Klovers Weekly Report — ${data.rangeLabel}</td></tr>
  <tr><td style="padding:24px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="band" bgcolor="#fafafa" style="margin-bottom:24px;background:#fafafa;border-radius:8px;">
      <tr>
        <td style="padding:16px;text-align:center;border-right:1px solid #eeeeee;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">New signups</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${data.signupsTotal}</div></td>
        <td style="padding:16px;text-align:center;border-right:1px solid #eeeeee;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">Trial bookings</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${data.trialBookings}</div></td>
        <td style="padding:16px;text-align:center;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">Payments</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${data.paidCount}</div><div class="t-mut" style="font-size:11px;color:#666666;">${data.revenue} ${data.currency}</div></td>
      </tr>
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">Who signed up this week</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:24px;">
      <tr class="band" bgcolor="#fafafa" style="background:#fafafa;"><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">Name</th><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">Email</th><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">Country</th><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">When (Cairo)</th></tr>
      ${signupRows}
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">System alerts this week</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:24px;">
      ${alertRows}
    </table>

    <p class="t-mut" style="color:#666666;font-size:12px;margin:0;">Totals to date: <strong>${data.registeredTotal}</strong> registered · <strong>${data.revenueTotal} ${data.currency}</strong> revenue.</p>

  </td></tr>
  <tr><td bgcolor="#000000" style="background:#000000;padding:14px 24px;color:#999999;font-size:11px;border-radius:0 0 12px 12px;">Sent once a week, Saturday morning · <a href="https://kloversegy.com/admin" style="color:#FFFF00;">Open admin</a></td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

function buildText(data: ReportData): string {
  const lines: string[] = [];
  lines.push(`KLOVERS WEEKLY REPORT — ${data.rangeLabel}`);
  lines.push("");
  lines.push(`New signups: ${data.signupsTotal}`);
  lines.push(`Trial bookings: ${data.trialBookings}`);
  lines.push(`Payments: ${data.paidCount} (${data.revenue} ${data.currency})`);
  lines.push("");

  lines.push("WHO SIGNED UP THIS WEEK");
  if (data.signups.length === 0) {
    lines.push("  No new signups this week");
  } else {
    for (const s of data.signups) {
      lines.push(`  ${s.name || "no name"} <${s.email || "no email"}> — ${s.country || "no country"} — ${s.created_at}`);
    }
  }
  lines.push("");

  lines.push("SYSTEM ALERTS THIS WEEK");
  if (data.alerts.length === 0) {
    lines.push("  None");
  } else {
    for (const a of data.alerts) lines.push(`  ${a.type} x${a.count}: ${a.latest_message}`);
  }
  lines.push("");

  lines.push(`Totals to date: ${data.registeredTotal} registered, ${data.revenueTotal} ${data.currency} revenue.`);
  lines.push("");
  lines.push("Open admin: https://kloversegy.com/admin");

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("missing env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / RESEND_API_KEY)");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!(await isCronOrAdmin(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Cron fires hourly; only proceed on the Saturday-in-Cairo 08:00 tick
    // (one report/week). ?force=1 (cron secret or an admin's own session,
    // per the check above — e.g. the "Send now" button) bypasses both
    // guards for a manual send.
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const now = new Date();
    const weekdayCairo = cairoWeekday(now);
    const hourCairo = cairoHour(now);
    if (!force && (weekdayCairo !== 6 || hourCairo !== 8)) {
      return new Response(JSON.stringify({ ok: true, skipped: true, weekdayCairo, hourCairo }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Trailing 7 days ending this morning, Cairo-local midnight boundaries —
    // real IANA conversion, correct on both sides of the DST boundary.
    const todayCairo = cairoDateKey(now);
    const weekAgoCairo = shiftDateKey(todayCairo, -7);
    const since = zonedMidnightUtc(weekAgoCairo).toISOString();
    const until = zonedMidnightUtc(todayCairo).toISOString();
    const rangeLabel = `${weekAgoCairo} – ${shiftDateKey(todayCairo, -1)}`;

    // ── Who signed up ────────────────────────────────────────────────────
    const { data: signupRows, error: signupErr } = await supabase
      .from("profiles")
      .select("name, email, country, created_at")
      .gte("created_at", since)
      .lt("created_at", until)
      .order("created_at", { ascending: true });
    if (signupErr) throw signupErr;
    const signups: Signup[] = signupRows ?? [];

    const { count: registeredTotal } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // ── Trial bookings ──────────────────────────────────────────────────
    // Status casing isn't guaranteed consistent (notify_new_trial_booking
    // itself upper()s before comparing), so filter case-insensitively in JS
    // rather than risk a column filter silently missing "Cancelled" rows.
    const { data: trialRows } = await supabase
      .from("trial_bookings")
      .select("status")
      .gte("created_at", since)
      .lt("created_at", until);
    const trialBookings = (trialRows ?? []).filter(
      (r) => (r.status ?? "").toUpperCase() !== "CANCELLED",
    ).length;

    // ── Payments ────────────────────────────────────────────────────────
    // payment_date is null on some historical PAID rows (same gap
    // send_daily_numbers_digest works around), so the window filter uses
    // coalesce(payment_date, created_at) in JS rather than a column filter
    // that would silently drop those rows.
    const { data: allPaid } = await supabase
      .from("enrollments")
      .select("amount, currency, payment_date, created_at")
      .is("deleted_at", null)
      .eq("payment_status", "PAID");

    const sinceMs = new Date(since).getTime();
    const untilMs = new Date(until).getTime();
    const paidThisWeek = (allPaid ?? []).filter((r) => {
      const at = r.payment_date ?? r.created_at;
      if (at == null) return false;
      const atMs = new Date(at).getTime();
      return atMs >= sinceMs && atMs < untilMs;
    });
    const paidCount = paidThisWeek.length;
    const revenue = paidThisWeek.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
    const currency = paidThisWeek[0]?.currency ?? allPaid?.[0]?.currency ?? "EGP";
    const revenueTotal = (allPaid ?? []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

    // ── System alerts (the technical notifications that used to email
    //    instantly on their own) — grouped so a repeated failure shows as
    //    one line with a count, not a flood. ──────────────────────────────
    const { data: alertRows } = await supabase
      .from("admin_notifications")
      .select("type, message, created_at")
      .eq("category", "system")
      .gte("created_at", since)
      .lt("created_at", until)
      .order("created_at", { ascending: false });

    const alertMap = new Map<string, { count: number; latest_message: string }>();
    for (const r of (alertRows ?? [])) {
      const existing = alertMap.get(r.type);
      if (existing) {
        existing.count++;
      } else {
        alertMap.set(r.type, { count: 1, latest_message: r.message });
      }
    }
    const alerts: AlertGroup[] = [...alertMap.entries()]
      .map(([type, v]) => ({ type, ...v }))
      .sort((a, b) => b.count - a.count);

    const report: ReportData = {
      rangeLabel,
      signups,
      signupsTotal: signups.length,
      trialBookings: trialBookings ?? 0,
      paidCount,
      revenue,
      currency,
      registeredTotal: registeredTotal ?? 0,
      revenueTotal,
      alerts,
    };

    const html = buildHtml(report);
    const text = buildText(report);
    const to = reportRecipients();
    const subject = `📬 Klovers weekly report — ${rangeLabel} · ${report.signupsTotal} signups`;

    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, reply_to: REPLY_TO_EMAIL, to, subject, html, text }),
    });
    if (!sent.ok) {
      const errText = await sent.text();
      throw new Error(`Resend ${sent.status}: ${errText}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: true, to, ...report, signups: undefined }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-weekly-report error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
