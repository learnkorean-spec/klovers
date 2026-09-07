// Daily funnel digest — replaces ad-hoc SQL querying with an automated
// 8am Cairo email summarising yesterday's conversion health.
//
// Sections:
//   - Sessions, signups, multi-touch %
//   - Conversion by entry point (first_source)
//   - Trial form step abandonment
//   - Booking failures (with reasons)
//   - Cron health (followups sent)
//   - Top concerns (auto-flagged thresholds)
//
// Triggered hourly by pg_cron with a guard so it only sends once per day,
// at the 8am Cairo tick — checked against the real Cairo-local hour, not a
// fixed UTC hour, so the gate stays correct across the DST boundary.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, cairoHour, shiftDateKey, zonedMidnightUtc } from "../_shared/cairoTime.ts";
import { adminRecipients } from "../_shared/adminRecipients.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "KLovers Funnel <noreply@kloversegy.com>";

/**
 * This used to be a bare `FUNNEL_DIGEST_TO ?? "learnkorean@kloversegy.com"`.
 * That mailbox is retired — Re confirmed on 2026-09-07 she no longer reads it —
 * so every daily digest for months went somewhere nobody opened.
 *
 * Resolving through the shared list means one place to change, and no address
 * can quietly drift out of use in a single function again. FUNNEL_DIGEST_TO is
 * kept as an override for the case where this one report wants its own list.
 */
function digestRecipients(): string[] {
  const override = Deno.env.get("FUNNEL_DIGEST_TO");
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

interface RowEntry { first_source: string | null; sessions: number; signups: number; booked: number; paid: number; conv_pct: number; paid_pct: number }
interface FunnelStep { label: string; sessions: number }
interface Failure { reason: string; sessions: number }

interface DigestData {
  yesterday: string;
  sessions: number;
  signups: number;
  multiTouch: number;
  byEntry: RowEntry[];
  trialFunnel: FunnelStep[];
  failures: Failure[];
  prepSent: number;
  day1Sent: number;
  day3Sent: number;
  prepWindowTomorrow: number;
  flags: string[];
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${Math.round((100 * n) / d)}%`;
}

/**
 * DARK MODE
 * ---------
 * Same fault PR #292 fixed in notify-admin-email: a light #f5f5f5 body, no
 * color-scheme declaration, every colour hardcoded inline. A dark-mode client
 * force-inverts what it can and the tables come out grey on grey — and this is
 * the one email that has to be readable at a glance every morning.
 *
 * Three parts, all needed:
 *   1. color-scheme / supported-color-schemes meta, so clients stop
 *      auto-inverting and trust the email to handle both.
 *   2. prefers-color-scheme overrides that repaint deliberately.
 *   3. An explicit background on every container — a transparent one borrows
 *      the client's own background, which is how emails break in dark mode.
 *
 * Colours live in classes rather than inline on each row so light and dark are
 * defined once instead of scattered through the row builders. Inline colours
 * remain as the light-mode fallback for clients that drop the <style> block.
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
    .t-bad  { color: #ff8a8a !important; }
  }
`;

function buildHtml(data: DigestData): string {
  const sigPct = pct(data.signups, data.sessions);
  const mtPct = pct(data.multiTouch, data.sessions);

  const td = `padding:6px 10px;border-bottom:1px solid #eeeeee;`;

  const entryRows = data.byEntry.map((r) =>
    `<tr>` +
    `<td class="cell t-body" style="${td}color:#222222;">${r.first_source ?? "(direct)"}</td>` +
    `<td class="cell t-body" style="${td}color:#222222;text-align:right;">${r.sessions}</td>` +
    `<td class="cell t-body" style="${td}color:#222222;text-align:right;">${r.signups}</td>` +
    `<td class="cell t-mut" style="${td}color:#666666;text-align:right;">${r.booked}</td>` +
    `<td class="cell t-good" style="${td}color:#007700;text-align:right;font-weight:bold;">${r.paid}</td>` +
    `<td class="cell t-body" style="${td}color:#222222;text-align:right;">${r.paid_pct}%</td>` +
    `</tr>`
  ).join("");

  const funnelRows = data.trialFunnel.map((s, i, arr) => {
    const dropPct = i === 0 ? "" : pct(arr[i].sessions, arr[i - 1].sessions);
    return `<tr>` +
      `<td class="cell t-body" style="${td}color:#222222;">${s.label}</td>` +
      `<td class="cell t-body" style="${td}color:#222222;text-align:right;">${s.sessions}</td>` +
      `<td class="cell t-mut" style="${td}color:#666666;text-align:right;font-size:12px;">${dropPct}</td>` +
      `</tr>`;
  }).join("");

  const failureRows = data.failures.length === 0
    ? `<tr><td colspan="2" class="t-mut" style="padding:10px;color:#666666;text-align:center;">No booking failures yesterday ✓</td></tr>`
    : data.failures.map(f =>
        `<tr>` +
        `<td class="cell t-bad" style="${td}color:#aa0000;">${f.reason}</td>` +
        `<td class="cell t-body" style="${td}color:#222222;text-align:right;">${f.sessions}</td>` +
        `</tr>`
      ).join("");

  const flagsHtml = data.flags.length === 0
    ? `<p class="t-good" style="color:#007700;margin:0;">✓ No concerns flagged</p>`
    : `<ul class="t-bad" style="margin:0;padding-left:18px;color:#aa0000;">${data.flags.map(f => `<li>${f}</li>`).join("")}</ul>`;

  const h3 = `margin:0 0 8px;font-size:14px;border-bottom:2px solid #FFFF00;display:inline-block;padding-bottom:2px;`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Klovers Funnel Digest — ${data.yesterday}</title>
<style>${STYLE}</style>
</head>
<body class="page" bgcolor="#f5f5f5" style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="page" bgcolor="#f5f5f5" style="background:#f5f5f5;">
<tr><td align="center" style="padding:20px;">

<table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" class="card" bgcolor="#ffffff" style="max-width:640px;width:100%;background:#ffffff;border-radius:12px;border:1px solid #dddddd;">
  <tr><td bgcolor="#000000" style="background:#000000;padding:18px 24px;color:#FFFF00;font-weight:bold;font-size:16px;border-radius:12px 12px 0 0;">📊 Klovers Funnel Digest — ${data.yesterday}</td></tr>
  <tr><td style="padding:24px;">

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="band" bgcolor="#fafafa" style="margin-bottom:24px;background:#fafafa;border-radius:8px;">
      <tr>
        <td style="padding:16px;text-align:center;border-right:1px solid #eeeeee;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">Sessions</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${data.sessions}</div></td>
        <td style="padding:16px;text-align:center;border-right:1px solid #eeeeee;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">Signups</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${data.signups}</div><div class="t-mut" style="font-size:11px;color:#666666;">${sigPct}</div></td>
        <td style="padding:16px;text-align:center;"><div class="t-mut" style="font-size:11px;color:#666666;text-transform:uppercase;">Multi-Touch</div><div class="t-body" style="font-size:24px;font-weight:bold;color:#111111;">${mtPct}</div></td>
      </tr>
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">Conversion by entry point</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:24px;">
      <tr class="band" bgcolor="#fafafa" style="background:#fafafa;"><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">Source</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Sessions</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Signups</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Booked</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Paid</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Paid %</th></tr>
      ${entryRows || `<tr><td colspan="6" class="t-mut" style="padding:10px;color:#666666;text-align:center;">No sessions yesterday</td></tr>`}
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">Trial form funnel</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:24px;">
      <tr class="band" bgcolor="#fafafa" style="background:#fafafa;"><th class="t-body" style="padding:6px 10px;text-align:left;color:#111111;">Step</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">Sessions</th><th class="t-body" style="padding:6px 10px;text-align:right;color:#111111;">% of prev</th></tr>
      ${funnelRows}
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">Booking failures</h3>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;margin-bottom:24px;">
      ${failureRows}
    </table>

    <h3 class="t-body" style="${h3}color:#111111;">Follow-up cron health</h3>
    <p class="t-body" style="font-size:13px;margin:0 0 6px;color:#222222;">Yesterday: <strong>${data.prepSent}</strong> prep · <strong>${data.day1Sent}</strong> day1 · <strong>${data.day3Sent}</strong> day3</p>
    <p class="t-mut" style="font-size:13px;margin:0 0 24px;color:#666666;">Tomorrow's prep window: <strong>${data.prepWindowTomorrow}</strong> trials</p>

    <h3 class="t-body" style="${h3}color:#111111;">Flags</h3>
    <div style="font-size:13px;">${flagsHtml}</div>
  </td></tr>
  <tr><td bgcolor="#000000" style="background:#000000;padding:14px 24px;color:#999999;font-size:11px;border-radius:0 0 12px 12px;">Auto-generated · <a href="https://kloversegy.com/admin" style="color:#FFFF00;">Open admin</a></td></tr>
</table>

</td></tr>
</table>
</body>
</html>`;
}

/**
 * The plain-text part. Built from the same numbers as the HTML, so a client
 * that will not render HTML still gets a usable digest rather than a blank
 * message — and a multipart email is one less spam signal on a domain that has
 * no DMARC enforcement yet.
 */
function buildText(data: DigestData): string {
  const lines: string[] = [];
  lines.push(`KLOVERS FUNNEL DIGEST — ${data.yesterday}`);
  lines.push("");
  lines.push(`Sessions: ${data.sessions}`);
  lines.push(`Signups:  ${data.signups} (${pct(data.signups, data.sessions)})`);
  lines.push(`Multi-touch: ${pct(data.multiTouch, data.sessions)}`);
  lines.push("");

  lines.push("CONVERSION BY ENTRY POINT");
  if (data.byEntry.length === 0) {
    lines.push("  No sessions yesterday");
  } else {
    for (const r of data.byEntry) {
      lines.push(`  ${r.first_source ?? "(direct)"}: ${r.sessions} sessions, ${r.signups} signups, ${r.booked} booked, ${r.paid} paid (${r.paid_pct}%)`);
    }
  }
  lines.push("");

  lines.push("TRIAL FORM FUNNEL");
  data.trialFunnel.forEach((s, i, arr) => {
    const drop = i === 0 ? "" : ` (${pct(arr[i].sessions, arr[i - 1].sessions)} of previous)`;
    lines.push(`  ${s.label}: ${s.sessions}${drop}`);
  });
  lines.push("");

  lines.push("BOOKING FAILURES");
  if (data.failures.length === 0) {
    lines.push("  None yesterday");
  } else {
    for (const f of data.failures) lines.push(`  ${f.reason}: ${f.sessions}`);
  }
  lines.push("");

  lines.push("FOLLOW-UP CRON HEALTH");
  lines.push(`  Yesterday: ${data.prepSent} prep, ${data.day1Sent} day1, ${data.day3Sent} day3`);
  lines.push(`  Tomorrow's prep window: ${data.prepWindowTomorrow} trials`);
  lines.push("");

  lines.push("FLAGS");
  if (data.flags.length === 0) {
    lines.push("  No concerns flagged");
  } else {
    for (const f of data.flags) lines.push(`  - ${f}`);
  }
  lines.push("");
  lines.push("Open admin: https://kloversegy.com/admin");

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !RESEND_API_KEY) {
      throw new Error("missing env (SUPABASE_URL / SERVICE_ROLE_KEY / RESEND_API_KEY)");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Cron fires hourly; only proceed at 8am Cairo local (one digest/day).
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";
    const hourCairo = cairoHour();
    if (!force && hourCairo !== 8) {
      return new Response(JSON.stringify({ ok: true, skipped: true, hourCairo }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Yesterday in Cairo — a real IANA conversion, correct on both sides of
    // the DST boundary.
    const todayCairo = cairoDateKey();
    const yLabel = shiftDateKey(todayCairo, -1);
    const tomorrowCairo = shiftDateKey(todayCairo, 1);

    // ── Headline numbers ────────────────────────────────────────────────────
    const { data: hdr } = await supabase.rpc("exec_funnel_digest_headline_v1", {}).select();
    void hdr; // best-effort RPC; fall back to inline counts below

    // Cairo-local yesterday's midnight-to-midnight window, expressed as the
    // UTC instants it actually spans.
    const since = zonedMidnightUtc(yLabel).toISOString();
    const until = zonedMidnightUtc(todayCairo).toISOString();

    const { data: lf } = await supabase
      .from("lead_funnel")
      .select("session_id, first_source, signup_completed, touchpoints, booked_trial, enrolled_paid")
      .gte("first_seen", since)
      .lt("first_seen", until);
    const sessions = lf?.length ?? 0;
    const signups = lf?.filter(r => r.signup_completed).length ?? 0;
    const multiTouch = lf?.filter(r => Array.isArray(r.touchpoints) && r.touchpoints.length >= 2).length ?? 0;

    const byEntryMap = new Map<string, { sessions: number; signups: number; booked: number; paid: number }>();
    for (const r of (lf ?? [])) {
      const k = (r.first_source as string | null) ?? "(direct)";
      const e = byEntryMap.get(k) ?? { sessions: 0, signups: 0, booked: 0, paid: 0 };
      e.sessions++;
      if (r.signup_completed) e.signups++;
      if ((r as { booked_trial?: boolean }).booked_trial) e.booked++;
      if ((r as { enrolled_paid?: boolean }).enrolled_paid) e.paid++;
      byEntryMap.set(k, e);
    }
    const byEntry: RowEntry[] = [...byEntryMap.entries()]
      .map(([k, v]) => ({
        first_source: k,
        sessions: v.sessions,
        signups: v.signups,
        booked: v.booked,
        paid: v.paid,
        conv_pct: v.sessions ? Math.round(100 * v.signups / v.sessions) : 0,
        paid_pct: v.sessions ? Math.round(100 * v.paid / v.sessions) : 0,
      }))
      .sort((a, b) => b.paid - a.paid || b.sessions - a.sessions);

    // ── Trial funnel ────────────────────────────────────────────────────────
    const labelOrder: { key: string[]; label: string }[] = [
      { key: ["landing_viewed"], label: "1. Trial landing viewed" },
      { key: ["homepage_hero_free_trial", "free_trial_landing_primary"], label: "2. Trial CTA clicked" },
      { key: ["slot_page_viewed"], label: "3. Slot page viewed" },
      { key: ["trial_booking_confirm"], label: "4. Booking confirmed" },
    ];
    const trialFunnel: FunnelStep[] = [];
    for (const step of labelOrder) {
      const { data } = await supabase
        .from("lead_events")
        .select("session_id", { count: "exact", head: false })
        .in("cta_label", step.key)
        .gte("created_at", since)
        .lt("created_at", until);
      const uniq = new Set((data ?? []).map((d: any) => d.session_id));
      trialFunnel.push({ label: step.label, sessions: uniq.size });
    }

    // ── Booking failures ────────────────────────────────────────────────────
    const { data: failEvents } = await supabase
      .from("lead_events")
      .select("session_id, metadata")
      .eq("cta_label", "booking_failed")
      .gte("created_at", since)
      .lt("created_at", until);
    const failMap = new Map<string, Set<string>>();
    for (const f of (failEvents ?? [])) {
      const r = ((f.metadata as { reason?: string } | null)?.reason) ?? "(unknown)";
      const set = failMap.get(r) ?? new Set();
      set.add(f.session_id as string);
      failMap.set(r, set);
    }
    const failures: Failure[] = [...failMap.entries()].map(([reason, s]) => ({ reason, sessions: s.size })).sort((a, b) => b.sessions - a.sessions);

    // ── Cron health ─────────────────────────────────────────────────────────
    const { data: cronStats } = await supabase
      .from("trial_bookings")
      .select("followup_prep_sent_at, followup_day1_sent_at, followup_day3_sent_at, trial_date, is_tba");
    const yesterdayPrefix = yLabel; // yyyy-mm-dd
    let prepSent = 0, day1Sent = 0, day3Sent = 0, prepWindowTomorrow = 0;
    for (const r of (cronStats ?? [])) {
      if (r.followup_prep_sent_at && (r.followup_prep_sent_at as string).startsWith(yesterdayPrefix)) prepSent++;
      if (r.followup_day1_sent_at && (r.followup_day1_sent_at as string).startsWith(yesterdayPrefix)) day1Sent++;
      if (r.followup_day3_sent_at && (r.followup_day3_sent_at as string).startsWith(yesterdayPrefix)) day3Sent++;
      if (r.trial_date === tomorrowCairo && r.is_tba !== true) prepWindowTomorrow++;
    }

    // ── Auto-flagged concerns ───────────────────────────────────────────────
    const flags: string[] = [];
    if (sessions > 0 && signups === 0) flags.push("Zero signups yesterday despite traffic");
    if (sessions >= 10 && (multiTouch / sessions) < 0.10) flags.push(`Multi-touch under 10% (${multiTouch}/${sessions})`);
    const pricingEntry = byEntry.find(r => r.first_source === "pricing");
    if (pricingEntry && pricingEntry.sessions >= 5 && pricingEntry.conv_pct < 5) flags.push(`/pricing entry conv under 5% (${pricingEntry.signups}/${pricingEntry.sessions})`);
    if (failures.some(f => f.reason.includes("non-2xx"))) flags.push("book-trial 500 errors detected");
    const formStart = trialFunnel.find(s => s.label.startsWith("1."))?.sessions ?? 0;
    const formEnd = trialFunnel.find(s => s.label.startsWith("4."))?.sessions ?? 0;
    if (formStart >= 5 && (formEnd / formStart) < 0.20) flags.push(`Trial form completion under 20% (${formEnd}/${formStart})`);

    // Book-to-paid leak: bookings yesterday vs APPROVED enrollments same/next-day.
    // Forensic showed ~5% trial-to-paid which is the biggest unfixed leak — the
    // operations layer needs to know about this every day.
    const totalBooked = byEntry.reduce((s, r) => s + r.booked, 0);
    const totalPaid = byEntry.reduce((s, r) => s + r.paid, 0);
    if (totalBooked >= 3 && (totalPaid / totalBooked) < 0.10) {
      flags.push(`Book-to-paid under 10% (${totalPaid}/${totalBooked} bookings) — sales follow-up needed`);
    }

    const digest: DigestData = {
      yesterday: yLabel,
      sessions, signups, multiTouch,
      byEntry, trialFunnel, failures,
      prepSent, day1Sent, day3Sent, prepWindowTomorrow,
      flags,
    };

    const html = buildHtml(digest);
    const text = buildText(digest);

    const to = digestRecipients();
    const subject = `📊 Klovers funnel — ${yLabel} · ${signups}/${sessions} signups · ${flags.length} flags`;
    const sent = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, text }),
    });
    if (!sent.ok) {
      const errText = await sent.text();
      throw new Error(`Resend ${sent.status}: ${errText}`);
    }

    return new Response(JSON.stringify({ ok: true, sent: true, to, sessions, signups, flags }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("funnel-digest error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
