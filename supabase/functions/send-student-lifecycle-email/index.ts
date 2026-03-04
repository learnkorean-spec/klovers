import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

/* ── Enrollment Welcome Email ── */
function buildEnrollmentWelcomeEmail(name: string, planType: string, duration: number, amount: number, currency: string, preferredDays: string[], level: string) {
  const daysText = preferredDays.length > 0 ? preferredDays.join(", ") : "Not selected yet";
  const levelLabel = level ? level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "To be determined";
  const currencyLabel = currency === "EGP" ? "EGP" : "$";
  const amountText = currency === "EGP" ? `${amount.toLocaleString()} EGP` : `$${amount}`;

  return {
    subject: "KLovers — Welcome! You're in the matching queue ✨",
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="background:#000000;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#FFFF00;font-size:24px;font-weight:700;line-height:1.3;">
        Welcome to KLovers, ${name}! &#127942;
      </h1>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">
        Your enrollment has been received and you're now in our <strong>matching queue</strong>!
        We're grouping students with similar schedules and levels to create the best learning experience.
      </p>

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">Your Enrollment Details</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Plan</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${planType === "group" ? "Group" : "Private"} Classes</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Duration</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${duration} ${duration === 1 ? "Month" : "Months"}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Amount</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${amountText}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Level</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${levelLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Preferred Days</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${daysText}</td></tr>
        </table>
      </div>

      <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin:20px 0;">
        <p style="margin:0;font-size:14px;color:#92400e;">
          <strong>What happens next?</strong><br>
          We're matching you with other students who share your level and preferred schedule.
          You'll receive an email as soon as your group is formed!
        </p>
      </div>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:10px 0 24px;">
          <a href="https://kloversegy.com/dashboard"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
             Go to Dashboard
          </a>
        </td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
      <p style="color:#6B7280;font-size:14px;margin:0;text-align:center;">
        ✨ <strong style="color:#111827;">Klovers Team</strong>
      </p>
    </td>
  </tr>
</table>
</td></tr></table>
</body></html>`,
  };
}

/* ── Group Formed Email ── */
function buildGroupFormedEmail(name: string, groupName: string, dayOfWeek: number, startTime: string, timezone: string, level: string) {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayLabel = dayNames[dayOfWeek] || "TBD";
  const levelLabel = level ? level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "";

  return {
    subject: "KLovers — Your Group is Formed! 🎓",
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
  <tr>
    <td style="background:#000000;padding:28px 40px;text-align:center;">
      <h1 style="margin:0;color:#FFFF00;font-size:24px;font-weight:700;line-height:1.3;">
        Your Group is Ready! &#127891;
      </h1>
    </td>
  </tr>
  <tr>
    <td style="padding:40px;">
      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">
        Great news, <strong>${name}</strong>! You've been matched with your study group.
      </p>

      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;">
        <h2 style="margin:0 0 12px;font-size:16px;color:#111827;">&#128218; ${groupName}</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Day</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${dayLabel}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Time</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${startTime}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Timezone</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${(timezone || "Africa/Cairo").replace(/_/g, " ")}</td></tr>
          ${levelLabel ? `<tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">Level</td><td style="padding:6px 0;font-weight:600;color:#111827;font-size:14px;">${levelLabel}</td></tr>` : ""}
        </table>
      </div>

      <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 18px;">
        We'll contact you shortly with details about your first class. Check your dashboard for the latest updates.
      </p>

      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center" style="padding:10px 0 24px;">
          <a href="https://kloversegy.com/dashboard"
             style="background:#FFFF00;color:#000000;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;">
             Go to Dashboard
          </a>
        </td></tr>
      </table>

      <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;">
      <p style="color:#6B7280;font-size:14px;margin:0;text-align:center;">
        ✨ <strong style="color:#111827;">Klovers Team</strong>
      </p>
    </td>
  </tr>
</table>
</td></tr></table>
</body></html>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json();
    const { type } = body;
    console.log(`[lifecycle-email] type=${type}`, JSON.stringify(body));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    if (type === "enrollment_created") {
      const { user_id, plan_type, duration, amount, currency, preferred_days, level } = body;

      // Get student profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("user_id", user_id)
        .single();

      if (!profile?.email) {
        console.log("[lifecycle-email] No profile found for user", user_id);
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { subject, html } = buildEnrollmentWelcomeEmail(
        profile.name || "Student",
        plan_type,
        duration,
        amount,
        currency || "USD",
        preferred_days || [],
        level || ""
      );

      const result = await sendEmail(profile.email, subject, html);
      console.log(`[lifecycle-email] Enrollment welcome sent to ${profile.email}`, result);

      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "group_assigned") {
      const { user_id, group_id } = body;

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("user_id", user_id)
        .single();

      if (!profile?.email) {
        console.log("[lifecycle-email] No profile found for user", user_id);
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get group + package info
      const { data: group } = await supabase
        .from("pkg_groups")
        .select("name, package_id")
        .eq("id", group_id)
        .single();

      if (!group) {
        console.log("[lifecycle-email] Group not found", group_id);
        return new Response(JSON.stringify({ skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let dayOfWeek = 0, startTime = "TBD", timezone = "Africa/Cairo", level = "";
      if (group.package_id) {
        const { data: pkg } = await supabase
          .from("schedule_packages")
          .select("day_of_week, start_time, timezone, level")
          .eq("id", group.package_id)
          .single();
        if (pkg) {
          dayOfWeek = pkg.day_of_week;
          startTime = pkg.start_time;
          timezone = pkg.timezone;
          level = pkg.level;
        }
      }

      const { subject, html } = buildGroupFormedEmail(
        profile.name || "Student",
        group.name,
        dayOfWeek,
        startTime,
        timezone,
        level
      );

      const result = await sendEmail(profile.email, subject, html);
      console.log(`[lifecycle-email] Group formed sent to ${profile.email}`, result);

      return new Response(JSON.stringify({ success: true, id: result.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[lifecycle-email] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
