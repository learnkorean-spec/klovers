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
  param: string; // query param key
}

function buildReminderEmail(name: string, missing: MissingField[], lang: string) {
  const isAr = lang === "ar";

  const buttonStyle = `display: inline-block; background: #6d28d9; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold; margin: 4px 0;`;

  const fieldButtons = missing
    .map((f) => {
      const label = isAr ? f.label_ar : f.label_en;
      const url = `${DASHBOARD_URL}?complete=${f.param}`;
      return `<a href="${url}" style="${buttonStyle}">${isAr ? "أكمل" : "Fix"}: ${label}</a>`;
    })
    .join("<br/>");

  const fallbackBtn = `<a href="${DASHBOARD_URL}" style="${buttonStyle}; background: #4b5563;">${isAr ? "افتح لوحة التحكم" : "Open Dashboard"}</a>`;

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء الدروس 📝",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">مرحباً ${name || ""}! 👋</h1>
          <p>لاحظنا أن بعض بياناتك غير مكتملة. اضغط على الزر المناسب لإكماله مباشرة:</p>
          <div style="margin: 20px 0; text-align: center;">
            ${fieldButtons}
          </div>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <div style="text-align: center;">
            ${fallbackBtn}
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
        <p>We noticed some of your information is still missing. Click each button below to fill it in directly:</p>
        <div style="margin: 20px 0; text-align: center;">
          ${fieldButtons}
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <div style="text-align: center;">
          ${fallbackBtn}
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

      const missing: MissingField[] = [];

      if (!profile.name || profile.name.trim() === "") {
        missing.push({ label_en: "Full Name", label_ar: "الاسم الكامل", param: "name" });
      }
      if (!profile.level || profile.level.trim() === "") {
        missing.push({ label_en: "Korean Level", label_ar: "مستوى اللغة الكورية", param: "level" });
      }
      if (!profile.country || profile.country.trim() === "") {
        missing.push({ label_en: "Country", label_ar: "البلد", param: "country" });
      }
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية", param: "timezone" });
      }
      if (!enrollment.preferred_days || enrollment.preferred_days.length === 0) {
        missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة", param: "days" });
      }

      if (missing.length === 0) { skipped++; continue; }

      const lang = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"]
        .some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";

      const { subject, html } = buildReminderEmail(profile.name, missing, lang);

      try {
        await sendEmail(profile.email, subject, html);
        sent++;
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
