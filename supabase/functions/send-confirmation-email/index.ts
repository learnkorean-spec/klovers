import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailPayload {
  email: string;
  name: string;
  plan_type?: string;
  duration?: number;
  sessions_total?: number;
  amount?: number;
  language?: string;
  template?: "welcome" | "enrollment" | "group_match" | "slot_confirmed";
  group_name?: string;
  group_days?: string;
  group_members?: string[];
  slot_day?: string;
  slot_time?: string;
  slot_timezone?: string;
  slot_level?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "KLovers <onboarding@resend.dev>";

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

function buildWelcomeEmail(name: string, lang: string) {
  if (lang === "ar") {
    return {
      subject: "مرحباً بك في KLovers! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">مرحباً ${name}! 🇰🇷</h1>
          <p>تم تسجيلك بنجاح في KLovers!</p>
          <p>يمكنك الآن:</p>
          <ul style="padding-right: 20px;">
            <li>📖 قراءة مقالاتنا عن اللغة الكورية</li>
            <li>📚 التسجيل في دوراتنا الجماعية أو الخاصة</li>
            <li>🎯 بدء رحلتك في تعلم اللغة الكورية</li>
          </ul>
          <div style="margin: 24px 0;">
            <a href="https://klovers.lovable.app/blog" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-left: 8px;">اقرأ المدونة</a>
            <a href="https://klovers.lovable.app/enroll" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">سجّل الآن</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "Welcome to KLovers! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Welcome ${name}! 🇰🇷</h1>
        <p>You've successfully registered with KLovers!</p>
        <p>You can now:</p>
        <ul>
          <li>📖 Read our blog articles about Korean language & culture</li>
          <li>📚 Enroll in our Group or Private Korean classes</li>
          <li>🎯 Start your Korean learning journey</li>
        </ul>
        <div style="margin: 24px 0;">
          <a href="https://klovers.lovable.app/blog" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-right: 8px;">Read the Blog</a>
          <a href="https://klovers.lovable.app/enroll" style="background: #059669; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Enroll Now</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
      </div>`,
  };
}

function buildEnrollmentEmail(p: EmailPayload) {
  const isArabic = p.language === "ar";
  if (isArabic) {
    return {
      subject: "KLovers — تم تأكيد التسجيل! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">مرحباً بك في KLovers، ${p.name}!</h1>
          <p>تم تأكيد تسجيلك. إليك التفاصيل:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الخطة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المدة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الحصص</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} حصة</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المبلغ المدفوع</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">$${p.amount}</td></tr>
          </table>
          <p>يمكنك الآن تسجيل الدخول إلى <a href="https://klovers.lovable.app/dashboard" style="color: #6d28d9;">لوحة الطالب</a> لإدارة حصصك.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "KLovers — Enrollment Confirmed! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Welcome to KLovers, ${p.name}!</h1>
        <p>Your enrollment has been confirmed. Here are your details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "Group" : "Private"} Classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "Month" : "Months"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sessions</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Amount Paid</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">$${p.amount}</td></tr>
        </table>
        <p>You can now log in to your <a href="https://klovers.lovable.app/dashboard" style="color: #6d28d9;">Student Dashboard</a> to manage your sessions.</p>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
      </div>`,
  };
}

function buildGroupMatchEmail(p: EmailPayload) {
  const isArabic = p.language === "ar";
  if (isArabic) {
    return {
      subject: "KLovers — تم تكوين مجموعتك! 🎓",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">أخبار رائعة يا ${p.name}! 🎉</h1>
          <p>تم تكوين مجموعتك الدراسية!</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold;">📚 المجموعة: ${p.group_name}</p>
            <p style="margin: 8px 0 0;">📅 الأيام: ${p.group_days}</p>
          </div>
          <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
          <div style="margin: 24px 0;">
            <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">لوحة الطالب</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "KLovers — Your Group is Formed! 🎓",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Great news, ${p.name}! 🎉</h1>
        <p>Your study group has been formed!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">📚 Group: ${p.group_name}</p>
          <p style="margin: 8px 0 0;">📅 Days: ${p.group_days}</p>
        </div>
        <p>We'll contact you shortly with details about your first class.</p>
        <div style="margin: 24px 0;">
          <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Go to Dashboard</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
      </div>`,
  };
}

function buildSlotConfirmedEmail(p: EmailPayload) {
  const isArabic = p.language === "ar";
  if (isArabic) {
    return {
      subject: "KLovers — تم تأكيد مجموعتك! 🎓",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">أخبار رائعة يا ${p.name}! 🎉</h1>
          <p>تم تأكيد مجموعتك الدراسية!</p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} - ${p.slot_time}</p>
            <p style="margin: 8px 0 0;">🌍 ${p.slot_timezone || "Africa/Cairo"}</p>
            <p style="margin: 8px 0 0;">📚 المستوى: ${p.slot_level}</p>
          </div>
          <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
          <div style="margin: 24px 0;">
            <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">لوحة الطالب</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "KLovers — Your Group is Confirmed! 🎓",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Great news, ${p.name}! 🎉</h1>
        <p>Your study group has been confirmed and is ready to start!</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} at ${p.slot_time}</p>
          <p style="margin: 8px 0 0;">🌍 ${(p.slot_timezone || "Africa/Cairo").replace(/_/g, " ")}</p>
          <p style="margin: 8px 0 0;">📚 Level: ${p.slot_level}</p>
        </div>
        <p>We'll contact you shortly with details about your first class.</p>
        <div style="margin: 24px 0;">
          <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Go to Dashboard</a>
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
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const payload: EmailPayload = await req.json();
    const { email, name, language, template } = payload;

    if (!email || !name) {
      return new Response(JSON.stringify({ error: "Missing email or name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let subject: string;
    let html: string;

    switch (template) {
      case "welcome":
        ({ subject, html } = buildWelcomeEmail(name, language || "en"));
        break;
      case "group_match":
        ({ subject, html } = buildGroupMatchEmail(payload));
        break;
      case "slot_confirmed":
        ({ subject, html } = buildSlotConfirmedEmail(payload));
        break;
      case "enrollment":
      default:
        ({ subject, html } = buildEnrollmentEmail(payload));
        break;
    }

    const result = await sendEmail(email, subject, html);
    console.log(`Email sent to ${email} (${template || "enrollment"}):`, result);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent", id: result.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Email error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
