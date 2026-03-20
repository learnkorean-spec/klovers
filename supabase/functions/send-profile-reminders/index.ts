// send-profile-reminders: auto daily email for leads with missing info
// project: ewtdgpbybkceokfohhyg
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "KLovers <noreply@kloversegy.com>";
const ENROLL_URL = "https://kloversegy.com/enroll-now";

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

function getMissingFields(lead: Record<string, string>): string[] {
  const missing: string[] = [];
  if (!lead.name || lead.name.trim() === "") missing.push("Full Name");
  if (!lead.country || lead.country.trim() === "") missing.push("Country");
  if (!lead.level || lead.level.trim() === "") missing.push("Korean Level");
  return missing;
}

function isArabicCountry(country: string): boolean {
  const arabicCountries = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات",
    "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر",
    "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن",
    "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain",
    "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"];
  return arabicCountries.some(c => country.toLowerCase().includes(c));
}

function buildReminderEmail(name: string, missing: string[], country: string) {
  const isAr = country ? isArabicCountry(country) : false;
  const displayName = name && name.trim() ? name : (isAr ? "مرحباً" : "there");

  const missingItems = missing
    .map((f) => `<li style="margin: 4px 0;">✏️ ${f}</li>`)
    .join("");

  const missingBox = `
    <div style="background: #1a1a00; border: 1px solid #FFFF00; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #FFFF00; font-weight: bold; margin: 0 0 8px 0;">⚠️ ${isAr ? "بيانات ناقصة:" : "Missing information:"}</p>
      <ul style="color: #ffffff; margin: 0; padding-${isAr ? "right" : "left"}: 20px;">${missingItems}</ul>
    </div>`;

  const ctaBtn = `<a href="${ENROLL_URL}" style="display: inline-block; background: #FFFF00; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">${isAr ? "أكمل بياناتك الآن" : "Complete My Profile Now"}</a>`;

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء الدروس 📝",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff; direction: rtl; text-align: right;">
          <div style="background: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="color: #FFFF00; margin: 0; font-size: 24px; letter-spacing: 1px;">KLovers</h2>
            <p style="color: #ccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
          </div>
          <div style="padding: 28px 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
            <h1 style="color: #000000; font-size: 24px;">مرحباً ${displayName}! 👋</h1>
            <p style="color: #333; font-size: 15px; line-height: 1.6;">لاحظنا أن بعض بياناتك غير مكتملة. يرجى إكمالها حتى نتمكن من مطابقتك مع الدرس الكوري المناسب لمستواك وجدولك.</p>
            ${missingBox}
            <div style="text-align: center; margin: 24px 0;">${ctaBtn}</div>
            <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">— فريق KLovers</p>
          </div>
        </div>`,
    };
  }

  return {
    subject: "Complete your KLovers profile to get started 📝",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff;">
        <div style="background: #000; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: #FFFF00; margin: 0; font-size: 24px; letter-spacing: 1px;">KLovers</h2>
          <p style="color: #ccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
        </div>
        <div style="padding: 28px 24px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
          <h1 style="color: #000000; font-size: 24px;">Hi ${displayName}! 👋</h1>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">We noticed some of your profile information is still missing. Fill it in so we can match you with the right Korean class for your level and schedule.</p>
          ${missingBox}
          <div style="text-align: center; margin: 24px 0;">${ctaBtn}</div>
          <p style="color: #999; font-size: 12px; margin-top: 32px; text-align: center;">— The KLovers Team</p>
        </div>
      </div>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all non-enrolled leads
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, name, email, country, level, goal, status")
      .neq("status", "enrolled");

    if (leadsErr) throw leadsErr;

    let sent = 0;
    let skipped = 0;
    const sentIds: string[] = [];

    for (const lead of leads || []) {
      if (!lead.email) { skipped++; continue; }

      const missing = getMissingFields(lead as Record<string, string>);
      if (missing.length === 0) { skipped++; continue; }

      try {
        const { subject, html } = buildReminderEmail(lead.name, missing, lead.country || "");
        await sendEmail(lead.email, subject, html);
        sentIds.push(lead.id);
        sent++;
        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (emailErr) {
        console.error(`Failed to send to ${lead.email}:`, emailErr);
      }
    }

    // Mark sent leads as 'contacted' (only if still 'new')
    if (sentIds.length > 0) {
      await supabase
        .from("leads")
        .update({ status: "contacted" })
        .in("id", sentIds)
        .eq("status", "new");
    }

    console.log(`Profile reminders: sent=${sent}, skipped=${skipped}`);

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Profile reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
