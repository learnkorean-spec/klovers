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

function buildReminderEmail(name: string, missing: MissingField[], lang: string) {
  const isAr = lang === "ar";

  const missingList = missing
    .map((f) => `<li style="padding: 4px 0;">${isAr ? f.label_ar : f.label_en}</li>`)
    .join("");

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء الدروس 📝",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">مرحباً ${name || ""}! 👋</h1>
          <p>لاحظنا أن بعض بياناتك غير مكتملة. يُرجى إكمالها حتى نتمكن من ترتيب حصصك.</p>
          <div style="background: #fef3c7; border-right: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0 0 8px; font-weight: bold; color: #92400e;">⚠️ البيانات المطلوبة:</p>
            <ul style="margin: 0; padding-right: 18px; color: #78350f;">${missingList}</ul>
          </div>
          <p>اضغط الزر أدناه للذهاب مباشرة إلى لوحة التحكم وإكمال بياناتك:</p>
          <div style="margin: 24px 0; text-align: center;">
            <a href="${DASHBOARD_URL}" style="background: #6d28d9; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">أكمل بياناتك الآن</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }

  return {
    subject: "KLovers — Complete your profile to start classes 📝",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Hi ${name || "there"}! 👋</h1>
        <p>We noticed some of your information is still missing. Please complete it so we can arrange your classes.</p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold; color: #92400e;">⚠️ Missing information:</p>
          <ul style="margin: 0; padding-left: 18px; color: #78350f;">${missingList}</ul>
        </div>
        <p>Click the button below to go directly to your dashboard and fill in the details:</p>
        <div style="margin: 24px 0; text-align: center;">
          <a href="${DASHBOARD_URL}" style="background: #6d28d9; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Complete Your Profile Now</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
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

    // Fetch all approved+paid enrollments with their profiles
    const { data: enrollments, error: eErr } = await supabase
      .from("enrollments")
      .select("id, user_id, preferred_days, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID");

    if (eErr) throw eErr;

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, level, country");

    if (pErr) throw pErr;

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

    let sent = 0;
    let skipped = 0;

    for (const enrollment of enrollments || []) {
      const profile = profileMap.get(enrollment.user_id) as any;
      if (!profile?.email) { skipped++; continue; }

      // Determine missing fields
      const missing: MissingField[] = [];

      if (!profile.name || profile.name.trim() === "") {
        missing.push({ label_en: "Full Name", label_ar: "الاسم الكامل" });
      }
      if (!profile.level || profile.level.trim() === "") {
        missing.push({ label_en: "Korean Level", label_ar: "مستوى اللغة الكورية" });
      }
      if (!profile.country || profile.country.trim() === "") {
        missing.push({ label_en: "Country", label_ar: "البلد" });
      }
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية" });
      }
      if (!enrollment.preferred_days || enrollment.preferred_days.length === 0) {
        missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة" });
      }

      if (missing.length === 0) { skipped++; continue; }

      // Detect language from country (simple heuristic)
      const lang = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"]
        .some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";

      const { subject, html } = buildReminderEmail(profile.name, missing, lang);

      try {
        await sendEmail(profile.email, subject, html);
        sent++;
        // Rate limit: 1 second between sends
        await new Promise((r) => setTimeout(r, 1000));
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
    console.error("Profile reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
