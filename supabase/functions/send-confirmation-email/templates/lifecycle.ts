// Every email outside the free-trial funnel: signup, enrollment, approval,
// payment, group forming, class links and feedback.
// Split out of index.ts on 2026-09-01 - see common.ts for why.

import type {
  EmailPayload,
} from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  unsubscribeFooter, brandWrapper, brandButton, brandTable, generateICS,
} from "./common.ts";

// ── Templates ──

export function buildWelcomeEmail(name: string, lang: string) {
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
          ${brandButton("اقرأ المدونة", "https://kloversegy.com/blog")}
          &nbsp;&nbsp;
          ${brandButton("سجّل الآن", "https://kloversegy.com/enroll-now")}
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
        ${brandButton("Read the Blog", "https://kloversegy.com/blog")}
        &nbsp;&nbsp;
        ${brandButton("Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
    `, false),
  };
}

export function buildEnrollmentEmail(p: EmailPayload) {
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
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
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
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

export function buildGroupMatchEmail(p: EmailPayload) {
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
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
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
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

export function buildSlotConfirmedEmail(p: EmailPayload) {
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
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
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
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
    `, false),
  };
}

export function buildApprovalEmail(p: EmailPayload) {
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
          ${brandButton("لوحة الطالب", "https://kloversegy.com/dashboard")}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">انضم إلى أكثر من 200 طالب عربي يتعلمون الكورية مع KLovers 🌟</p>
        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>بتحب KLovers؟</strong> ادعُ صديقاً وتحصلوا كلاكما على حصة مجانية. <a href="https://wa.me/201010003084?text=أهلاً%2C+بدي+أعرف+أكثر+عن+KLovers+الكورية" style="color: ${BRAND_DARK}; font-weight: bold;">شارك رابطك ←</a></p>
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
        ${brandButton("Go to Dashboard", "https://kloversegy.com/dashboard")}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px; text-align: center;">Join 200+ Arabic speakers learning Korean with KLovers 🌟</p>
      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 12px; border-top: 1px solid #e0e0e0; padding-top: 16px;">🎁 <strong>Loving KLovers?</strong> Refer a friend and you both get a free class. <a href="https://wa.me/201010003084?text=Hi%2C+I%27d+love+to+learn+more+about+KLovers+Korean+classes" style="color: ${BRAND_DARK}; font-weight: bold;">Share your link →</a></p>
    `, false),
  };
}

export function buildPendingReviewEmail(p: EmailPayload) {
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

export function buildRejectionEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const reason = p.rejection_reason ?? "other";

  let bodyEn = "";
  let bodyAr = "";
  let subjectEn = "KLovers — Enrollment Update";
  let subjectAr = "KLovers — تحديث حول تسجيلك";

  if (reason === "payment_not_received") {
    subjectEn = "KLovers — Enrollment Rejected: Payment Not Confirmed";
    subjectAr = "KLovers — تم رفض التسجيل: لم يتم تأكيد الدفع";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong> because we were unable to confirm that the payment was received.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>Reason:</strong> Payment transfer could not be confirmed.</p>
      </div>
      <p>Please re-enroll and make sure to transfer the correct amount and upload a clear receipt.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Re-Enroll Now", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note from admin:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك لعدم تمكننا من تأكيد استلام الدفعة.</p>
      <div style="background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #991b1b; font-size: 13px;">💳 <strong>السبب:</strong> لم يتم التحقق من تحويل الدفعة.</p>
      </div>
      <p>يرجى إعادة التسجيل مع التأكد من تحويل المبلغ الصحيح ورفع إيصال واضح.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("إعادة التسجيل", "https://kloversegy.com/enroll-now")}
      </div>
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else if (reason === "time_slots_unavailable") {
    subjectEn = "KLovers — No Available Time Slots — Choose a New Time";
    subjectAr = "KLovers — لا توجد مواعيد متاحة — اختر موعداً جديداً";
    const ctaBtn = p.resubmit_link ? brandButton(isAr ? "اختر موعدك المناسب" : "Choose Your Preferred Slot", p.resubmit_link) : "";
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Unfortunately, there are currently <strong>no available time slots</strong> that match your preferred schedule.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 Please use the button below to view available slots and select a new time that works for you.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>Note:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">The link expires in 48 hours. Need help? Contact us on WhatsApp.</p>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>للأسف، <strong>لا توجد مواعيد متاحة</strong> حالياً تتناسب مع جدولك المفضل.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">📅 يرجى استخدام الزر أدناه لعرض المواعيد المتاحة واختيار وقت يناسبك.</p>
      </div>
      ${ctaBtn ? `<div style="margin: 24px 0; text-align: center;">${ctaBtn}</div>` : ""}
      ${p.rejection_note ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;"><strong>ملاحظة:</strong> ${p.rejection_note}</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">الرابط صالح لمدة 48 ساعة. تواصل معنا عبر واتساب إذا احتجت مساعدة.</p>
    `;
  } else {
    bodyEn = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We're sorry, but your enrollment has been <strong>rejected</strong>.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>Please contact us if you have any questions.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Contact Us on WhatsApp", "https://wa.me/201010003084")}
      </div>
    `;
    bodyAr = `
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
      <p>نأسف لإبلاغك بأنه تم <strong>رفض</strong> طلب تسجيلك.</p>
      ${p.rejection_note ? `<div style="background: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><p style="margin: 0; color: ${BRAND_TEXT};">${p.rejection_note}</p></div>` : ""}
      <p>تواصل معنا إذا كان لديك أي استفسار.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("تواصل معنا عبر واتساب", "https://wa.me/201010003084")}
      </div>
    `;
  }

  return {
    subject: isAr ? subjectAr : subjectEn,
    html: brandWrapper(isAr ? bodyAr : bodyEn, isAr),
  };
}

export function buildPaymentMethodReminderEmail(name: string, enrollmentId: string, lang: string) {
  const isAr = lang === "ar";
  const payUrl = `https://kloversegy.com/pay/${enrollmentId}`;
  if (isAr) {
    return {
      subject: "مطلوب: تأكيد طريقة الدفع الخاصة بك ⚠️",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${name}!</h1>
        <p>لاحظنا أنك أرسلت إيصال الدفع، لكن لم يتم تحديد <strong>طريقة الدفع</strong> بعد.</p>
        <p>يرجى زيارة صفحة الدفع الخاصة بك لإكمال هذه الخطوة حتى يتمكن فريقنا من مراجعة طلبك والموافقة عليه.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ لن يتم الموافقة على تسجيلك حتى يتم تأكيد طريقة الدفع.</p>
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("تأكيد طريقة الدفع", payUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إذا كنت بحاجة إلى مساعدة، تواصل معنا عبر واتساب.</p>
      `, true),
    };
  }
  return {
    subject: "Action Required: Confirm your payment method ⚠️",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${name}!</h1>
      <p>We noticed you submitted a payment receipt, but your <strong>payment method</strong> wasn't confirmed.</p>
      <p>Please visit your payment page to complete this step so our team can review and approve your enrollment.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚠️ Your enrollment won't be approved until the payment method is confirmed.</p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Confirm Payment Method", payUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Need help? Contact us on WhatsApp.</p>
    `, false),
  };
}

export function buildPaymentConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const amountStr = p.currency === "EGP" ? `${p.amount?.toLocaleString()} EGP` : `$${p.amount}`;
  const levelLabel = p.level ? p.level.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "";

  const rows: [string, string][] = [
    [isAr ? "الخطة" : "Plan", isAr ? (p.plan_type === "group" ? "حصص جماعية" : "حصص خاصة") : `${p.plan_type === "group" ? "Group" : "Private"} Classes`],
    [isAr ? "المدة" : "Duration", `${p.duration} ${isAr ? (p.duration === 1 ? "شهر" : "أشهر") : (p.duration === 1 ? "Month" : "Months")}`],
    [isAr ? "الحصص" : "Sessions", `${p.sessions_total} ${isAr ? "حصة" : "classes"}`],
    [isAr ? "المبلغ المدفوع" : "Amount Paid", amountStr],
  ];
  if (levelLabel) rows.push([isAr ? "المستوى" : "Level", levelLabel]);
  if (p.tx_ref) rows.push([isAr ? "رقم المرجع" : "Reference #", p.tx_ref]);
  if (p.payment_date) rows.push([isAr ? "تاريخ الدفع" : "Payment Date", p.payment_date]);

  const timelineEn = `
    <div style="margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 14px; color: ${BRAND_DARK}; font-size: 15px;">What happens next:</p>
      <div style="border-left: 3px solid ${BRAND_YELLOW}; padding-left: 16px;">
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">✅ Payment received</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">Your seat is reserved — we've got you.</p>
        </div>
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">⏳ Group forming — 2–5 business days</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">We'll match you with the right group and schedule.</p>
        </div>
        <div>
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📧 Class link sent to you</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">You'll get an email with your meeting link before the first class.</p>
        </div>
      </div>
    </div>`;

  const timelineAr = `
    <div style="margin: 20px 0;">
      <p style="font-weight: bold; margin: 0 0 14px; color: ${BRAND_DARK}; font-size: 15px;">ما الذي سيحدث بعد ذلك:</p>
      <div style="border-right: 3px solid ${BRAND_YELLOW}; padding-right: 16px;">
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">✅ تم استلام الدفع</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">مقعدك محجوز — نحن معك.</p>
        </div>
        <div style="margin-bottom: 14px;">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">⏳ تشكيل المجموعة — من 2 إلى 5 أيام عمل</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">سنقوم بمطابقتك مع المجموعة المناسبة والجدول الزمني.</p>
        </div>
        <div>
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📧 إرسال رابط الحصة</p>
          <p style="margin: 3px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">ستتلقى بريداً إلكترونياً يتضمن رابط الاجتماع قبل الحصة الأولى.</p>
        </div>
      </div>
    </div>`;

  if (isAr) {
    return {
      subject: "KLovers — تم استلام دفعتك! مقعدك محجوز ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! ✅</h1>
        <p>تم استلام دفعتك بنجاح وتأكيد حجز مقعدك. مجموعتك تتشكل الآن — نقوم بمطابقتك مع طلاب على نفس مستواك.</p>
        ${brandTable(rows)}
        ${timelineAr}
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">احتفظ بهذا البريد الإلكتروني كإيصال للدفع.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">لا يلزمك اتخاذ أي إجراء الآن. سنتواصل معك قريباً.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">انضم إلى أكثر من 200 طالب عربي يتعلمون الكورية مع KLovers 🌟</p>
      `, true),
    };
  }
  return {
    subject: "KLovers — Payment Received! Your Seat is Reserved ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! ✅</h1>
      <p>We've confirmed your payment and your seat is reserved. Your group is forming now — we're matching you with students at the same level.</p>
      ${brandTable(rows)}
      ${timelineEn}
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">Save this email as your payment receipt.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">No action is required from you right now. We'll be in touch soon.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">Join 200+ Arabic speakers learning Korean with KLovers 🌟</p>
    `, false),
  };
}

export function buildGroupFormingEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";

  if (isAr) {
    return {
      subject: "KLovers — مجموعتك في طريقها إليك! ⏳",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>أردنا فقط التأكد من أن كل شيء على ما يرام.</p>
        <p>لا يزال فريقنا يعمل على تشكيل مجموعتك الدراسية — نحرص على إيجاد أفضل جدول ومعلم مناسب لك.</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">📧 بمجرد تجهيز مجموعتك، ستتلقى بريداً إلكترونياً فوراً يتضمن رابط الانضمام.</p>
        </div>
        <p>شكراً لصبرك — نقدّره كثيراً!</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">عندك أسئلة؟ تواصل معنا عبر واتساب.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        <div style="background: ${BRAND_GRAY}; border-radius: 6px; padding: 14px 18px; margin-top: 16px;">
          <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: ${BRAND_DARK};">📚 ابدأ قبل ما تيجي الحصة الأولى</p>
          <p style="margin: 0; font-size: 13px; color: ${BRAND_MUTED};">تعلم الأبجدية الكورية (هانغول) في 30 دقيقة — <a href="https://www.youtube.com/watch?v=s5aobqyEaMQ" style="color: ${BRAND_DARK}; font-weight: bold;">شاهد على يوتيوب ←</a></p>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your group is almost ready! ⏳",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Just a quick update from the team.</p>
      <p>We're still putting together your class group — making sure you get the best schedule and the right teacher match.</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px;">📧 Once your group is ready, you'll receive an email immediately with your class meeting link.</p>
      </div>
      <p>Thank you for your patience — we really appreciate it!</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      <div style="background: ${BRAND_GRAY}; border-radius: 6px; padding: 14px 18px; margin-top: 16px;">
        <p style="margin: 0 0 6px; font-size: 13px; font-weight: bold; color: ${BRAND_DARK};">📚 Start before your first class</p>
        <p style="margin: 0; font-size: 13px; color: ${BRAND_MUTED};">Learn the Korean alphabet (Hangul) in 30 minutes — <a href="https://www.youtube.com/watch?v=s5aobqyEaMQ" style="color: ${BRAND_DARK}; font-weight: bold;">Watch on YouTube →</a></p>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildReceiptNudgeEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const dashboardUrl = "https://kloversegy.com/dashboard";

  if (isAr) {
    return {
      subject: "KLovers — مطلوب: رفع إيصال الدفع لتفعيل حسابك ⚠️",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! ⚠️</h1>
        <p>لاحظنا أن تسجيلك لا يزال معلقاً لأننا لم نتلقَّ إيصال الدفع بعد.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;"><strong>المطلوب:</strong> قم برفع إيصال التحويل البنكي أو Vodafone Cash أو InstaPay من خلال لوحة التحكم الخاصة بك.</p>
        </div>
        <p>بمجرد التحقق من الدفع، سيتم قبول تسجيلك وتفعيل حسابك.</p>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("رفع الإيصال الآن", dashboardUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">إذا قمت بالدفع بالفعل، تأكد من رفع صورة واضحة للإيصال.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Action Required: Upload your payment receipt ⚠️",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! ⚠️</h1>
      <p>Your enrollment is still pending because we haven't received your payment receipt yet.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;"><strong>Action needed:</strong> Upload your bank transfer, Vodafone Cash, or InstaPay receipt from your dashboard.</p>
      </div>
      <p>Once your payment is verified, your enrollment will be approved and your account activated.</p>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Upload Receipt Now", dashboardUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">If you've already paid, make sure to upload a clear photo of your receipt.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildClassLinkEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const linkUrl = p.class_link_url || "#";
  const tz = (p.slot_timezone || "Africa/Cairo").replace(/_/g, " ");

  // ICS calendar invite — only when first_class_date is known
  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.first_class_date) {
    try {
      const icsText = generateICS({
        summary: "Korean Class — KLovers",
        description: `Join your KLovers Korean class here: ${linkUrl}`,
        dtstart: p.first_class_date,
        durationMinutes: 90,
        url: linkUrl,
      });
      icsAttachment = {
        filename: "korean-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip if date parse fails */ }
  }

  const scheduleBlock = p.slot_day
    ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0;">
        <p style="margin: 0; font-size: 14px;">📅 <strong>${p.slot_day}</strong>${p.slot_time ? ` at ${p.slot_time}` : ""} <span style="color: ${BRAND_MUTED}; font-size: 12px;">(${tz})</span></p>
      </div>`
    : "";

  const scheduleBlockAr = p.slot_day
    ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0;">
        <p style="margin: 0; font-size: 14px;">📅 <strong>${p.slot_day}</strong>${p.slot_time ? ` الساعة ${p.slot_time}` : ""} <span style="color: ${BRAND_MUTED}; font-size: 12px;">(${tz})</span></p>
      </div>`
    : "";

  if (isAr) {
    return {
      subject: "KLovers — حصتك جاهزة! إليك رابط الانضمام 🎓",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">حصتك جاهزة يا ${p.name}! 🎓</h1>
        <p>تم تشكيل مجموعتك الدراسية بالكامل وحصتك مجدولة ومستعدة للبدء.</p>
        ${scheduleBlockAr}
        <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
          <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">رابط الانضمام لحصتك:</p>
          ${brandButton("انضم للحصة الآن", linkUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">احتفظ بهذا الرابط — ستستخدمه للانضمام لجميع حصصك.</p>
        ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">📅 تم إرفاق دعوة التقويم بهذا البريد — افتحها لإضافة الحصة لتقويمك.</p>` : ""}
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">في حالة أي استفسار، تواصل معنا على واتساب.</p>
      `, true),
      icsAttachment,
    };
  }
  return {
    subject: "KLovers — Your Class is Ready! Here's Your Meeting Link 🎓",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Your class is ready, ${p.name}! 🎓</h1>
      <p>Your study group is fully formed and your class is scheduled and ready to start.</p>
      ${scheduleBlock}
      <div style="background: ${BRAND_GRAY}; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${BRAND_YELLOW}; text-align: center;">
        <p style="margin: 0 0 12px; font-weight: bold; font-size: 15px;">Your class meeting link:</p>
        ${brandButton("Join Your Class", linkUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 16px;">Save this link — you'll use it to join all your classes.</p>
      ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 13px;">📅 A calendar invite is attached — open it to add your class to your calendar.</p>` : ""}
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
    `, false),
    icsAttachment,
  };
}

export function buildGroupFormingEscalationEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";
  if (isAr) {
    return {
      subject: "KLovers — نعتذر عن الانتظار — مجموعتك قادمة قريباً 🙏",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>نعلم أن الانتظار قد يكون صعباً، ونقدّر صبرك الكبير.</p>
        <p>ما زلنا نعمل على إتمام تشكيل مجموعتك — نريد التأكد من حصولك على أفضل معلم وجدول يناسبك تماماً.</p>
        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
          <p style="margin: 0; color: #92400e; font-size: 13px;">⚡ ستتلقى بريداً إلكترونياً يتضمن رابط حصتك فور اكتمال تشكيل المجموعة.</p>
        </div>
        <p>لو عندك أي سؤال أو قلق، كلمنا مباشرة على واتساب:</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Sorry for the wait — your group is almost there 🙏",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We know waiting isn't fun, and we really appreciate your patience.</p>
      <p>We're still working on forming your class group — we want to make sure you get the best teacher match and schedule for you.</p>
      <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 18px; margin: 16px 0;">
        <p style="margin: 0; color: #92400e; font-size: 13px;">⚡ You'll receive your class meeting link the moment your group is complete.</p>
      </div>
      <p>If you have any questions or concerns, message us directly on WhatsApp:</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildRejectionFollowupEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const enrollUrl = "https://kloversegy.com/enroll-now";
  if (isAr) {
    return {
      subject: "KLovers — لا تفوّت فرصتك — اختر موعدك الآن 📅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}،</h1>
        <p>لاحظنا أنك لم تختر موعداً جديداً بعد.</p>
        <p>لا يزال بإمكانك إعادة التسجيل واختيار وقت يناسبك — لدينا مواعيد متاحة وطلابنا ينتظرونك في المجموعة!</p>
        <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0; font-size: 14px;">📅 اختر موعدك الجديد وسنقوم بمطابقتك مع المجموعة المناسبة.</p>
        </div>
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("اختر موعدك الآن", enrollUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">هذه آخر رسالة متابعة — بعدها القرار بيدك دائماً.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Don't miss your spot — pick a new time 📅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>We noticed you haven't picked a new time slot yet.</p>
      <p>You can still re-enroll and choose a schedule that works for you — we have availability and your future classmates are waiting!</p>
      <div style="background: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0; font-size: 14px;">📅 Pick your new slot and we'll match you with the right group.</p>
      </div>
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Pick Your Time Now", enrollUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">This is our last follow-up — the door is always open for you.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildPreClassReminderEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";
  const dateStr = p.first_class_date || "";
  if (isAr) {
    return {
      subject: "KLovers — حصتك الأولى غداً! 🎯 استعد الآن",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">يا ${p.name}، حصتك الأولى غداً! 🎯</h1>
        ${dateStr ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;"><p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dateStr} (القاهرة)</p></div>` : ""}
        <p>إليك كيف تستفيد من حصتك للأقصى:</p>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px; line-height: 2;">
          <li>🎧 جرّب الكاميرا والميكروفون قبل الحصة بـ 10 دقائق</li>
          <li>📝 اكتب 2–3 أشياء تريد تعلمها في الكورية</li>
          <li>☕ خذ مشروباً — الحصة ممتعة وستمر سريعاً</li>
          <li>🔗 الرابط وصلك في إيميل سابق — ابحث عن "رابط الحصة"</li>
        </ul>
        <p>متحمس لبداية رحلتك! 🚀</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">أي سؤال؟ كلمنا على واتساب.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your first class is tomorrow! 🎯 Get ready",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Your first class is tomorrow, ${p.name}! 🎯</h1>
      ${dateStr ? `<div style="background: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;"><p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dateStr} (Cairo time)</p></div>` : ""}
      <p>Here's how to make the most of your first class:</p>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px; line-height: 2;">
        <li>🎧 Test your camera and microphone 10 minutes before class</li>
        <li>📝 Write down 2–3 things you want to learn in Korean</li>
        <li>☕ Grab a drink — it's going to be fun and fly by</li>
        <li>🔗 Your class link was sent in a previous email — search for "class meeting link"</li>
      </ul>
      <p>So excited for you to start this journey! 🚀</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any questions? Message us on WhatsApp.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildClassFeedbackEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084";

  if (isAr) {
    return {
      subject: "KLovers — كيف كانت حصتك الأولى؟ 🌟",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! كيف كانت الحصة الأولى؟ 🌟</h1>
        <p>نتمنى أن تكون حصتك الأولى قد أعجبتك!</p>
        <p>رأيك يهمنا كثيراً — شاركنا تجربتك حتى نتمكن من تحسين تجربة كل الطلاب.</p>
        <div style="background: ${BRAND_GRAY}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: ${BRAND_DARK};">كيف تقيّم حصتك الأولى؟</p>
          <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+ممتازة+⭐⭐⭐⭐⭐" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐⭐ ممتازة</a>
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+جيدة+⭐⭐⭐⭐" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐ جيدة</a>
            <a href="${waUrl}?text=تقييمي+للحصة+الأولى%3A+تحتاج+تحسين" style="display: inline-block; background: #e0e0e0; color: ${BRAND_DARK}; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">تحتاج تحسين</a>
          </div>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">أو تكلم معنا مباشرة على واتساب — أي سؤال أو ملاحظة نحن هنا.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">شكراً لانضمامك لعائلة KLovers — رحلتك الكورية بدأت للتو! 🇰🇷</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — How was your first class? 🌟",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! How was your first class? 🌟</h1>
      <p>We hope your first class was amazing!</p>
      <p>Your feedback means everything to us — it helps us improve the experience for every student.</p>
      <div style="background: ${BRAND_GRAY}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 12px; font-size: 15px; font-weight: bold; color: ${BRAND_DARK};">How would you rate your first class?</p>
        <div style="display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;">
          <a href="${waUrl}?text=My+first+class+rating%3A+Excellent+%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐⭐ Excellent</a>
          <a href="${waUrl}?text=My+first+class+rating%3A+Good+%E2%AD%90%E2%AD%90%E2%AD%90%E2%AD%90" style="display: inline-block; background: ${BRAND_DARK}; color: #fff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">⭐⭐⭐⭐ Good</a>
          <a href="${waUrl}?text=My+first+class+rating%3A+Needs+improvement" style="display: inline-block; background: #e0e0e0; color: ${BRAND_DARK}; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-size: 14px; margin: 4px;">Needs improvement</a>
        </div>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Or message us directly on WhatsApp — any questions or feedback, we're here.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: center; margin-top: 20px;">Thank you for joining the KLovers family — your Korean journey has just begun! 🇰🇷</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
