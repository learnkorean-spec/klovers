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
        summary: isAr ? "حصة كورية تجريبية مجانية — كلوفرز" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `الحصة التجريبية المجانية في اللغة الكورية مع كلوفرز.\nالمستوى: ${p.level || "مبتدئ"}\n\nhttps://kloversegy.com`
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
        <p style="margin: 0 0 8px; color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "ملف التقويم (.ics) مرفق بهذه الرسالة، ويضيف الحصة إلى أي تطبيق تقويم (Google وApple وOutlook)" : "A calendar file (.ics) is attached — open it to add your class to Google Calendar, Apple Calendar, or Outlook"}</p>
        ${p.calendar_url ? `<a href="${p.calendar_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px;">${isAr ? "أضف إلى Google Calendar" : "Add to Google Calendar"}</a>` : ""}
       </div>`
    : (p.calendar_url
        ? `<div style="margin: 16px 0; text-align: center;">
            <a href="${p.calendar_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">${isAr ? "الإضافة إلى تقويم Google" : "Add to Google Calendar"}</a>
           </div>`
        : "");

  const joinBtn = p.class_link_url
    ? `<div style="margin: 20px 0; text-align: center;">
        <a href="${p.class_link_url}" style="display:inline-block;background-color:${BRAND_YELLOW} !important;color:${BRAND_BLACK} !important;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">${isAr ? "الانضمام إلى الحصة" : "Join the Class"}</a>
       </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: ${isAr ? "right" : "left"};">${isAr ? "يُرسل رابط الحصة قبل الموعد مباشرة عبر البريد الإلكتروني." : "The class link will be sent to you before the session. Keep an eye on your inbox! "}</p>`;

  // ── ENGLISH VERSION ──────────────────────────────────────────────────────
  if (!isAr) {
    return {
      subject: "You're in! Your free Korean trial class is confirmed — KLovers",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">Hi ${p.name}! </h1>
        <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
          We're so excited to have you! Your <strong>free trial Korean class</strong> is officially confirmed.
          Get ready for a fun, relaxed session — no pressure, just great energy.         </p>

        <!-- Details card -->
        <div style="background-color: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
          <div style="background-color: ${BRAND_BLACK}; padding: 10px 18px;">
            <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Class Details</p>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; width: 90px;">Date</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.dateLabel}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Time</td>
              <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.timeLine}</td>
            </tr>
            <tr>
              <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px;">Timezone</td>
              <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tzDisplay}</td>
            </tr>
          </table>
        </div>

        ${calSection}
        ${joinBtn}

        <!-- What to expect -->
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px;">What happens in this session?</h3>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>

        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Introductions</strong> — meet your teacher and the rest of the group
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Why Korean?</strong> — everyone shares their story and motivation
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>How the course works</strong> — structure, schedule, and what to expect
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Korean levels explained</strong> — we'll help you find where you fit in
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Your goals</strong> — what do you want to achieve with Korean?
            </td>
          </tr>
          <tr>
            <td style="padding: 9px 0; vertical-align: top;">
              <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px; flex-shrink: 0;"></span>
            </td>
            <td style="padding: 9px 0 9px 10px; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.5;">
              <strong>Q&amp;A</strong> — ask us anything, no question is too small!
            </td>
          </tr>
        </table>

        <!-- Tip box -->
        <div style="background-color: #fffff0; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0;">
          <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;"><strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile — that's all you need! </p>
        </div>

        <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">Questions? Just reply to this email or reach us on WhatsApp anytime.</p>
      `, false),
      icsAttachment,
    };
  }

  // ── ARABIC VERSION ───────────────────────────────────────────────────────
  return {
    subject: "تأكيد الحصة التجريبية المجانية في الكورية — كلوفرز",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 24px; margin-bottom: 4px;">أهلًا ${p.name}!</h1>
      <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-bottom: 20px;">
        يسعدنا الانضمام إلينا! تأكّد المقعد في <strong>الحصة التجريبية المجانية</strong> بنجاح.
        جلسة ممتعة خالية من الضغط، بطاقة إيجابية وأصدقاء جدد.       </p>

      <!-- Details card -->
      <div style="background-color: #f9f9f9; border: 1px solid #e8e8e8; border-radius: 10px; overflow: hidden; margin-bottom: 20px;">
        <div style="background-color: ${BRAND_BLACK}; padding: 10px 18px; text-align: right;">
          <p style="margin: 0; color: ${BRAND_YELLOW}; font-size: 12px; font-weight: 700; letter-spacing: 1px;">تفاصيل الحصة </p>
        </div>
        <table style="width: 100%; border-collapse: collapse; direction: rtl;">
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600; width: 90px;">التاريخ</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.dateLabel}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; color: #888; font-size: 12px; font-weight: 600;">الوقت</td>
            <td style="padding: 11px 18px; border-bottom: 1px solid #f0f0f0; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${ct.timeLine}</td>
          </tr>
          <tr>
            <td style="padding: 11px 18px; color: #888; font-size: 12px; font-weight: 600;">التوقيت</td>
            <td style="padding: 11px 18px; font-weight: 700; color: ${BRAND_DARK}; font-size: 14px;">${tzDisplay}</td>
          </tr>
        </table>
      </div>

      ${calSection}
      ${joinBtn}

      <!-- What to expect -->
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; font-weight: 700; margin: 24px 0 12px; text-align: right;">ماذا يحدث في هذه الحصة؟</h3>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 12px; text-align: right;">ليست حصة دراسية، بل لقاء تعارف وحديث ممتع. معًا نبدأ بما يلي:</p>

      <table style="width: 100%; border-collapse: collapse; direction: rtl;">
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top; width: 36px;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>تعارف</strong>: التعرّف على المعلمة وعلى المجموعة
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>لماذا الكورية؟</strong>: يشارك كل طالب قصته وسبب اهتمامه باللغة
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>كيف تسير الدورة؟</strong>: شرح المحتوى والجداول وكل التفاصيل
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>مستويات اللغة الكورية</strong>: تحديد المستوى الحالي ونقطة البداية
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; border-bottom: 1px solid #f5f5f5; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; border-bottom: 1px solid #f5f5f5; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>الأهداف</strong>: ما المطلوب تحقيقه من تعلّم الكورية؟
          </td>
        </tr>
        <tr>
          <td style="padding: 9px 0; vertical-align: top;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; background-color: ${BRAND_YELLOW}; border-radius: 50%; font-size: 13px;"></span>
          </td>
          <td style="padding: 9px 10px 9px 0; color: ${BRAND_TEXT}; font-size: 14px; line-height: 1.6; text-align: right;">
            <strong>أسئلة وأجوبة</strong>: كل سؤال مرحّب به، فلا يوجد سؤال صغير.
          </td>
        </tr>
      </table>

      <!-- Tip box -->
      <div style="background-color: #fffff0; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 6px; padding: 13px 16px; margin: 22px 0; text-align: right;">
        <p style="margin: 0; color: ${BRAND_DARK}; font-size: 13.5px;"><strong>نصيحة سريعة:</strong> الانضمام قبل الحصة بخمس دقائق، في مكان هادئ، مع ابتسامة. هذا كل ما يلزم. </p>
      </div>

      <p style="color: ${BRAND_MUTED}; font-size: 12px; margin-top: 8px; text-align: center;">للأسئلة: الرد على هذه الرسالة أو مراسلتنا عبر واتساب في أي وقت.</p>
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
        const timeLine = `${ct.timeLine}`;
        return `<div style="background-color: ${BRAND_GRAY}; border: 1px solid #e0e0e0; border-radius: 8px; padding: 12px 16px; margin: 8px 0; ${isAr ? "text-align: right;" : ""}">
          <p style="margin: 0; font-weight: bold; color: ${BRAND_DARK};">${dayPart}</p>
          <p style="margin: 4px 0 0; color: ${BRAND_MUTED}; font-size: 13px;">${timeLine}</p>
        </div>`;
      }).join("")
    : "";

  const localTimeNote = isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">في صفحة الحجز يظهر كل موعد <strong>بالتوقيت المحلي</strong> تلقائيًا.</p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; margin: 0 0 14px;">When you open the booking page, every time is shown in <strong>your own local time</strong> automatically.</p>`;

  const meetLinkSection = p.class_link_url
    ? (isAr
        ? `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">رابط Google Meet (يُرجى حفظه)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الانضمام إلى الحصة</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">ملاحظة: هذا الرابط شخصي ولا يُشارَك مع أحد.</p>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">Your Google Meet link (save it for class day!)</p>
            <a href="${p.class_link_url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
            <p style="margin: 8px 0 0; color: ${BRAND_MUTED}; font-size: 12px;">Note: This link is personal — please don't share it.</p>
          </div>`)
    : "";

  const chooseBtn = `<div style="margin: 24px 0; text-align: center;">
    <a href="${url}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
      ${isAr ? "اختيار الموعد الآن" : "Choose My Date"}
    </a>
  </div>`;

  if (isAr) {
    return {
      subject: "كلوفرز — الحصة التجريبية المجانية جاهزة للحجز",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلًا ${p.name}!</h1>
        <p>الحصة الكورية التجريبية المجانية <strong>جاهزة للحجز</strong>. هذه هي المواعيد المتاحة:</p>
        ${slotCards}
        ${localTimeNote}
        <p>يُشرح كل موعد بلغة واحدة فقط: موعد <strong>بالإنجليزية</strong> يعني حصة كاملة بالإنجليزية، وموعد <strong>بالعربية</strong> يعني حصة كاملة بالعربية.</p>
        <p>الأماكن محدودة والمجموعة <strong>صغيرة</strong>، والحجز المبكر أفضل.</p>
        ${chooseBtn}
        ${meetLinkSection}
        <p>وإذا اكتملت الحصة قبل الحجز، نرسل المواعيد التالية، و<strong>المقعد محفوظ</strong> دون أي خطوة إضافية.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">للأسئلة: الرد على هذه الرسالة أو التواصل معنا عبر واتساب:</p>
        <div style="margin: 8px 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">واتساب</a>
        </div>
      `, true),
    };
  }
  return {
    subject: "KLovers — your free trial is ready to book ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! </h1>
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
        <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">WhatsApp</a>
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
        summary: isAr ? "حصة كورية تجريبية مجانية — كلوفرز" : "Free Korean Trial Class — Klovers Egypt",
        description: isAr
          ? `الحصة التجريبية المجانية في اللغة الكورية مع كلوفرز.\nhttps://kloversegy.com`
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
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">رابط Google Meet الخاص</p>
            <a href="${classLink}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">الانضمام إلى الحصة</a>
          </div>`
        : `<div style="background-color: #f0fff4; border: 1px solid #6ee7b7; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 8px; font-weight: bold; color: ${BRAND_DARK};">Your Google Meet link</p>
            <a href="${classLink}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">Join the Class</a>
          </div>`)
    : (isAr
        ? `<div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">يُرسل رابط الحصة بالبريد الإلكتروني قبل ٢٤ ساعة من الموعد</p>
          </div>`
        : `<div style="background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 14px 18px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;">Your class link will be sent to you 24 hours before your session</p>
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
        <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 14px;">كل رد يساعدنا: «تأكيد الحضور» يحجز المقعد، و«تعذّر الحضور» يتيحه لطالب آخر مع ترتيب موعد جديد.</p>
        <a href="${confirmUrl}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">تأكيد الحضور</a>
        <div style="margin-top: 12px;">
          <a href="${declineUrl}" style="display: inline-block; background-color: #ffffff !important; color: ${BRAND_MUTED} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: 1px solid #d4d4d4;">تعذّر الحضور</a></div><div style="margin-top: 18px;"><a href="${SITE_URL}/trial-guide-ar.pdf" style="color: ${BRAND_MUTED} !important; font-size: 13px; text-decoration: underline;">تفاصيل الحجز والبرنامج ←</a>
        </div>
      </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: right;">تعذّر إنشاء رابط التأكيد حاليًا. الرد على هذه الرسالة كافٍ لإبلاغنا بالحضور من عدمه. </p>`;

  const respondSectionEn = hasConfirmToken
    ? `<div style="margin: 24px 0; text-align: center;">
        <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 14px;">Either answer helps us: yes holds your seat, and "I can't make it" frees it for someone else so we can find you another time.</p>
        <a href="${confirmUrl}" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; border: 2px solid ${BRAND_BLACK};">Confirm My Attendance</a>
        <div style="margin-top: 12px;">
          <a href="${declineUrl}" style="display: inline-block; background-color: #ffffff !important; color: ${BRAND_MUTED} !important; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 13px; border: 1px solid #d4d4d4;">I can't make it</a></div><div style="margin-top: 18px;"><a href="${SITE_URL}/trial-guide-en.pdf" style="color: ${BRAND_MUTED} !important; font-size: 13px; text-decoration: underline;">Not sure what you booked? See the programme &rarr;</a>
        </div>
      </div>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 13px; text-align: left;">We couldn't build your confirmation link this time. Just reply to this email and tell us whether you'll be there. </p>`;

  const breakdownAr = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">ماذا سيحدث في هذه الحصة؟</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">ليست حصة دراسية عادية، بل جلسة تعارف ممتعة. وهذا ما سنقوم به:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["", "تعارف", "التعرّف على المعلمة وبقية المجموعة"],
        ["", "لماذا الكورية؟", "يشارك كل طالب قصته وسبب اهتمامه"],
        ["", "كيف تسير الدورة؟", "شرح منهج وطريقة التدريس"],
        ["", "مستويات الكورية", "تحديد موقع المستوى في رحلة التعلّم"],
        ["", "الأهداف", "مناقشة ما يُراد تحقيقه"],
        ["", "أسئلة وأجوبة", "كل سؤال مرحّب به"],
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
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;"><strong>نصيحة سريعة:</strong> الانضمام قبل ٥ دقائق، في مكان هادئ، مع ابتسامة </p>
    </div>`;

  const breakdownEn = `
    <h2 style="color: ${BRAND_DARK}; font-size: 18px; margin: 28px 0 8px;">What happens in this session?</h2>
    <p style="color: ${BRAND_MUTED}; font-size: 14px; margin: 0 0 16px;">This is <strong>not</strong> a regular lesson — it's a friendly intro session where we get to know you! Here's what we'll do:</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
      ${[
        ["", "Introductions", "meet your teacher and the rest of the group"],
        ["", "Why Korean?", "everyone shares their story and motivation"],
        ["", "How the course works", "we walk you through the curriculum and teaching style"],
        ["", "Korean levels explained", "understand where you are in the learning journey"],
        ["", "Your goals", "we discuss what you want to achieve"],
        ["", "Q&A", "ask us anything on your mind"],
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
      <p style="margin: 0; color: ${BRAND_DARK}; font-size: 14px;"><strong>Quick tip:</strong> Join 5 minutes early, find a quiet spot, and bring your smile </p>
    </div>`;

  if (isAr) {
    return {
      subject: "كلوفرز — تأكيد حضور الحصة التجريبية",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>نعتذر عن طول الانتظار. فُتحت مواعيد الحصص التجريبية الآن، وحُجز مقعد في الموعد أدناه. عند مناسبته يكفي التأكيد، وعند عدم مناسبته يُختار «تعذّر الحضور» لنرتّب موعدًا آخر.</p>
        ${brandTable([
          ["التاريخ", ct.dateLabel],
          ["الوقت", ct.timeLine],
          ["التوقيت", tzDisplay],
        ])}
        ${respondSectionAr}
        ${meetSection}
        ${breakdownAr}
        <div style="margin: 28px 0 8px; text-align: center;">
          <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">الاستعداد للحصة بخطوتين</p>
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="padding: 0 8px 0 0; text-align: center;">
              <a href="${SITE_URL}/placement-test" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">اختبر مستواك</a>
            </td>
            <td style="padding: 0 0 0 8px; text-align: center;">
              <a href="${SITE_URL}/pricing" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">شوف الأسعار</a>
            </td>
          </tr></table>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">تأكيد الحضور يساعدنا في حجز المقعد والتحضير للحصة. شكرًا!</p>
        ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">ملف التقويم (.ics) مرفق لإضافة الحصة إلى التقويم</p>` : ""}
      `, true),
      icsAttachment,
    };
  }
  return {
    subject: "Please confirm your attendance for your Klovers trial class ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! </h1>
      <p>You have been waiting a long time, and we are sorry for the silence. Trial dates are open again, and we have held a seat for you at the time below. Confirm it if it works, or choose "I can't make it" and we will arrange another.</p>
      ${brandTable([
        ["Date", ct.dateLabel],
        ["Time", ct.timeLine],
        ["Timezone", tzDisplay],
      ])}
      ${respondSectionEn}
      ${meetSection}
      ${breakdownEn}
      <div style="margin: 28px 0 8px; text-align: center;">
        <p style="color: ${BRAND_DARK}; font-weight: bold; font-size: 15px; margin: 0 0 16px;">Get ready — start with these two steps</p>
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="padding: 0 8px 0 0; text-align: center;">
            <a href="${SITE_URL}/placement-test" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">Take the Placement Test</a>
          </td>
          <td style="padding: 0 0 0 8px; text-align: center;">
            <a href="${SITE_URL}/pricing" style="display: inline-block; background-color: ${BRAND_YELLOW} !important; color: ${BRAND_BLACK} !important; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK}; width: 100%; box-sizing: border-box;">See Class Prices</a>
          </td>
        </tr></table>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Confirming attendance helps us reserve your seat and prepare for you.</p>
      ${icsAttachment ? `<p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">A calendar file (.ics) is attached — open it to add your class to any calendar app</p>` : ""}
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
      subject: "كلوفرز — اكتملت مجموعة الحصة التجريبية!",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>خبر سار: اكتملت مجموعة الحصة التجريبية (${isArabicClass ? "بالعربية" : "بالإنجليزية"}) بـ ${count} طلاب مؤكدين!</p>
        <div style="background-color: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;">
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${dayDate}</p>
          <p style="margin: 4px 0 0;">${ct.timeLine}</p>
        </div>
        <p>نتطلع إلى اللقاء في الحصة! للأسئلة: الرد على هذه الرسالة أو مراسلتنا عبر واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — your trial class group is full! ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! </h1>
      <p>Great news — your ${isArabicClass ? "Arabic" : "English"} trial class group is now full with ${count} confirmed students!</p>
      <div style="background-color: ${BRAND_GRAY}; padding: 12px 16px; border-radius: 6px; margin: 12px 0; text-align: center;">
        <p style="margin: 0; font-size: 16px; font-weight: bold;">${dayDate}</p>
        <p style="margin: 4px 0 0;">${ct.timeLine}</p>
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
      subject: "كلوفرز — تأجيل الحصة التجريبية ومواعيد جديدة متاحة",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>لم تُعقد الحصة التجريبية${prevDate ? ` يوم ${prevDate}` : ""} لأن المجموعة لم تبلغ العدد المطلوب من الطلاب، والسبب لا يعود إلى الطالب، والحصة <strong>لم تضِع</strong>.</p>
        <p>تتوفر الآن مواعيد جديدة، والحجز محفوظ. يمكن اختيار الموعد المناسب:</p>
        <p>يُشرح كل موعد بلغة واحدة فقط: موعد <strong>بالإنجليزية</strong> يعني حصة كاملة بالإنجليزية، وموعد <strong>بالعربية</strong> يعني حصة كاملة بالعربية.</p>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("اختيار موعد جديد", bookingUrl)}
        </div>
        <p>وإذا لم تكتمل المجموعة مجددًا، نرسل رسالة جديدة بالمواعيد التالية، والمقعد محفوظ دون أي خطوة إضافية.</p>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">للأسئلة: الرد على هذه الرسالة أو التواصل معنا عبر واتساب:</p>
        <div style="margin: 8px 0 4px; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">واتساب</a>
        </div>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — your trial was postponed, new dates are up! ",
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
        <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">WhatsApp</a>
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
      subject: "كلوفرز — الحصة التجريبية غدًا",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>الحصة التجريبية المجانية <strong>غدًا</strong>. وهذه طريقة الاستفادة منها إلى أقصى حد:</p>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">اختبار المستوى قبل الحصة (دقيقتان)</p>
          <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">لتكون الحصة مناسبة للمستوى من الدقيقة الأولى. مجاني ودون تسجيل.</p>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("بدء اختبار المستوى", placementUrl)}
        </div>
        <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">نصائح سريعة:</h3>
        <ul style="color: ${BRAND_TEXT}; padding-right: 20px; line-height: 1.8;">
          <li>تجهيز السماعات وتجربة الكاميرا قبل الحصة</li>
          <li>كتابة سببين أو ثلاثة لتعلّم الكورية (يساعد المعلمة)</li>
          <li>مشروب قريب، فالحصة 30 دقيقة</li>
        </ul>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">للأسئلة: الرد على هذه الرسالة أو مراسلتنا عبر واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — Your trial is tomorrow ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! </h1>
      <p>Your free trial class is <strong>tomorrow</strong>. Here's how to get the most out of it:</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">Find your level before class (2 min)</p>
        <p style="margin: 0; color: ${BRAND_MUTED}; font-size: 13px;">So your teacher is ready for you from minute one. Free, no sign-up.</p>
      </div>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Take the placement test", placementUrl)}
      </div>
      <h3 style="color: ${BRAND_DARK}; font-size: 16px; margin-top: 24px;">Quick tips:</h3>
      <ul style="color: ${BRAND_TEXT}; padding-left: 20px; line-height: 1.8;">
        <li>Test your headphones + camera beforehand</li>
        <li>Jot down 2–3 reasons you're learning Korean (helps your teacher)</li>
        <li>Grab a drink — it's a 30-minute session</li>
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
      subject: "كلوفرز — كيف كانت الحصة التجريبية؟",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>كيف كانت الحصة التجريبية أمس؟ نتمنى أن تكون قد نالت الإعجاب.</p>
        <p>لاستكمال رحلة الكورية، هذه خططنا: <strong>حصص جماعية تبدأ من 25$</strong>، وحصص خاصة لمن يفضّل الاهتمام الشخصي.</p>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">لماذا يسجّل الطلاب معنا:</p>
          <ul style="margin: 6px 0 0; padding-right: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
            <li>مجموعات صغيرة، لينال كل طالب فرصته في الكلام</li>
            <li>معلمة خريجة الألسن، قسم اللغة الكورية، تدرّس منذ ١٣ عامًا</li>
            <li>استرداد كامل بعد أول حصة مدفوعة عند عدم الرضا</li>
          </ul>
        </div>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("عرض الخطط", pricingUrl)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">للأسئلة عن الخطة الأنسب: الرد على هذه الرسالة أو مراسلتنا عبر واتساب، ونساعد في الاختيار.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — how was your trial class? ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}! </h1>
      <p>How was your trial class yesterday? We hope you loved it.</p>
      <p>If you're ready to keep going, here are our plans — <strong>group classes from just $25</strong> and private 1-on-1 if you want dedicated attention.</p>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">Why students stay with us:</p>
        <ul style="margin: 6px 0 0; padding-left: 20px; color: ${BRAND_TEXT}; line-height: 1.7;">
          <li>Small groups, so everyone gets time to speak</li>
          <li>Taught by an Al-Alsun Korean graduate with 13 years of teaching</li>
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
      subject: "كلوفرز — مساعدة في اختيار الخطة",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>مرّت أيام قليلة على الحصة التجريبية، واختيار الخطة المناسبة قد يحتاج إلى بعض الوقت.</p>
        <p>لأي سؤال عن الأسعار أو المجموعات أو الجدول، <strong>التواصل معنا عبر واتساب</strong>، والرد خلال دقائق.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">التواصل عبر واتساب</a>
        </div>
        <p style="text-align: center; color: ${BRAND_MUTED}; font-size: 13px;">أو <a href="${pricingUrl}" style="color: ${BRAND_DARK};">عرض الخطط</a></p>
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
        <p style="color: ${BRAND_MUTED}; font-size: 12px; text-align: center;">تصل رسالة متابعة واحدة الأسبوع القادم، ولا رسائل بعدها.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — need help picking a plan? ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>It's been a few days since your trial — picking the right plan can take some thought.</p>
      <p>If you've got any question on pricing, groups, or schedule, <strong>message us on WhatsApp</strong> and we'll sort it out in minutes.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${waUrl}" style="display: inline-block; background-color: #39FF14 !important; color: ${BRAND_BLACK} !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Chat on WhatsApp</a>
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
      subject: "كلوفرز — ماذا بعد الحصة التجريبية؟",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">مرحبًا ${p.name}!</h1>
        <p>مرّ أسبوع على الحصة التجريبية معنا. يسعدنا سماع الرأي، والخطط ما زالت متاحة للاستمرار.</p>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("عرض الخطط", pricingUrl)}
        </div>
        <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
          <p style="margin: 0 0 8px; font-weight: bold;">دعوة الأصدقاء إلى كلوفرز</p>
          <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 13px;">رابط الحصة التجريبية المجانية للمشاركة مع كل من يرغب في تعلّم الكورية:</p>
          <p style="margin: 8px 0 0; font-size: 13px;"><a href="${referralUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">${referralUrl}</a></p>
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">للأسئلة: الرد على هذه الرسالة أو مراسلتنا عبر واتساب.</p>
        ${unsubscribeFooter(p.unsubscribe_token, true)}
      `, true),
    };
  }
  return {
    subject: "KLovers — how's it going since your trial? ",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name}!</h1>
      <p>It's been a week since your trial class. We'd love to hear how it went — and our plans are still open if you'd like to keep learning with us.</p>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("See the plans", pricingUrl)}
      </div>
      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; padding: 14px 18px; border-radius: 4px; margin: 16px 0;">
        <p style="margin: 0 0 8px; font-weight: bold;">Know someone learning Korean?</p>
        <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 13px;">Share your free trial link with a friend:</p>
        <p style="margin: 8px 0 0; font-size: 13px;"><a href="${referralUrl}" style="color: ${BRAND_DARK}; font-weight: bold;">${referralUrl}</a></p>
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 20px;">Any questions? Reply to this email or message us on WhatsApp.</p>
      ${unsubscribeFooter(p.unsubscribe_token, false)}
    `, false),
  };
}
