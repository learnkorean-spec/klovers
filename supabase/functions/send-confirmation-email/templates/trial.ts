// Every email in the free-trial funnel.
// Split out of index.ts on 2026-09-01 - see common.ts for why.

import type {
  EmailPayload,
} from "./common.ts";
import {
  BRAND_BLACK, BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  SITE_URL, unsubscribeFooter, brandWrapper, brandButton, brandTable,
  generateICS, localToUTCISO, tzCity, renderClassTime,
} from "./common.ts";

export function buildTrialConfirmedEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  // Trial slots are stored in the teacher's own zone. This fallback only fires
  // if a caller omits trial_timezone; it used to be Africa/Cairo, which
  // mislabelled a Malaysia-time slot by five hours.
  const tz = (p.trial_timezone || "Asia/Kuala_Lumpur").replace(/_/g, " ");
  const tzIana = p.trial_timezone || "Asia/Kuala_Lumpur";
  const durationMin = p.trial_duration_min || 30;
  // Re's rule: the reader's own country time is the headline, the class's
  // home time goes in brackets. Unknown zone falls back to slot time + GMT.
  const ct = renderClassTime({
    date: p.trial_date, time: p.trial_time, slotTz: tzIana,
    studentTz: p.student_timezone, isAr,
  });
  const tzDisplay = p.student_timezone ? tzCity(p.student_timezone, isAr) : tz;

  // Generate ICS attachment when we have enough data
  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.trial_date && p.trial_time) {
    try {
      const dtUTC = localToUTCISO(p.trial_date, p.trial_time, tzIana);
      const icsText = generateICS({
        summary: isAr ? "حصة كورية تجريبية مجانية — KLovers" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `حصتك التجريبية المجانية في اللغة الكورية مع KLovers.\nالمستوى: ${p.level || "مبتدئ"}\n\nhttps://kloversegy.com`
          : `Your free ${durationMin}-min trial Korean class with Klovers Egypt.\nLevel: ${p.level || "Beginner"}\n\nhttps://kloversegy.com`,
        dtstart: dtUTC,
        durationMinutes: durationMin,
        url: p.class_link_url || "https://kloversegy.com",
      });
      icsAttachment = {
        filename: "klovers-trial-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip if date parse fails */ }
  }

  const calSection = icsAttachment
    ? `<div style="margin: 16px 0; text-align: center;">
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 13px;">📎 ${isAr ? "ملف التقويم (.ics) مرفق بهذا الإيميل — افتحه لإضافة الحصة لأي تطبيق تقويم (Google, Apple, Outlook)" : "A calendar file (.ics) is attached — open it to add your class to Google Calendar, Apple Calendar, or Outlook"}</p>
        ${p.calendar_url ? `<a href="${p.calendar_url}" style="display: inline-block; background-color: #4285f4 !important; color: #ffffff !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">📅 ${isAr ? "أضف إلى Google Calendar" : "Add to Google Calendar"}</a>` : ""}
       </div>`
    : (p.calendar_url
        ? `<div style="margin: 16px 0; text-align: center;">
            <a href="${p.calendar_url}" style="display: inline-block; background-color: #4285f4 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">📅 ${isAr ? "أضف إلى تقويم Google" : "Add to Google Calendar"}</a>
           </div>`
        : "");

  const joinBtn = p.class_link_url
    ? `<div style="margin: 20px 0; text-align: center;">
        <a href="${p.class_link_url}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">🎓 ${isAr ? "انضم للحصة" : "Join the Class"}</a>
       </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: ${isAr ? "right" : "left"};">${isAr ? "سيتم إرسال رابط الحصة إليك قبل الموعد مباشرة. تابع بريدك الإلكتروني! 📩" : "The class link will be sent to you before the session. Keep an eye on your inbox! 📩"}</p>`;

  // ── ENGLISH VERSION ──────────────────────────────────────────────────────
  if (!isAr) {
    return {
      subject: "🎉 You're in! Your free Korean trial class is confirmed — KLovers",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">Hi ${p.name}! 👋</h1>
        <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
          We're so excited to have you! Your <strong>free trial Korean class</strong> is officially confirmed.
          Get ready for a fun, relaxed session — no pressure, just great energy. 🌟
        </p>

        <!-- Details card -->
        <div style="background-color: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
          <div style="background-color: ${BRAND_BLACK}; padding: 10px 18px;">
            <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">📅 Class Details</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; width: 90px;">🗓️ Date</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.dateLabel}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">⏰ Time</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.timeLine}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">🌍 Timezone</td>
              <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tzDisplay}</td>
            </tr>
          </table>
        </div>

        ${calSection}
        ${joinBtn}

        <!-- What to expect -->
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px;">✨ What happens in this session?</h3>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">👋</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Introductions</strong> — meet your teacher and the rest of the group
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">💬</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Why Korean?</strong> — everyone shares their story and motivation
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">🗺️</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>How the course works</strong> — structure, schedule, and what to expect
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">📊</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Korean levels explained</strong> — we'll help you find where you fit in
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">🎯</span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Your goals</strong> — what do you want to achieve with Korean?
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;">❓</span>
            </td>
            <td style="padding: 9px 0 9px 10px; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Q&amp;A</strong> — ask us anything, no question is too small!
            </td>
          </tr>
        </table>

        <!-- Tip box -->
        <div style="background-color: #fffff0; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0;">
          <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;">💡 <strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile — that's all you need! 🇰🇷</p>
        </div>

        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">Questions? Just reply to this email or reach us on WhatsApp anytime.</p>
      `, false),
      icsAttachment,
    };
  }

  // ── ARABIC VERSION ───────────────────────────────────────────────────────
  return {
    subject: "🎉 تم تأكيد حصتك التجريبية المجانية في الكورية — KLovers",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">أهلاً ${p.name}! 👋</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
        يسعدنا جداً انضمامك! تم تأكيد مكانك في <strong>الحصة التجريبية المجانية</strong> بنجاح.
        استعد لجلسة ممتعة وخالية من أي ضغط — طاقة إيجابية وأصدقاء جدد! 🌟
      </p>

      <!-- Details card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
        <div style="background-color: ${BRAND_BLACK}; padding: 10px 18px; text-align: right;">
          <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1px;">تفاصيل الحصة 📅</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; direction: rtl;">
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; width: 90px;">🗓️ التاريخ</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.dateLabel}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600;">⏰ الوقت</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.timeLine}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600;">🌍 التوقيت</td>
            <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tzDisplay}</td>
          </tr>
        </table>
      </div>

      ${calSection}
      ${joinBtn}

      <!-- What to expect -->
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px; text-align: right;">✨ إيه اللي هيحصل في الحصة دي؟</h3>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px; text-align: right;">مش حصة دراسية — ده لقاء تعارف ودردشة ممتعة! هنعمل مع بعض:</p>

      <table style="width: 100%; border-collapse: collapse; direction: rtl;">
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; width: 36px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">👋</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>تعارف</strong> — هنتعرف على المدرس وعلى بعض
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">💬</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>ليه الكورية؟</strong> — كل واحد يشارك قصته وسبب اهتمامه باللغة
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">🗺️</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>إزاي الكورس بيشتغل؟</strong> — هنشرح المحتوى والجداول وكل التفاصيل
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">📊</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>مستويات اللغة الكورية</strong> — هتعرف إنت على أي مستوى وتبدأ منين
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">🎯</span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>أهدافك</strong> — عايز تحقق إيه من تعلم الكورية؟
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;">❓</span>
          </td>
          <td style="padding: 9px 10px 9px 0; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>أسئلة وأجوبة</strong> — اسأل أي حاجة، ما فيش سؤال صغير!
          </td>
        </tr>
      </table>

      <!-- Tip box -->
      <div style="background-color: #fffff0; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0; text-align: right;">
        <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;">💡 <strong>نصيحة سريعة:</strong> انضم قبل الحصة بـ 5 دقايق، دور على مكان هادي، وجيب معاك ابتسامتك — ده كل اللي محتاجه! 🇰🇷</p>
      </div>

      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">عندك أسئلة؟ رد على الإيميل ده أو راسلنا واتساب في أي وقت.</p>
    `, true),
    icsAttachment,
  };
}

export function buildTrialRebookEmail(p: EmailPayload) {
  // Was hardcoded `false`, which sent Arabic-track students an English email
  // while the fully-written Arabic branch below sat unreachable. The slot
  // cards already localise day names and 12-hour times via dayNamesAr /
  // formatTime12(t, ar), so honouring p.language turns all of that on.
  const isAr = p.language === "ar";
  const url = p.rebook_url || `${SITE_URL}/free-trial`;
  const waUrl = "https://wa.me/201010003084";

  const dayNamesEn = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayNamesAr = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  const formatTime12 = (t: string, ar: boolean) => {
    if (!t || !/^\d{1,2}:\d{2}$/.test(t)) return t || "";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? (ar ? "م" : "PM") : (ar ? "ص" : "AM");
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  // Sort by DATE, not by day_of_week. These slots carry real dates now, and
  // ordering by weekday put Sunday the 13th and Monday the 14th above Friday
  // the 11th and Saturday the 12th - the reader saw the four dates shuffled.
  // day_of_week stays as the tie-break for any slot that has no date.
  const slots = (p.available_slots || []).slice().sort((a, b) =>
    (a.date || "").localeCompare(b.date || "") ||
    a.day_of_week - b.day_of_week ||
    a.start_time.localeCompare(b.start_time)
  );

  const slotCards = slots.length
    ? slots.map((s) => {
        const day = isAr ? dayNamesAr[s.day_of_week] : dayNamesEn[s.day_of_week];
        const tz = (s.timezone || "Africa/Cairo").replace(/_/g, " ");
        // The month was hardcoded to en-US, so the Arabic email read
        // "الجمعة, September 11" - an Arabic weekday glued to an English
        // month. The separator follows the language too.
        const dateLabel = s.date
          ? new Date(s.date + "T00:00:00").toLocaleDateString(
              isAr ? "ar-EG" : "en-US", { month: "long", day: "numeric" })
          : "";
        const dayPart = dateLabel ? `${day}${isAr ? "، " : ", "}${dateLabel}` : day;
        // The booking now carries the student's own zone, so each slot can be
        // stated in their time with the slot's home time in brackets. When it
        // is null - every booking made before that capture shipped - this
        // falls back to the slot time paired with GMT.
        const ct = renderClassTime({
          date: s.date, time: s.start_time,
          slotTz: s.timezone || "Africa/Cairo",
          studentTz: p.student_timezone, isAr,
        });
        const timeLine = `⏰ ${ct.timeLine}`;
        return `<div style="background-color: ${BRAND_GRAY}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; margin: 8px 0; ${isAr ? "text-align: right;" : ""}">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">📅 ${dayPart}</p>
          <p style="margin: 4px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">${timeLine}</p>
        </div>`;
      }).join("")
    : "";

  const localTimeNote = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🌍 لما تفتحي صفحة الحجز، هتلاقي كل ميعاد مكتوب <strong>بتوقيتك إنتِ</strong> تلقائيًا.</p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">🌍 When you open the booking page, every time is shown in <strong>your own local time</strong> automatically.</p>`;

  const meetLinkSection = p.class_link_url
    ? (isAr
        ? `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet (احفظه لو سمحت!)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">انضم للكلاس</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">ملاحظة: هذا الرابط شخصي — لا تشاركه مع أحد.</p>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link (save it for class day!)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">Note: This link is personal — please don't share it.</p>
          </div>`)
    : "";

  const chooseBtn = `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
      ${isAr ? "اختر موعدك الآن" : "Choose My Date"}
    </a>
  </div>`;

  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية المجانية جاهزة للحجز 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلاً ${p.name}! 👋</h1>
        <p>حصتك الكورية التجريبية المجانية <strong>جاهزة للحجز</strong>. دي المواعيد المتاحة:</p>
        ${slotCards}
        ${localTimeNote}
        <p>كل ميعاد بيتشرح بلغة واحدة بس — لو اخترتي ميعاد <strong>إنجليزي</strong> الحصة هتبقى كلها بالإنجليزي، ولو <strong>عربي</strong> هتبقى كلها بالعربي.</p>
        <p>الأماكن محدودة والمجموعة <strong>صغيرة</strong>، فاحجزي بدري.</p>
        ${chooseBtn}
        ${meetLinkSection}
        <p>ولو الحصة كملت قبل ما تحجزي، هنبعتلك المواعيد اللي بعدها — <strong>مكانك محفوظ</strong> ومش محتاجة تعملي حاجة.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">أي سؤال؟ ردي على الإيميل ده أو كلمينا على واتساب:</p>
        <div style="margin: 8px 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — your free trial is ready to book 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Your free Korean trial class is <strong>ready to book</strong>. Here are the available dates:</p>
      ${slotCards}
      ${localTimeNote}
      <p>Each slot is taught in one language only — pick an <strong>English</strong> slot and the class runs in English, an <strong>Arabic</strong> slot and it runs in Arabic.</p>
      <p>Places are limited — these are <strong>small groups</strong>, so pick your date early.</p>
      ${chooseBtn}
      ${meetLinkSection}
      <p>If a class fills up before you get there, we'll send you the next set of dates — <strong>your place on the list is kept</strong> and there's nothing you need to do.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp:</p>
      <div style="margin: 8px 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
    `, false),
  };
}

export function buildTrialAttendanceConfirmationEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  // `id=` was carried here since the first version of this email and the
  // confirmation page has never read it — it only ever looks at `token`. A
  // parameter that does nothing is one more thing to get truncated or mangled
  // when a mail client rewrites the link, so it is gone.
  const confirmUrl = `https://kloversegy.com/trial-confirm?token=${p.confirmation_token || ""}&response=yes`;
  const declineUrl = `https://kloversegy.com/trial-confirm?token=${p.confirmation_token || ""}&response=no`;
  const classLink = p.class_link_url || p.meeting_url || null;
  const tzIana = p.trial_timezone || "Asia/Kuala_Lumpur";
  const tzLabel = tzIana.replace(/_/g, " ");
  const durationMin = p.trial_duration_min || 30;
  const ct = renderClassTime({
    date: p.trial_date, time: p.trial_time, slotTz: tzIana,
    studentTz: p.student_timezone, isAr,
  });
  const tzDisplay = p.student_timezone ? tzCity(p.student_timezone, isAr) : tzLabel;

  let icsAttachment: { filename: string; content: string; content_type: string } | undefined;
  if (p.trial_date && p.trial_time) {
    try {
      const dtUTC = localToUTCISO(p.trial_date, p.trial_time, tzIana);
      const icsText = generateICS({
        summary: isAr ? "حصة كورية تجريبية مجانية — KLovers" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `حصتك التجريبية المجانية في اللغة الكورية مع KLovers.\nhttps://kloversegy.com`
          : `Your free ${durationMin}-min trial Korean class with Klovers Egypt.\nhttps://kloversegy.com`,
        dtstart: dtUTC,
        durationMinutes: durationMin,
        url: classLink || "https://kloversegy.com",
      });
      icsAttachment = {
        filename: "klovers-trial-class.ics",
        content: btoa(unescape(encodeURIComponent(icsText))),
        content_type: "text/calendar",
      };
    } catch { /* skip */ }
  }

  const meetSection = classLink
    ? (isAr
        ? `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 رابط Google Meet الخاص بك</p>
            <a href="${classLink}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">انضم للكلاس</a>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">🎓 Your Google Meet link</p>
            <a href="${classLink}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
          </div>`)
    : (isAr
        ? `<div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">🕐 سيتم إرسال رابط الحصة إليك بالبريد الإلكتروني قبل ٢٤ ساعة من الموعد</p>
          </div>`
        : `<div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">🕐 Your class link will be sent to you 24 hours before your session</p>
          </div>`);

  // Two answers, because "declined" and "never opened the email" are different
  // problems and the academy has to act on them differently. Yellow stays the
  // one loud button; the decline is a quiet outline so saying no is easy but
  // never the thing the eye lands on first.
  //
  // Without a token both links would land the student on the "Link Invalid"
  // card, which reads as if we lost her booking. Nothing is better than that,
  // so we ask her to reply instead.
  const hasConfirmToken = Boolean(p.confirmation_token);

  const respondSectionAr = hasConfirmToken
    ? `<div style="margin: 24px 0; text-align: center;">
        <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 14px;">أي رد بيساعدنا: «أكّد حضوري» بيحجزلك مقعدك، و«مش هقدر أحضر» بيفضّيه لطالب تاني ونرتبلك ميعاد جديد.</p>
        <a href="${confirmUrl}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">✅ أكّد حضوري</a>
        <div style="margin-top: 12px;">
          <a href="${declineUrl}" style="display: inline-block; background-color: #ffffff !important; color: ${BRAND_MUTED} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: 1px solid #d4d4d4;">مش هقدر أحضر</a></div><div style="margin-top: 18px;"><a href="${SITE_URL}/trial-guide-ar.pdf" style="color: ${BRAND_MUTED} !important; font-size: 13px; text-decoration: underline;">مش فاكر حجزت إيه؟ اتفرج على البرنامج ←</a>
        </div>
      </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: right;">مش عارفين نعمل لينك التأكيد دلوقتي. رد على الإيميل ده وقولنا هتحضر ولا لأ. 📩</p>`;

  const respondSectionEn = hasConfirmToken
    ? `<div style="margin: 24px 0; text-align: center;">
        <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 14px;">Either answer helps us: yes holds your seat, and "I can't make it" frees it for someone else so we can find you another time.</p>
        <a href="${confirmUrl}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">✅ Confirm My Attendance</a>
        <div style="margin-top: 12px;">
          <a href="${declineUrl}" style="display: inline-block; background-color: #ffffff !important; color: ${BRAND_MUTED} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: 1px solid #d4d4d4;">I can't make it</a></div><div style="margin-top: 18px;"><a href="${SITE_URL}/trial-guide-en.pdf" style="color: ${BRAND_MUTED} !important; font-size: 13px; text-decoration: underline;">Not sure what you booked? See the programme &rarr;</a>
        </div>
      </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: left;">We couldn't build your confirmation link this time. Just reply to this email and tell us whether you'll be there. 📩</p>`;

  const breakdownAr = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">✨ ماذا سيحدث في هذه الحصة؟</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">هذه مش حصة دراسة عادية — دي جلسة تعارف ممتعة عشان نتعرف عليك! إليك ما سنفعله:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["👋", "تعارف", "تتعرف على معلمك وبقية المجموعة"],
        ["💬", "ليه الكورية؟", "كل واحد يشارك قصته وسبب اهتمامه"],
        ["🗺️", "كيف يعمل الكورس؟", "شرح منهج وطريقة التدريس"],
        ["📊", "مستويات الكورية", "تعرف مستواك وين في رحلة التعلم"],
        ["🎯", "أهدافك", "نناقش ما تريد تحقيقه"],
        ["❓", "أسئلة وأجوبة", "اسأل أي شيء في بالك"],
      ].map(([icon, title, desc]) => `
        <tr>
          <td width="48" style="padding: 10px 8px; vertical-align: top; text-align: center;">
            <span style="display: inline-block; width: 36px; height: 36px; background-color: ${BRAND_YELLOW}; border-radius: 50%; line-height: 36px; text-align: center; font-size: 18px;">${icon}</span>
          </td>
          <td style="padding: 10px 8px; vertical-align: top;">
            <strong style="color: ${BRAND_DARK};">${title}</strong>
            <span style="color: ${BRAND_MUTED}; font-size: 13px;"> — ${desc}</span>
          </td>
        </tr>`).join("")}
    </table>
    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">💡 <strong>نصيحة سريعة:</strong> انضم قبل ٥ دقائق، اختر مكاناً هادئاً، وابتسم 😊</p>
    </div>`;

  const breakdownEn = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">✨ What happens in this session?</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["👋", "Introductions", "meet your teacher and the rest of the group"],
        ["💬", "Why Korean?", "everyone shares their story and motivation"],
        ["🗺️", "How the course works", "we walk you through the curriculum and teaching style"],
        ["📊", "Korean levels explained", "understand where you are in the learning journey"],
        ["🎯", "Your goals", "we discuss what you want to achieve"],
        ["❓", "Q&A", "ask us anything on your mind"],
      ].map(([icon, title, desc]) => `
        <tr>
          <td width="48" style="padding: 10px 8px; vertical-align: top; text-align: center;">
            <span style="display: inline-block; width: 36px; height: 36px; background-color: ${BRAND_YELLOW}; border-radius: 50%; line-height: 36px; text-align: center; font-size: 18px;">${icon}</span>
          </td>
          <td style="padding: 10px 8px; vertical-align: top;">
            <strong style="color: ${BRAND_DARK};">${title}</strong>
            <span style="color: ${BRAND_MUTED}; font-size: 13px;"> — ${desc}</span>
          </td>
        </tr>`).join("")}
    </table>
    <div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0;">
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">💡 <strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile 😊</p>
    </div>`;

  if (isAr) {
    return {
      subject: "KLovers — أكّد حضورك لحصتك التجريبية ✅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🎉</h1>
        <p>عارفين إنك مستني من زمان، وآسفين على التأخير فعلاً. مواعيد الحصص التجريبية فتحت دلوقتي، وحجزنالك مكان في الميعاد اللي تحت. لو مناسب أكّده، ولو مش مناسب اختار «مش هقدر أحضر» ونرتّبلك غيره.</p>
        ${brandTable([
          ["📅 التاريخ", ct.dateLabel],
          ["⏰ الوقت", ct.timeLine],
          ["🌍 التوقيت", tzDisplay],
        ])}
        ${respondSectionAr}
        ${meetSection}
        ${breakdownAr}
        <div style="margin: 28px 0 8px; text-align: center;">
          <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">استعد للحصة — ابدأ بهذين الخطوتين</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="padding: 0 8px 0 0; text-align: center;">
              <a href="${SITE_URL}/placement-test" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">🎯 اختبر مستواك</a>
            </td>
            <td style="padding: 0 0 0 8px; text-align: center;">
              <a href="${SITE_URL}/pricing" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">💰 شوف الأسعار</a>
            </td>
          </tr></table>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">تأكيد الحضور يساعدنا في حجز مقعدك والتحضير لك. شكراً!</p>
        ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">📎 ملف التقويم (.ics) مرفق — افتحه لإضافة الحصة لتقويمك</p>` : ""}
      `, true),
      icsAttachment,
    };
  }
  return {
    subject: "Please confirm your attendance for your Klovers trial class ✅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🎉</h1>
      <p>You have been waiting a long time, and we are sorry for the silence. Trial dates are open again, and we have held a seat for you at the time below. Confirm it if it works, or choose "I can't make it" and we will arrange another.</p>
      ${brandTable([
        ["📅 Date", ct.dateLabel],
        ["⏰ Time", ct.timeLine],
        ["🌍 Timezone", tzDisplay],
      ])}
      ${respondSectionEn}
      ${meetSection}
      ${breakdownEn}
      <div style="margin: 28px 0 8px; text-align: center;">
        <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">Get ready — start with these two steps</p>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding: 0 8px 0 0; text-align: center;">
            <a href="${SITE_URL}/placement-test" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">🎯 Take the Placement Test</a>
          </td>
          <td style="padding: 0 0 0 8px; text-align: center;">
            <a href="${SITE_URL}/pricing" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">💰 See Class Prices</a>
          </td>
        </tr></table>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Confirming attendance helps us reserve your seat and prepare for you.</p>
      ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">📎 A calendar file (.ics) is attached — open it to add your class to any calendar app</p>` : ""}
    `, false),
    icsAttachment,
  };
}

export function buildTrialGroupFullEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const isArabicClass = p.class_language === "arabic";
  const ct = renderClassTime({
    date: p.trial_date, time: p.trial_time,
    slotTz: p.trial_timezone || "Asia/Kuala_Lumpur",
    studentTz: p.student_timezone, isAr,
  });
  // The date has to move with the time. Stating a Muscat hour beside a Cairo
  // date is how someone shows up on the wrong day.
  const dayDate = ct.dateLabel || [p.trial_day_name, p.trial_date].filter(Boolean).join(" ");
  const count = p.confirmed_count ?? 4;

  if (isAr) {
    return {
      subject: "KLovers — اكتملت مجموعة حصتك التجريبية! 🎉",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🎉</h1>
        <p>خبر حلو — مجموعة حصتك التجريبية (${isArabicClass ? "عربي" : "إنجليزي"}) اكتملت بـ ${count} طلاب مؤكدين!</p>
        <div style="background-color: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dayDate}</p>
          <p style="margin: 4px 0 0;">🕒 ${ct.timeLine}</p>
        </div>
        <p>احنا متحمسين نشوفك في الحصة! لو عندك أي سؤال رد على الإيميل ده أو راسلنا واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — your trial class group is full! 🎉",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🎉</h1>
      <p>Great news — your ${isArabicClass ? "Arabic" : "English"} trial class group is now full with ${count} confirmed students!</p>
      <div style="background-color: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">📅 ${dayDate}</p>
        <p style="margin: 4px 0 0;">🕒 ${ct.timeLine}</p>
      </div>
      <p>We can't wait to see you in class! Any questions? Reply to this email or message us on WhatsApp.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildTrialRolloverEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  // /trial-booking sits behind AuthProtectedRoute: a student who is not signed
  // in lands on a signup page instead of the dates, which is the opposite of
  // what this email asks her to do. /free-trial is public and carries her
  // through to the same picker either way - it is what the rebook email
  // already uses.
  const bookingUrl = p.booking_url || `${SITE_URL}/free-trial`;
  const prevDate = p.previous_trial_date || "";
  const waUrl = "https://wa.me/201010003084";

  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية اتأجلت، فيه مواعيد جديدة! 📅",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}!</h1>
        <p>حصتك التجريبية${prevDate ? ` يوم ${prevDate}` : ""} ما اتقيّمتش لأن مجموعتك ما وصلتش لعدد الطلاب المطلوب — مش لسبب راجع لك، وحصتك <strong>مش ضايعة</strong>.</p>
        <p>دلوقتي فيه مواعيد جديدة متاحة، واحنا محتفظين بحجزك. اختار الميعاد اللي يناسبك:</p>
        <p>كل ميعاد بيتشرح بلغة واحدة بس. لو اخترت ميعاد <strong>إنجليزي</strong>، الحصة هتبقى كلها بالإنجليزي. ولو اخترت ميعاد <strong>عربي</strong>، الحصة هتبقى كلها بالعربي.</p>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("اختار ميعاد جديد", bookingUrl)}
        </div>
        <p>ولو المجموعة ما اكتملتش تاني، هنبعتلك إيميل جديد بالمواعيد اللي بعدها — مكانك محفوظ، ومش محتاج تعمل أي حاجة عشان تحتفظ بيه.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">أي سؤال؟ رد على الإيميل ده أو كلمنا على واتساب:</p>
        <div style="margin: 8px 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — your trial was postponed, new dates are up! 📅",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}!</h1>
      <p>Your trial class${prevDate ? ` on ${prevDate}` : ""} didn't run because that group didn't reach the number of students we need to hold it — this wasn't anything on your end, and your trial spot <strong>hasn't been used up</strong>.</p>
      <p>New trial dates are available now, and we've kept your booking on file. Pick whichever works for you:</p>
      <p>Each slot is taught in one language only. If you pick an <strong>English</strong> slot, the whole class is in English. If you pick an <strong>Arabic</strong> slot, the whole class is in Arabic.</p>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Pick a new date", bookingUrl)}
      </div>
      <p>If this group still doesn't fill up, we'll email you again with the next available dates — you won't lose your place, and you don't need to do anything to keep it.</p>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp:</p>
      <div style="margin: 8px 0 4px; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

// Post-trial nurture sequence. Three stages, shared shell.

// Post-trial nurture sequence. Three stages, shared shell.
export function buildTrialPrepEmail(p: EmailPayload) {
  const isAr = p.language === "ar";
  const placementUrl = `${SITE_URL}/placement-test`;
  if (isAr) {
    return {
      subject: "KLovers — حصتك التجريبية غداً 🎯",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 👋</h1>
        <p>حصتك التجريبية المجانية <strong>غداً</strong>. إليك كيف تستفيد منها للأقصى:</p>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">✅ اختبر مستواك قبل الحصة (دقيقتان)</p>
          <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">هنطابقك مع المعلم المناسب من أول دقيقة. مجاني وبدون تسجيل.</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("ابدأ اختبار المستوى", placementUrl)}
        </div>
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">نصائح سريعة:</h3>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px; line-height: 1.8;">
          <li>🎧 جهّز سماعات وجرّب الكاميرا قبل الحصة</li>
          <li>📝 اكتب 2–3 أسباب ليه بتتعلم كوري (هيساعد المعلم)</li>
          <li>☕ خذ حاجة تشربها — الحصة 30 دقيقة</li>
        </ul>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">في أي سؤال؟ رد على الإيميل ده أو راسلنا واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your trial is tomorrow 🎯",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 👋</h1>
      <p>Your free trial class is <strong>tomorrow</strong>. Here's how to get the most out of it:</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">✅ Find your level before class (2 min)</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">So your teacher is ready for you from minute one. Free, no sign-up.</p>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Take the placement test", placementUrl)}
      </div>
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">Quick tips:</h3>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px; line-height: 1.8;">
        <li>🎧 Test your headphones + camera beforehand</li>
        <li>📝 Jot down 2–3 reasons you're learning Korean (helps your teacher)</li>
        <li>☕ Grab a drink — it's a 30-minute session</li>
      </ul>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildTrialFollowupDay1Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  const pricingUrl = `${SITE_URL}/pricing`;
  if (isAr) {
    return {
      subject: "KLovers — ازاي كانت حصتك التجريبية؟ 💭",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}! 🌱</h1>
        <p>ازاي كانت حصتك التجريبية أمس؟ نتمنى تكون حبيتها.</p>
        <p>لو جاهز تكمل رحلة الكورية، شوف خططنا — فيه <strong>حصص جماعية تبدأ من 25$</strong> وحصص خاصة لو بتفضّل الاهتمام الشخصي.</p>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">✨ ليه يسجّل الطلاب معانا:</p>
          <ul style="margin: 6px 0 0; padding-right: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
            <li>مجموعات صغيرة (4–8 طلاب)</li>
            <li>معلمين أصليين بخبرة TOPIK</li>
            <li>استرداد كامل بعد أول حصة مدفوعة لو مش حبّيت</li>
          </ul>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("شوف الخطط", pricingUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">عندك أسئلة أو استفسارات عن أنسب خطة؟ رد على الإيميل ده أو راسلنا واتساب وهنساعدك تختار.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — how was your trial class? 💭",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! 🌱</h1>
      <p>How was your trial class yesterday? We hope you loved it.</p>
      <p>If you're ready to keep going, here are our plans — <strong>group classes from just $25</strong> and private 1-on-1 if you want dedicated attention.</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">✨ Why students stay with us:</p>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
          <li>Small groups (4–8 students)</li>
          <li>Native teachers with TOPIK experience</li>
          <li>Full refund after your first paid class if you don't love it</li>
        </ul>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("See the plans", pricingUrl)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Questions, or want help picking a plan? Reply to this email or message us on WhatsApp — we'll help you choose.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildTrialFollowupDay3Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  const waUrl = "https://wa.me/201010003084?text=" + encodeURIComponent("Hi! I just finished my free trial and I'd like help picking a plan.");
  const pricingUrl = `${SITE_URL}/pricing`;
  if (isAr) {
    return {
      subject: "KLovers — محتاج مساعدة نختار خطة؟ 🤝",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}!</h1>
        <p>مرّت كام يوم على حصتك التجريبية — أحياناً اختيار الخطة المناسبة بياخد وقت.</p>
        <p>لو عندك أي سؤال عن الأسعار أو المجموعات أو الجدول، <strong>كلمنا على واتساب</strong> وهنساعدك في دقايق.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">💬 كلمنا على واتساب</a>
        </div>
        <p style="text-align: center; color: ${BRAND_MUTED}; font-size: 13px;">أو <a href="${pricingUrl}" style="color: ${BRAND_DARK};">شوف الخطط بنفسك</a></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">هيوصلك تشيك-إن واحد بعد كده الأسبوع الجاي، وبعدها نسيبك في هدوء.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — need help picking a plan? 🤝",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>It's been a few days since your trial — picking the right plan can take some thought.</p>
      <p>If you've got any question on pricing, groups, or schedule, <strong>message us on WhatsApp</strong> and we'll sort it out in minutes.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">💬 Chat on WhatsApp</a>
      </div>
      <p style="text-align: center; color: ${BRAND_MUTED}; font-size: 13px;">Or <a href="${pricingUrl}" style="color: ${BRAND_DARK};">browse the plans yourself</a></p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
      <p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">One more check-in next week, then we'll leave you be.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}

export function buildTrialFollowupDay7Email(p: EmailPayload) {
  const isAr = p.language === "ar";
  const pricingUrl = `${SITE_URL}/pricing`;
  const referralUrl = p.referral_url ?? `${SITE_URL}/free-trial`;
  if (isAr) {
    return {
      subject: "KLovers — عامل إيه بعد الحصة التجريبية؟ 🌱",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحباً ${p.name}!</h1>
        <p>مرّ أسبوع على حصتك التجريبية معانا. حابين نعرف رأيك، ولو حابب تكمل معانا الخطط لسه متاحة.</p>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("شوف الخطط", pricingUrl)}
        </div>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">🎁 اعرف صحابك على KLovers</p>
          <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 13px;">شارك رابط الحصة التجريبية المجانية مع أي حد حابب يتعلم كورية:</p>
          <p style="margin: 8px 0 0; font-size: 13px;"><a href="${referralUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">${referralUrl}</a></p>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">أي سؤال؟ رد على الإيميل ده أو راسلنا واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — how's it going since your trial? 🌱",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}!</h1>
      <p>It's been a week since your trial class. We'd love to hear how it went — and our plans are still open if you'd like to keep learning with us.</p>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("See the plans", pricingUrl)}
      </div>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">🎁 Know someone learning Korean?</p>
        <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 13px;">Share your free trial link with a friend:</p>
        <p style="margin: 8px 0 0; font-size: 13px;"><a href="${referralUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">${referralUrl}</a></p>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
