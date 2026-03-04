import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

// ── Brand constants ──
const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";
const BRAND_GRAY = "#f5f5f5";
const BRAND_TEXT = "#333333";
const BRAND_MUTED = "#666666";
const LOGO_URL = "https://klovers.lovable.app/klovers-logo.jpg";

function brandWrapper(content: string, isRtl: boolean) {
  const dir = isRtl ? 'direction: rtl; text-align: right;' : '';
  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background: ${BRAND_BLACK}; padding: 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="KLovers" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${BRAND_YELLOW};" />
      <h2 style="color: ${BRAND_YELLOW}; margin: 12px 0 0; font-size: 22px; letter-spacing: 1px;">KLovers</h2>
      <p style="color: #cccccc; margin: 4px 0 0; font-size: 12px;">Korean Language Academy</p>
    </div>
    <!-- Body -->
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
    </div>
    <!-- Footer -->
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;">— The KLovers Team</p>
      <a href="https://klovers.lovable.app" style="color: #cccccc; font-size: 11px; text-decoration: none;">klovers.lovable.app</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
}

function brandTable(rows: [string, string][]) {
  return `<table style="width: 100%; border-collapse: collapse; margin: 16px 0; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
    ${rows.map(([label, value]) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; color: ${BRAND_MUTED}; font-size: 13px; width: 40%;">${label}</td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #f0f0f0; font-weight: bold; color: ${BRAND_DARK}; font-size: 14px;">${value}</td>
      </tr>`).join("")}
  </table>`;
}

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

// ── Templates ──

function buildWelcomeEmail(name: string, lang: string) {
  const isAr = lang === "ar";
  if (isAr) {
    return {
      subject: "مرحباً بك في KLovers! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}! 🎉</h1>
        <p>تم تسجيلك بنجاح في KLovers!</p>
        <p>يمكنك الآن:</p>
        <ul style="padding-right: 20px; line-height: 2;">
          <li>📖 قراءة مقالاتنا عن اللغة الكورية</li>
          <li>📚 التسجيل في دوراتنا الجماعية أو الخاصة</li>
          <li>🎯 بدء رحلتك في تعلم اللغة الكورية</li>
        </ul>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اقرأ المدونة", "https://klovers.lovable.app/blog")}
          &nbsp;&nbsp;
          ${brandButton("سجّل الآن", "https://klovers.lovable.app/enroll")}
        </div>
      `, true),
    };
  }
  return {
    subject: "Welcome to KLovers! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome ${name}! 🎉</h1>
      <p>You've successfully registered with KLovers!</p>
      <p>You can now:</p>
      <ul style="line-height: 2;">
        <li>📖 Read our blog articles about Korean language & culture</li>
        <li>📚 Enroll in our Group or Private Korean classes</li>
        <li>🎯 Start your Korean learning journey</li>
      </ul>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Read the Blog", "https://klovers.lovable.app/blog")}
        &nbsp;&nbsp;
        ${brandButton("Enroll Now", "https://klovers.lovable.app/enroll")}
      </div>
    `, false),
  };
}

function buildEnrollmentEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد التسجيل! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً بك في KLovers، ${p.name}!</h1>
        <p>تم تأكيد تسجيلك. إليك التفاصيل:</p>
        ${brandTable([
          ["الخطة", p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة"],
          ["المدة", `${p.duration} ${p.duration === 1 ? "شهر" : "أشهر"}`],
          ["الحصص", `${p.sessions_total} حصة`],
          ["المبلغ المدفوع", amountStr],
        ])}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لإدارة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://klovers.lovable.app/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Enrollment Confirmed! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome to KLovers, ${p.name}!</h1>
      <p>Your enrollment has been confirmed. Here are your details:</p>
      ${brandTable([
        ["Plan", `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
        ["Duration", `${p.duration} ${p.duration === 1 ? "Month" : "Months"}`],
        ["Sessions", `${p.sessions_total} classes`],
        ["Amount Paid", amountStr],
      ])}
      <p>You can now log in to your Student Dashboard to manage your sessions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://klovers.lovable.app/dashboard")}
      </div>
    `, false),
  };
}

function buildGroupMatchEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const levelLabel = p.group_level ? (isAr ? `📚 المستوى: ${p.group_level}` : `📚 Level: ${p.group_level}`) : "";
  const timeLabel = p.group_time ? `🕐 ${p.group_time}${p.group_timezone ? ` (${p.group_timezone.replace(/_/g, " ")})` : ""}` : "";
  const membersHtml = (p.group_members && p.group_members.length > 0)
    ? `<div style="margin: 12px 0 0;">
        <p style="margin: 0 0 6px; font-weight: bold; color: ${BRAND_MUTED};">${isAr ? "زملاؤك:" : "Your classmates:"}</p>
        <ul style="margin: 0; padding-${isAr ? "right" : "left"}: 18px; color: ${BRAND_TEXT};">
          ${p.group_members.slice(0, 8).map(n => `<li>${n}</li>`).join("")}
          ${p.group_members.length > 8 ? `<li style="color:${BRAND_MUTED};">+${p.group_members.length - 8} ${isAr ? "آخرين" : "more"}</li>` : ""}
        </ul>
      </div>` : "";
  const customHtml = p.custom_message
    ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: ${BRAND_TEXT};">
        <p style="margin: 0; white-space: pre-wrap;">${p.custom_message}</p>
      </div>` : "";

  if (isAr) {
    return {
      subject: "KLovers — تم تكوين مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تكوين مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📚 المجموعة: ${p.group_name}</p>
          <p style="margin: 8px 0 0;">📅 الأيام: ${p.group_days}</p>
          ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
          ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
          ${membersHtml}
        </div>
        ${customHtml}
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://klovers.lovable.app/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Formed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been formed!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📚 Group: ${p.group_name}</p>
        <p style="margin: 8px 0 0;">📅 Days: ${p.group_days}</p>
        ${levelLabel ? `<p style="margin: 8px 0 0;">${levelLabel}</p>` : ""}
        ${timeLabel ? `<p style="margin: 8px 0 0;">${timeLabel}</p>` : ""}
        ${membersHtml}
      </div>
      ${customHtml}
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://klovers.lovable.app/dashboard")}
      </div>
    `, false),
  };
}

function buildSlotConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  if (isAr) {
    return {
      subject: "KLovers — تم تأكيد مجموعتك! 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أخبار رائعة يا ${p.name}! 🎉</h1>
        <p>تم تأكيد مجموعتك الدراسية!</p>
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
          <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} - ${p.slot_time}</p>
          <p style="margin: 8px 0 0;">🌍 ${p.slot_timezone || "Africa/Cairo"}</p>
          <p style="margin: 8px 0 0;">📚 المستوى: ${p.slot_level}</p>
        </div>
        <p>سنتواصل معك قريباً بخصوص موعد أول حصة.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://klovers.lovable.app/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Group is Confirmed! 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Great news, ${p.name}! 🎉</h1>
      <p>Your study group has been confirmed and is ready to start!</p>
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW};">
        <p style="margin: 0; font-weight: bold;">📅 ${p.slot_day} at ${p.slot_time}</p>
        <p style="margin: 8px 0 0;">🌍 ${(p.slot_timezone || "Africa/Cairo").replace(/_/g, " ")}</p>
        <p style="margin: 8px 0 0;">📚 Level: ${p.slot_level}</p>
      </div>
      <p>We'll contact you shortly with details about your first class.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://klovers.lovable.app/dashboard")}
      </div>
    `, false),
  };
}

function buildApprovalEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const dayLabel = p.preferred_day || "";
  const timeLabel = p.preferred_time || "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  if (dayLabel) rows.push([isAr ? "اليوم المفضل" : "Preferred Day", dayLabel]);
  if (timeLabel) rows.push([isAr ? "الوقت المفضل" : "Preferred Time", timeLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تمت الموافقة على تسجيلك! ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">تهانينا يا ${p.name}! ✅</h1>
        <p>تمت الموافقة على تسجيلك وتفعيل حسابك بنجاح!</p>
        ${brandTable(rows)}
        <p>يمكنك الآن تسجيل الدخول إلى لوحة الطالب لمتابعة حصصك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("لوحة الطالب", "https://klovers.lovable.app/dashboard")}
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — Your Enrollment is Approved! ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Congratulations, ${p.name}! ✅</h1>
      <p>Your enrollment has been approved and your account is now active!</p>
      ${brandTable(rows)}
      <p>You can now log in to your Student Dashboard to track your classes.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Go to Dashboard", "https://klovers.lovable.app/dashboard")}
      </div>
    `, false),
  };
}

function buildPendingReviewEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";
  const tzLabel = (p.timezone || "Africa/Cairo").replace(/_/g, " ");

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "Classes"}`],
    [isAr ? "المبلغ" : "Amount", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  rows.push([isAr ? "المنطقة الزمنية" : "Timezone", tzLabel]);

  if (isAr) {
    return {
      subject: "KLovers — تم استلام طلبك! ⏳",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">شكراً لطلبك يا ${p.name}! ⏳</h1>
        <p>لقد استلمنا طلب تسجيلك بنجاح.</p>
        <p>طلبك قيد المراجعة حالياً بينما نقوم بمطابقتك مع المعلم المناسب ومجموعة الدراسة بناءً على مستواك وجدولك.</p>
        <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">تفاصيل الخطة المختارة</h3>
        ${brandTable(rows)}
        <p>بمجرد الانتهاء من الجدولة وتأكيد الحصة، ستتلقى بريداً إلكترونياً بتفاصيل حصتك ورابط الانضمام.</p>
        <p>يرجى مراقبة بريدك الوارد لرسالة التأكيد.</p>
        <p style="color: ${BRAND_MUTED};">إذا كان لديك أي أسئلة، لا تتردد في التواصل معنا.</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — We've Received Your Request! ⏳",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Thank you for your request, ${p.name}! ⏳</h1>
      <p>We have received your enrollment request successfully.</p>
      <p>Your request is currently under review while we match you with the appropriate teacher and class group based on your level and schedule.</p>
      <h3 style="color: ${BRAND_DARK}; border-bottom: 3px solid ${BRAND_YELLOW}; display: inline-block; padding-bottom: 4px;">Selected Plan Details</h3>
      ${brandTable(rows)}
      <p>Once the scheduling is finalized and the class is confirmed, you will receive a confirmation email with your class details and the link to join your lessons.</p>
      <p>Please keep an eye on your inbox for the confirmation message.</p>
      <p style="color: ${BRAND_MUTED};">If you have any questions, feel free to contact us.</p>
    `, false),
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
