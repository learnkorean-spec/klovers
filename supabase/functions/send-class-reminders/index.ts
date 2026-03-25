import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const SITE_URL = "https://kloversegy.com";
const LOGO_URL = "https://klovers.lovable.app/klovers-logo.jpg";

function reminderEmail(name: string, sessionDate: string, startTime: string, durationMin: number, groupName: string, level: string, zoomUrl: string | null, reminderType: "24h" | "1h") {
  const firstName = name?.split(" ")[0] || "there";
  const formattedDate = new Date(sessionDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const [h, m] = startTime.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedTime = `${h % 12 || 12}:${String(m).padStart(2, "0")} ${ampm}`;
  const endH = Math.floor((h * 60 + m + durationMin) / 60);
  const endM = (h * 60 + m + durationMin) % 60;
  const endAmpm = endH >= 12 ? "PM" : "AM";
  const formattedEnd = `${endH % 12 || 12}:${String(endM).padStart(2, "0")} ${endAmpm}`;

  const isUrgent = reminderType === "1h";
  const headerColor = isUrgent ? "#FFFF00" : "#000000";
  const headerTextColor = isUrgent ? "#000000" : "#FFFF00";
  const badgeText = isUrgent ? "⏰ Class in 1 Hour!" : "📅 Class Tomorrow";

  const joinButton = zoomUrl
    ? `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding: 8px 0 24px;">
        <a href="${zoomUrl}" style="background:#000000;color:#FFFF00;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;display:inline-block;">
          📹 Join Class →
        </a>
      </td></tr></table>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <!-- Header -->
  <tr><td style="background:${headerColor};padding:28px 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="KLovers" style="width:52px;height:52px;border-radius:50%;border:3px solid ${headerTextColor};" />
    <h2 style="color:${headerTextColor};margin:10px 0 4px;font-size:20px;font-weight:700;">${badgeText}</h2>
    <p style="color:${headerTextColor};opacity:0.8;margin:0;font-size:13px;">Korean Language Academy</p>
  </td></tr>
  <!-- Body -->
  <tr><td style="padding:32px 40px;color:#333333;">
    <p style="font-size:16px;margin:0 0 20px;">Hi <strong>${firstName}</strong>,</p>
    <p style="font-size:16px;margin:0 0 24px;line-height:1.6;">
      ${isUrgent
        ? "Your Korean class starts in about <strong>1 hour</strong>. Get ready!"
        : "Don't forget — your Korean class is <strong>tomorrow</strong>. See you there!"}
    </p>

    <!-- Session Details -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:10px;margin-bottom:24px;">
      <tr><td style="padding:20px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;width:40%;">📅 Date</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;">⏰ Time</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${formattedTime} – ${formattedEnd} (Cairo)</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;">👥 Group</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${groupName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;color:#666;">🎓 Level</td>
            <td style="padding:6px 0;font-size:14px;font-weight:600;color:#111;">${level}</td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${joinButton}

    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
      <a href="${SITE_URL}/dashboard" style="background:#f3f4f6;color:#111;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;display:inline-block;border:1px solid #e5e7eb;">
        View My Dashboard
      </a>
    </td></tr></table>

    <hr style="border:none;border-top:1px solid #E5E7EB;margin:8px 0 20px;" />
    <p style="color:#9ca3af;font-size:13px;margin:0;line-height:1.6;">
      Keep practicing between sessions — even 10 minutes a day makes a huge difference! 화이팅! 💪<br /><br />
      <em>Reham · K-Lovers Academy</em>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  return res.ok;
}

Deno.serve(async (req) => {
  // Allow cron trigger (no auth) or manual trigger (with auth)
  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const reminderType: "24h" | "1h" | "both" = body.type ?? "both";

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), { status: 500 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Fetch Zoom URL from app_settings
  const { data: zoomSetting } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "zoom_meeting_url")
    .maybeSingle();
  const zoomUrl = (zoomSetting as any)?.value || null;

  const results: string[] = [];

  // ── 24-hour reminder ────────────────────────────────────────────────────────
  if (reminderType === "24h" || reminderType === "both") {
    // Sessions happening tomorrow (Cairo = UTC+2, so tomorrow in Cairo)
    const { data: sessions24h } = await supabase.rpc("get_sessions_for_reminder_24h") as any;

    for (const s of sessions24h ?? []) {
      const ok = await sendEmail(
        s.email,
        "📅 Your Korean class is tomorrow! – KLovers",
        reminderEmail(s.name, s.session_date, s.start_time, s.duration_min, s.group_name, s.level, zoomUrl, "24h")
      );
      results.push(`24h → ${s.email}: ${ok ? "✓" : "✗"}`);
    }
  }

  // ── 1-hour reminder ─────────────────────────────────────────────────────────
  if (reminderType === "1h" || reminderType === "both") {
    const { data: sessions1h } = await supabase.rpc("get_sessions_for_reminder_1h") as any;

    for (const s of sessions1h ?? []) {
      const ok = await sendEmail(
        s.email,
        "⏰ Your Korean class starts in 1 hour! – KLovers",
        reminderEmail(s.name, s.session_date, s.start_time, s.duration_min, s.group_name, s.level, zoomUrl, "1h")
      );
      results.push(`1h  → ${s.email}: ${ok ? "✓" : "✗"}`);
    }
  }

  return new Response(JSON.stringify({ sent: results.length, results }), {
    headers: { "Content-Type": "application/json" },
  });
});
