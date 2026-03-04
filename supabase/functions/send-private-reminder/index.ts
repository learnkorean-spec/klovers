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
const DASHBOARD_URL = "https://klovers.lovable.app/dashboard";

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

interface MissingField {
  label_en: string;
  label_ar: string;
}

function buildEmail(name: string, missing: MissingField[], lang: string) {
  const isAr = lang === "ar";

  const missingItems = missing
    .map((f) => `<li style="margin: 4px 0;">${isAr ? f.label_ar : f.label_en}</li>`)
    .join("");

  const missingBox = `
    <div style="background: #1a1a00; border: 1px solid #FFFF00; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #FFFF00; font-weight: bold; margin: 0 0 8px 0;">&#9888;&#65039; ${isAr ? "بيانات ناقصة:" : "Missing information:"}</p>
      <ul style="color: #ffffff; margin: 0; padding-${isAr ? "right" : "left"}: 20px;">${missingItems}</ul>
    </div>`;

  const ctaBtnStyle = `display: inline-block; background: #FFFF00; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;`;
  const ctaBtn = `<a href="${DASHBOARD_URL}/schedule" style="${ctaBtnStyle}">${isAr ? "أكمل بياناتك الآن" : "Complete Your Info Now"}</a>`;

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء حصصك الخاصة 📝",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff; direction: rtl; text-align: right;">
          <h1 style="color: #000000; font-size: 28px;">مرحباً ${name || ""}!</h1>
          <p style="color: #333; font-size: 15px; line-height: 1.6;">تم تأكيد دفعك بنجاح! &#127881; لبدء ترتيب حصصك الخاصة، نحتاج منك إكمال بعض البيانات.</p>
          ${missingBox}
          <p style="color: #333; font-size: 15px; line-height: 1.6;">اضغط على الزر أدناه لإكمال بياناتك:</p>
          <div style="text-align: center; margin: 24px 0;">${ctaBtn}</div>
          <p style="color: #999; font-size: 12px; margin-top: 32px;">— فريق KLovers</p>
        </div>`,
    };
  }

  return {
    subject: "KLovers — Complete your info to start private classes 📝",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 20px; background: #ffffff;">
        <h1 style="color: #000000; font-size: 28px;">Hi ${name || "there"}!</h1>
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Your payment is confirmed! &#127881; To arrange your private classes, we need a few more details from you.</p>
        ${missingBox}
        <p style="color: #333; font-size: 15px; line-height: 1.6;">Click the button below to complete your information:</p>
        <div style="text-align: center; margin: 24px 0;">${ctaBtn}</div>
        <p style="color: #999; font-size: 12px; margin-top: 32px;">— The KLovers Team</p>
      </div>`,
  };
}

const ARAB_COUNTRIES = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const body = await req.json().catch(() => ({}));
    const targetUserIds: string[] | undefined = body.user_ids; // optional: send to specific users

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch unmatched private enrollments
    let query = supabase
      .from("enrollments")
      .select("id, user_id, preferred_days, preferred_day, preferred_time, timezone, level")
      .eq("approval_status", "APPROVED")
      .eq("plan_type", "private")
      .is("matched_at", null);

    if (targetUserIds && targetUserIds.length > 0) {
      query = query.in("user_id", targetUserIds);
    }

    const { data: enrollments, error: eErr } = await query;
    if (eErr) throw eErr;

    // Fetch profiles
    const userIds = [...new Set((enrollments || []).map((e: any) => e.user_id))];
    if (userIds.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, level, country")
      .in("user_id", userIds);
    if (pErr) throw pErr;

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    let sent = 0;
    let skipped = 0;

    for (const enrollment of enrollments || []) {
      const profile = profileMap.get(enrollment.user_id) as any;
      if (!profile?.email) { skipped++; continue; }

      const missing: MissingField[] = [];

      // Check enrollment-level fields
      const enrollLevel = enrollment.level || profile.level;
      if (!enrollLevel || enrollLevel.trim() === "") {
        missing.push({ label_en: "Korean Level (take placement test)", label_ar: "مستوى اللغة الكورية (قم باختبار تحديد المستوى)" });
      }
      if (!profile.country || profile.country.trim() === "") {
        missing.push({ label_en: "Country", label_ar: "البلد" });
      }
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية" });
      }
      if ((!enrollment.preferred_days || enrollment.preferred_days.length === 0) && !enrollment.preferred_day) {
        missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة" });
      }
      if (!enrollment.preferred_time || enrollment.preferred_time.trim() === "") {
        missing.push({ label_en: "Preferred Class Time", label_ar: "وقت الحصة المفضل" });
      }

      if (missing.length === 0) { skipped++; continue; }

      const lang = ARAB_COUNTRIES.some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";
      const { subject, html } = buildEmail(profile.name, missing, lang);

      try {
        await sendEmail(profile.email, subject, html);
        sent++;
        await new Promise((r) => setTimeout(r, 1000)); // rate limit
      } catch (emailErr) {
        console.error(`Failed to send to ${profile.email}:`, emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Private reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
