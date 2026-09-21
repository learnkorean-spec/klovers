// The letter a student gets when her class is starting.
//
// Sent by hand from the admin Groups screen, to every seated student of one
// group at once. It is the only letter that introduces the course rather than
// chasing something: the class link letter states a room and a time, and the
// payment letters state money. Before this, a student who had just been
// seated received no book and no idea that the dashboard exists.
//
// Three things, in this order, because that is the order she needs them:
//
//   1. WHERE AND WHEN — group, level, day and time, and the room link. The
//      same room every week, said plainly, because that is the question she
//      will ask again next Tuesday.
//   2. THE BOOK — its own button. Optional at this layer: a group that has no
//      book yet still has a class starting, and the admin screen is what
//      insists on the link before it will send. When it is absent the whole
//      section is left out rather than rendering an empty button.
//   3. THE DASHBOARD — not a bare link. It says what is actually on it: her
//      schedule, whether each class is marked attended, and what she owes.
//      A link labelled "dashboard" gets ignored; a list of what it answers
//      does not.
//
// No unsubscribe footer and no List-Unsubscribe token is passed for this one.
// It is transactional — you do not get to opt out of being told where your
// class is and where your book is — which is the same rule the class link and
// payment letters follow.
//
// Dispatched AHEAD of the switch in index.ts, like `trial_guide` and
// `class_reminder`: the slug is deliberately absent from the template union
// in common.ts, because that file is the single import of every template and
// the only write path here is a whole-file rewrite.

import type { EmailPayload } from "./common.ts";
import {
  BRAND_YELLOW, BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED,
  brandWrapper, brandButton,
} from "./common.ts";

const WA_URL = "https://wa.me/201010003084";
const DASHBOARD_URL = "https://kloversegy.com/dashboard";

/** Fields this letter needs that are not on the shared payload type. */
interface WelcomePayload extends EmailPayload {
  class_time_label?: string;
  book_url?: string;
}

export function buildCourseWelcomeEmail(payload: EmailPayload) {
  const p = payload as WelcomePayload;
  const isAr = p.language === "ar";
  const when = (p.class_time_label ?? "").trim();
  const room = (p.class_link_url ?? "").trim();
  const book = (p.book_url ?? "").trim();
  const group = (p.group_name ?? "").trim();
  const level = (p.level ?? "").trim();

  const box = (label: string, value: string) =>
    value ? `<p style="margin: 0 0 6px; color: ${BRAND_TEXT}; font-size: 14px;">${label} <strong>${value}</strong></p>` : "";

  if (isAr) {
    return {
      subject: "KLovers — أهلاً بكِ في الكورس 🌿",
      html: brandWrapper(`
        <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلاً ${p.name}،</h1>
        <p>مكانكِ اتأكّد — أهلاً بكِ معانا في كورس الكوري. دي كل حاجة هتحتاجيها قبل أول حصة.</p>

        <div style="background-color: ${BRAND_GRAY}; border-right: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
          ${box("المجموعة:", group)}
          ${box("المستوى:", level)}
          ${box("الموعد:", when)}
        </div>

        ${room ? `
        <div style="margin: 24px 0; text-align: center;">
          ${brandButton("رابط الحصة", room)}
        </div>
        <p style="color: ${BRAND_MUTED}; font-size: 13px;">نفس الرابط كل أسبوع، احفظيه عندكِ: <a href="${room}" style="color: ${BRAND_DARK};">${room}</a></p>` : ""}

        ${book ? `
        <h2 style="color: ${BRAND_DARK}; font-size: 17px; margin-top: 28px;">كتاب الكورس</h2>
        <p>حمّلي الكتاب قبل أول حصة — هنشتغل عليه من الحصة الأولى.</p>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("حمّلي الكتاب", book)}
        </div>` : ""}

        <h2 style="color: ${BRAND_DARK}; font-size: 17px; margin-top: 28px;">متابعة كل حاجة من مكان واحد</h2>
        <p>من لوحة الطالب هتلاقي:</p>
        <ul style="color: ${BRAND_TEXT}; font-size: 14px; padding-right: 18px; margin: 8px 0 0;">
          <li style="margin-bottom: 6px;">مواعيد حصصكِ وحالة المجموعة</li>
          <li style="margin-bottom: 6px;">الحضور — كل حصة حضرتيها وكل حصة غبتي فيها</li>
          <li style="margin-bottom: 6px;">حالة الدفع — المدفوع والمستحق ومواعيده</li>
        </ul>
        <div style="margin: 20px 0; text-align: center;">
          ${brandButton("افتحي لوحة الطالب", DASHBOARD_URL)}
        </div>

        <p style="color: ${BRAND_MUTED}; font-size: 13px;">أي سؤال قبل الحصة؟ راسلينا على واتساب.</p>
        <div style="margin: 20px 0; text-align: center;">
          <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 واتساب</a>
        </div>
      `, true),
    };
  }

  return {
    subject: "KLovers — welcome to the course 🌿",
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Hi ${p.name},</h1>
      <p>Your place is confirmed — welcome to the course. Here is everything you need before the first class.</p>

      <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid ${BRAND_YELLOW}; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
        ${box("Group:", group)}
        ${box("Level:", level)}
        ${box("When:", when)}
      </div>

      ${room ? `
      <div style="margin: 24px 0; text-align: center;">
        ${brandButton("Your class link", room)}
      </div>
      <p style="color: ${BRAND_MUTED}; font-size: 13px;">It is the same link every week, so keep it somewhere handy: <a href="${room}" style="color: ${BRAND_DARK};">${room}</a></p>` : ""}

      ${book ? `
      <h2 style="color: ${BRAND_DARK}; font-size: 17px; margin-top: 28px;">Your book</h2>
      <p>Download it before the first class — we start working from it straight away.</p>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Download the book", book)}
      </div>` : ""}

      <h2 style="color: ${BRAND_DARK}; font-size: 17px; margin-top: 28px;">Everything in one place</h2>
      <p>Your student dashboard shows:</p>
      <ul style="color: ${BRAND_TEXT}; font-size: 14px; padding-left: 18px; margin: 8px 0 0;">
        <li style="margin-bottom: 6px;">your class times and where your group is up to</li>
        <li style="margin-bottom: 6px;">attendance — every class you attended and every one you missed</li>
        <li style="margin-bottom: 6px;">payments — what is paid, what is due, and when</li>
      </ul>
      <div style="margin: 20px 0; text-align: center;">
        ${brandButton("Open your dashboard", DASHBOARD_URL)}
      </div>

      <p style="color: ${BRAND_MUTED}; font-size: 13px;">Any question before the class? Message us on WhatsApp.</p>
      <div style="margin: 20px 0; text-align: center;">
        <a href="${WA_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 WhatsApp</a>
      </div>
    `, false),
  };
}
