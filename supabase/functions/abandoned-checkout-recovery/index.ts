// Abandoned checkout recovery — sends staged recovery emails (1h / 24h / 72h)
// to leads who started checkout but haven't paid. Runs every 30 min via pg_cron.
//
// Stage windows (based on lead.created_at, current age h):
//   Stage 1: 1h  ≤ age < 23h
//   Stage 2: 24h ≤ age < 71h
//   Stage 3: 72h ≤ age < 168h (7d)
//
// Only the single currently-eligible stage is sent per run. Earlier stages are
// NOT backfilled: if a lead is first evaluated at 30h, stage 1 is skipped.
//
// 16 Sep 2026 (Re's message rules, claude/CUSTOMER_MESSAGE_TONE_RULE.md):
//   * the shared header/footer - `brandWrapper` from send-confirmation-email's
//     templates/common.ts - instead of a private copy with a remote logo;
//   * a WhatsApp block above the signature in every stage;
//   * Arabic for leads from Arabic-speaking countries (it was English only);
//   * neutral copy: no "last chance", no "many students reserve quickly".

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
import {
  BRAND_DARK, BRAND_MUTED, WHATSAPP_URL, brandWrapper, brandButton,
} from "../send-confirmation-email/templates/common.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://kloversegy.com";
const CHECKOUT_URL = `${SITE_URL}/enroll-now`;
const UNSUBSCRIBE_BASE = `${SUPABASE_URL}/functions/v1/checkout-recovery-unsubscribe`;

// ── Arabic-speaking countries (same list as send-name-collection-email) ──
const ARABIC_COUNTRIES = [
  "egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات",
  "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب",
  "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا",
  "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا",
  "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين",
  "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت",
];

function isArabicCountry(country: string | null): boolean {
  const c = (country || "").toLowerCase().trim();
  return !c || ARABIC_COUNTRIES.some((k) => c.includes(k));
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال عن المستوى أو المواعيد؟ راسلينا على واتساب." : "Questions about the level or the times? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WHATSAPP_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

function unsubFooter(token: string, isAr: boolean) {
  const url = `${UNSUBSCRIBE_BASE}?token=${encodeURIComponent(token)}`;
  return isAr
    ? `<p style="color: ${BRAND_MUTED}; font-size: 11px; margin-top: 24px; text-align: center;">لا تريد استلام هذه الرسائل؟ <a href="${url}" style="color: ${BRAND_MUTED}; text-decoration: underline;">إلغاء الاشتراك</a></p>`
    : `<p style="color: ${BRAND_MUTED}; font-size: 11px; margin-top: 24px; text-align: center;">Don't want to receive these emails? <a href="${url}" style="color: ${BRAND_MUTED}; text-decoration: underline;">Unsubscribe</a>.</p>`;
}

interface StageEmail { subject: string; html: string; }
interface StageArgs { name: string; checkout: string; token: string; isAr: boolean; }

function greeting(name: string, isAr: boolean): string {
  const first = (name || "").trim().split(" ")[0];
  if (isAr) return `مرحباً${first ? ` ${first}` : ""}،`;
  return `Hi ${first || "there"},`;
}

function letter(a: StageArgs, subject: string, lines: string[], button: string): StageEmail {
  return {
    subject,
    html: brandWrapper(`
      <h1 style="color: ${BRAND_DARK}; font-size: 22px;">${greeting(a.name, a.isAr)}</h1>
      ${lines.map((l) => `<p>${l}</p>`).join("")}
      <div style="margin: 24px 0; text-align: center;">${brandButton(button, a.checkout)}</div>
      ${whatsappBlock(a.isAr)}
      ${unsubFooter(a.token, a.isAr)}
    `, a.isAr),
  };
}

function stage1(a: StageArgs): StageEmail {
  return a.isAr
    ? letter(a, "KLovers — تسجيلك جاهز للإكمال",
        ["بدأتِ التسجيل في كورس الكوري، والتسجيل متاح لإكماله الآن.", "إكمال التسجيل يستغرق أقل من دقيقة."],
        "أكملي التسجيل")
    : letter(a, "KLovers — your enrolment is ready to complete",
        ["You started enrolling in a Korean course, and it is ready to complete now.", "Finishing takes less than a minute."],
        "Complete my enrolment");
}

function stage2(a: StageArgs): StageEmail {
  return a.isAr
    ? letter(a, "KLovers — التسجيل مفتوح لمستواكِ",
        ["التسجيل في مجموعات الكوري مفتوح الآن، ومكانك متاح.", "يمكنكِ اختيار الموعد المناسب وإكمال التسجيل من هنا."],
        "إكمال التسجيل")
    : letter(a, "KLovers — enrolment is open for your level",
        ["Enrolment in the Korean groups is open, and your place is available.", "You can pick the time that suits you and finish here."],
        "Finish enrolment");
}

function stage3(a: StageArgs): StageEmail {
  return a.isAr
    ? letter(a, "KLovers — مجموعات جديدة متاحة",
        ["مجموعات الكوري الجديدة متاحة للتسجيل.", "لو محتاجة مساعدة في اختيار المستوى المناسب، نسعد بمساعدتك."],
        "عرض المجموعات")
    : letter(a, "KLovers — new groups are available",
        ["New Korean groups are open for enrolment.", "If you would like help choosing the right level, we are happy to help."],
        "See the groups");
}

function buildStage(n: 1 | 2 | 3, args: StageArgs) {
  return n === 1 ? stage1(args) : n === 2 ? stage2(args) : stage3(args);
}

async function sendResend(to: string, subject: string, html: string): Promise<string> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: FROM_EMAIL, reply_to: REPLY_TO_EMAIL, to: [to], subject, html }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend error ${res.status}: ${body}`);
  try { return JSON.parse(body)?.id ?? ""; } catch { return ""; }
}

function currentStage(ageHours: number): 1 | 2 | 3 | null {
  if (ageHours >= 1   && ageHours < 23)  return 1;
  if (ageHours >= 24  && ageHours < 71)  return 2;
  if (ageHours >= 72  && ageHours < 168) return 3;
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Candidate leads: reached checkout (plan_type + user_id), recent (≤7d),
    //    not marked enrolled. We filter out paid & unsubscribed in code below.
    const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data: leads, error: leadsErr } = await supabase
      .from("leads")
      .select("id, name, email, plan_type, user_id, status, created_at, country")
      .not("plan_type", "is", null)
      .not("user_id",   "is", null)
      .neq("status", "enrolled")
      .gte("created_at", cutoff);

    if (leadsErr) throw new Error(`leads query: ${leadsErr.message}`);
    const candidates = leads ?? [];

    // 2. Approved (paid) enrollments — skip those user_ids.
    const userIds = [...new Set(candidates.map(l => l.user_id).filter(Boolean))];
    let paidUserIds = new Set<string>();
    if (userIds.length) {
      const { data: enrs } = await supabase
        .from("enrollments")
        .select("user_id")
        .in("user_id", userIds)
        .eq("status", "APPROVED");
      paidUserIds = new Set((enrs ?? []).map(e => e.user_id));
    }

    // 3. Existing recovery rows per lead.
    const leadIds = candidates.map(l => l.id);
    const existingByLead = new Map<string, { stage: number; unsubscribed_at: string | null; converted_at: string | null; }[]>();
    if (leadIds.length) {
      const { data: rows } = await supabase
        .from("checkout_recovery_emails")
        .select("id, lead_id, stage, unsubscribed_at, converted_at")
        .in("lead_id", leadIds);
      for (const r of rows ?? []) {
        const arr = existingByLead.get(r.lead_id) ?? [];
        arr.push(r);
        existingByLead.set(r.lead_id, arr);
      }
    }

    const result = { evaluated: candidates.length, sent: 0, skipped: 0, failed: 0, details: [] as any[] };

    for (const lead of candidates) {
      if (!lead.email || !lead.user_id) { result.skipped++; continue; }
      if (paidUserIds.has(lead.user_id)) { result.skipped++; continue; }

      const existing = existingByLead.get(lead.id) ?? [];
      if (existing.some(e => e.unsubscribed_at)) { result.skipped++; continue; }

      const ageHours = (Date.now() - new Date(lead.created_at).getTime()) / 3600000;
      const stage = currentStage(ageHours);
      if (!stage) { result.skipped++; continue; }

      // Only send current eligible stage — no backfill of earlier stages.
      if (existing.some(e => e.stage === stage)) { result.skipped++; continue; }

      // Insert a 'pending' row first (unique constraint prevents double-send race).
      const { data: inserted, error: insErr } = await supabase
        .from("checkout_recovery_emails")
        .insert({
          lead_id: lead.id,
          email: lead.email,
          stage,
          send_status: "pending",
          scheduled_for: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (insErr) {
        // Most likely a race / uniqueness collision — treat as already handled.
        result.skipped++;
        result.details.push({ lead_id: lead.id, stage, skipped: insErr.message });
        continue;
      }

      const rowId = inserted!.id;
      const token = `${lead.id}.${rowId}`;
      const { subject, html } = buildStage(stage, {
        name: lead.name ?? "",
        checkout: CHECKOUT_URL,
        token,
        isAr: isArabicCountry((lead as { country?: string | null }).country ?? null),
      });

      try {
        const providerId = await sendResend(lead.email, subject, html);
        await supabase
          .from("checkout_recovery_emails")
          .update({
            send_status: "sent",
            sent_at: new Date().toISOString(),
            provider_message_id: providerId,
          })
          .eq("id", rowId);
        result.sent++;
        result.details.push({ lead_id: lead.id, stage, sent: true });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await supabase
          .from("checkout_recovery_emails")
          .update({ send_status: "failed", error_message: msg })
          .eq("id", rowId);
        result.failed++;
        result.details.push({ lead_id: lead.id, stage, error: msg });
      }
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("abandoned-checkout-recovery error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
