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
  template?: "welcome" | "enrollment" | "group_match" | "slot_confirmed" | "approval" | "pending_review";
  group_name?: string;
  group_days?: string;
  group_members?: string[];
  group_time?: string;
  group_timezone?: string;
  group_level?: string;
  custom_message?: string;
  slot_day?: string;
  slot_time?: string;
  slot_timezone?: string;
  slot_level?: string;
  preferred_day?: string;
  preferred_time?: string;
  timezone?: string;
  level?: string;
  currency?: string;
}

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

function buildWelcomeEmail(name: string, lang: string) {
  if (lang === "ar") {
    return {
      subject: "مرحباً بك في KLovers! 🎉",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">مرحباً ${name}! 🎉</h1>
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
        <h1 style="color: #6d28d9;">Welcome ${name}! 🎉</h1>
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
  const levelLabel = p.group_level ? (isArabic ? `📚 المستوى: ${p.group_level}` : `📚 Level: ${p.group_level}`) : "";
  const timeLabel = p.group_time ? `🕐 ${p.group_time}${p.group_timezone ? ` (${p.group_timezone.replace(/_/g, " ")})` : ""}` : "";
  const membersHtml = (p.group_members && p.group_members.length > 0)
    ? `<div style="margin: 12px 0 0;">
        <p style="margin: 0 0 6px; font-weight: bold; color: #6b7280;">${isArabic ? "زملاؤك:" : "Your classmates:"}</p>
        <ul style="margin: 0; padding-${isArabic ? "right" : "left"}: 18px; color: #374151;">
          ${p.group_members.slice(0, 8).map(n => `<li>${n}</li>`).join("")}
          ${p.group_members.length > 8 ? `<li style="color:#6b7280;">+${p.group_members.length - 8} ${isArabic ? "آخرين" : "more"}</li>` : ""}
        </ul>
      </div>` : "";
  const customHtml = p.custom_message
    ? `<div style="background: #ede9fe; border-left: 4px solid #6d28d9; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #374151;">
        <p style="margin: 0; white-space: pre-wrap;">${p.custom_message}</p>
      </div>` : "";

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
            ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
            ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
            ${membersHtml}
          </div>
          ${customHtml}
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
          ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
          ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
          ${membersHtml}
        </div>
        ${customHtml}
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

function buildApprovalEmail(p: EmailPayload) {
  const isArabic = p.language === "ar";
  const currencyLabel = p.currency === "EGP" ? "EGP" : "$";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const dayLabel = p.preferred_day || "";
  const timeLabel = p.preferred_time || "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  if (isArabic) {
    return {
      subject: "KLovers — تمت الموافقة على تسجيلك! ✅",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">تهانينا يا ${p.name}! ✅</h1>
          <p>تمت الموافقة على تسجيلك وتفعيل حسابك بنجاح!</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الخطة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المدة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الحصص</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} حصة</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المبلغ</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${amountStr}</td></tr>
            ${levelLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المستوى</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${levelLabel}</td></tr>` : ""}
            ${dayLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">اليوم المفضل</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${dayLabel}</td></tr>` : ""}
            ${timeLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الوقت المفضل</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${timeLabel}</td></tr>` : ""}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المنطقة الزمنية</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${tzLabel}</td></tr>
          </table>
          <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لمتابعة حصصك.</p>
          <div style="margin: 24px 0;">
            <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">لوحة الطالب</a>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "KLovers — Your Enrollment is Approved! ✅",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Congratulations, ${p.name}! ✅</h1>
        <p>Your enrollment has been approved and your account is now active!</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "Group" : "Private"} Classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "Month" : "Months"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sessions</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${amountStr}</td></tr>
          ${levelLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Level</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${levelLabel}</td></tr>` : ""}
          ${dayLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Day</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${dayLabel}</td></tr>` : ""}
          ${timeLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Preferred Time</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${timeLabel}</td></tr>` : ""}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Timezone</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${tzLabel}</td></tr>
        </table>
        <p>You can now log in to your Student Dashboard to track your classes.</p>
        <div style="margin: 24px 0;">
          <a href="https://klovers.lovable.app/dashboard" style="background: #6d28d9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Go to Dashboard</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">— The KLovers Team</p>
      </div>`,
  };
}

function buildPendingReviewEmail(p: EmailPayload) {
  const isArabic = p.language === "ar";
  const currencyLabel = p.currency === "EGP" ? "EGP" : "$";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  if (isArabic) {
    return {
      subject: "KLovers — تم استلام طلبك! ⏳",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; direction: rtl; text-align: right;">
          <h1 style="color: #6d28d9;">شكراً لطلبك يا ${p.name}! ⏳</h1>
          <p>لقد استلمنا طلب تسجيلك بنجاح.</p>
          <p>طلبك قيد المراجعة حالياً بينما نقوم بمطابقتك مع المعلم المناسب ومجموعة الدراسة بناءً على مستواك وجدولك.</p>
          <h3 style="color: #6d28d9; margin-top: 24px;">تفاصيل الخطة المختارة</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الخطة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المدة</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">الحصص</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} حصة</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المبلغ</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${amountStr}</td></tr>
            ${levelLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المستوى</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${levelLabel}</td></tr>` : ""}
            <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">المنطقة الزمنية</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${tzLabel}</td></tr>
          </table>
          <p>بمجرد الانتهاء من الجدولة وتأكيد الحصة، ستتلقى بريداً إلكترونياً بتفاصيل حصتك ورابط الانضمام.</p>
          <p>يرجى مراقبة بريدك الوارد لرسالة التأكيد.</p>
          <p>إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">— فريق KLovers</p>
        </div>`,
    };
  }
  return {
    subject: "KLovers — We've Received Your Request! ⏳",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #6d28d9;">Thank you for your request, ${p.name}! ⏳</h1>
        <p>We have received your enrollment request successfully.</p>
        <p>Your request is currently under review while we match you with the appropriate teacher and class group based on your level and schedule.</p>
        <h3 style="color: #6d28d9; margin-top: 24px;">Selected Plan Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Plan</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.plan_type === "group" ? "Group" : "Private"} Classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Duration</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.duration} ${p.duration === 1 ? "Month" : "Months"}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Sessions</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${p.sessions_total} Classes</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Amount</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${amountStr}</td></tr>
          ${levelLabel ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Level</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${levelLabel}</td></tr>` : ""}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Timezone</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${tzLabel}</td></tr>
        </table>
        <p>Once the scheduling is finalized and the class is confirmed, you will receive a confirmation email with your class details and the link to join your lessons.</p>
        <p>Please keep an eye on your inbox for the confirmation message.</p>
        <p>If you have any questions, feel free to contact us.</p>
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
      case "approval":
        ({ subject, html } = buildApprovalEmail(payload));
        break;
      case "pending_review":
        ({ subject, html } = buildPendingReviewEmail(payload));
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
