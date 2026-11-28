// Automated "Welcome to Klovers" email, sent once per newly-registered
// profile. Invoked hourly by pg_cron (trigger_send_welcome_email ->
// app_private.invoke_edge, same pattern as send-trial-followups).
//
// This is a *separate* function from the "welcome" template in
// send-confirmation-email/templates/lifecycle.ts on purpose: that template
// is only ever sent manually, one admin click at a time, via
// BulkEmailManager.tsx. Changing its copy would also change what an admin
// sees when she deliberately re-sends it. This function has its own copy,
// own idempotency marker (profiles.welcome_email_sent_at) and its own
// email_logs record (template "welcome_auto"), so the two can never
// collide or double-send.
//
// 28 Nov 2026: this function also sends the two free-trial reminders to
// people who signed up and never booked one (see trialNudges.ts for the
// numbers behind it). They live here, on the same hourly run, because they
// are the continuation of this email for the same person: welcome on day 0,
// "your free class is waiting" on day 2, one last reminder on day 6. Their
// idempotency record is email_logs (templates signup_trial_nudge_1 / _2), so
// no new column was needed.
//
// Body { "dry_run": true } sends nothing and reports who WOULD be written to.
//
// Auth: _shared/cronAuth.ts (Vault-backed cron secret, or an admin JWT) —
// never a bare CRON_SECRET env-var comparison. See cronAuth.ts for why that
// used to silently drop every scheduled call.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";
import {
  BRAND_DARK, BRAND_GRAY, BRAND_TEXT, BRAND_MUTED, WHATSAPP_URL, SITE_URL,
  FUNCTION_BASE, brandWrapper, brandButton, unsubscribeFooter,
} from "../send-confirmation-email/templates/common.ts";
import { buildNudge, NUDGE_TEMPLATES, trialBlock, type NextTrial, type NudgeStep } from "./trialNudges.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

/** The template name this function records under in email_logs. */
const TEMPLATE = "welcome_auto";

// Canonical links, reused as-is from the live site rather than re-typed:
// Footer.tsx / CommunityBand.tsx both use this exact Telegram community
// invite; a second, different link here would just confuse students about
// which group is the real one.
const TELEGRAM_COMMUNITY_URL = "https://t.me/+Fu5T7d4wLMsxNDY9";
const COURSES_URL = (isAr: boolean) => `${SITE_URL}${isAr ? "/ar" : ""}/courses`;
const PLACEMENT_TEST_URL = (isAr: boolean) => `${SITE_URL}${isAr ? "/ar" : ""}/placement-test`;

function whatsappButton(isAr: boolean): string {
  return `<a href="${WHATSAPP_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>`;
}

function telegramButton(isAr: boolean): string {
  return `<a href="${TELEGRAM_COMMUNITY_URL}" style="display: inline-block; background-color: #26A5E4 !important; color: #ffffff !important; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; margin: 4px;">📣 ${isAr ? "تيليجرام" : "Telegram"}</a>`;
}

function unsubscribeUrl(token: string | undefined, isAr: boolean) {
  return token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
}

function buildEmail(name: string, lang: "ar" | "en", unsubToken: string | undefined, next: NextTrial) {
  const isAr = lang === "ar";
  const unsubUrl = unsubscribeUrl(unsubToken, isAr);
  const safeName = (name || "").trim();

  const arContent = `
    <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلاً بك في عائلة KLovers${safeName ? `، ${safeName}` : ""}! 🎉</h1>
    <p>تم تسجيلك بنجاح.</p>
    ${trialBlock(true, next)}
    <p>وهذه خطوتان تانيين مفيدين:</p>
    <div style="background-color: ${BRAND_GRAY}; border-right: 4px solid #FFD700; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: ${BRAND_TEXT}; font-size: 14px;">1️⃣ اعرفي مستواك الحقيقي قبل أي شيء.</p>
      <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">2️⃣ تصفحي الدورات واختاري ما يناسبك.</p>
    </div>
    <div style="margin: 20px 0; text-align: center;">
      ${brandButton("ابدئي اختبار تحديد المستوى", PLACEMENT_TEST_URL(true))}
    </div>
    <div style="margin: 16px 0; text-align: center;">
      ${brandButton("تصفحي الدورات", COURSES_URL(true))}
    </div>
    <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-top: 28px;">وانضمي لمجتمعنا على تيليجرام. فيه تحديثات وتذكيرات وطلاب زيك بيتعلموا الكورية:</p>
    <div style="margin: 12px 0; text-align: center;">
      ${telegramButton(true)}
    </div>
    <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 24px;">وإذا احتجتي أي مساعدة في أي وقت، إحنا على واتساب:</p>
    <div style="margin: 12px 0; text-align: center;">
      ${whatsappButton(true)}
    </div>
  ` + unsubscribeFooter(unsubToken, true);

  const enContent = `
    <h1 style="color: ${BRAND_DARK}; font-size: 22px;">Welcome to the KLovers family${safeName ? `, ${safeName}` : ""}! 🎉</h1>
    <p>You're officially registered.</p>
    ${trialBlock(false, next)}
    <p>Two more things worth doing:</p>
    <div style="background-color: ${BRAND_GRAY}; border-left: 4px solid #FFD700; border-radius: 4px; padding: 14px 18px; margin: 16px 0;">
      <p style="margin: 0 0 8px; color: ${BRAND_TEXT}; font-size: 14px;">1️⃣ Find your real Korean level first.</p>
      <p style="margin: 0; color: ${BRAND_TEXT}; font-size: 14px;">2️⃣ Browse our courses and pick what fits you.</p>
    </div>
    <div style="margin: 20px 0; text-align: center;">
      ${brandButton("Take the placement test", PLACEMENT_TEST_URL(false))}
    </div>
    <div style="margin: 16px 0; text-align: center;">
      ${brandButton("Browse courses", COURSES_URL(false))}
    </div>
    <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-top: 28px;">And join our Telegram community for updates, reminders, and other students learning Korean with you:</p>
    <div style="margin: 12px 0; text-align: center;">
      ${telegramButton(false)}
    </div>
    <p style="color: ${BRAND_MUTED}; font-size: 13px; margin-top: 24px;">Need a hand at any point? We're on WhatsApp:</p>
    <div style="margin: 12px 0; text-align: center;">
      ${whatsappButton(false)}
    </div>
  ` + unsubscribeFooter(unsubToken, false);

  return {
    subject: isAr ? "أهلاً بك في KLovers! 🎉" : "Welcome to KLovers! 🎉",
    html: brandWrapper(isAr ? arContent : enContent, isAr),
    unsubUrl,
  };
}

async function sendEmail(to: string, subject: string, html: string, unsubUrl: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: FROM_EMAIL, reply_to: REPLY_TO_EMAIL, to: [to], subject, html,
      headers: {
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!(await isCronOrAdmin(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let dryRun = false;
    try {
      const body = await req.json();
      dryRun = body?.dry_run === true;
    } catch {
      // No body, or not JSON: a normal cron run.
    }

    // The next free trial in each class language, for the date line in every
    // email below. A failure here only drops that one line.
    const nextTrialFor = async (classLanguage: "arabic" | "english"): Promise<NextTrial> => {
      const { data, error: availError } = await supabase.rpc("get_trial_availability", { p_language: classLanguage });
      if (availError) {
        console.error("get_trial_availability failed:", availError.message);
        return null;
      }
      const rows = ((data ?? []) as { next_trial_date: string | null; start_time: string | null; booked_count: number; capacity: number }[])
        .filter((r) => r.next_trial_date && r.start_time && Number(r.booked_count) < Number(r.capacity))
        .sort((a, b) => `${a.next_trial_date} ${a.start_time}`.localeCompare(`${b.next_trial_date} ${b.start_time}`));
      return rows[0] ? { date: rows[0].next_trial_date!, startTime: rows[0].start_time! } : null;
    };
    const nextTrial = { ar: await nextTrialFor("arabic"), en: await nextTrialFor("english") };

    // Profiles that have never been sent this email — new registrations
    // going forward, AND (per Re, 2026-11-17) the pre-existing backlog that
    // was deliberately backfilled out of this when the feature first shipped.
    // welcome_email_sent_at is the idempotency marker, checked here AND
    // written right after a verified send, same discipline as
    // send-name-collection-email's cap — an unrecorded send is one this
    // function would send again next hour.
    //
    // BATCH_LIMIT caps each run: the 1s-per-send pause below (Resend rate
    // limiting) means an unbounded batch could run long enough to risk the
    // edge function's own execution limit on a big backlog. At 40/run and an
    // hourly schedule, a one-time backlog the size of the whole student base
    // clears within a few hours instead of one oversized, riskier call.
    const BATCH_LIMIT = 40;
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, email, name, language, unsubscribe_token, email_unsubscribed, created_at")
      .is("welcome_email_sent_at", null)
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .limit(BATCH_LIMIT);

    if (error) throw error;

    let sent = 0;
    let skipped = 0;
    let unsubscribed = 0;

    for (const profile of profiles ?? []) {
      if (!profile.email) { skipped++; continue; }

      if (profile.email_unsubscribed) {
        // Still mark it, or this profile is re-selected every single run.
        if (!dryRun) {
          await supabase.from("profiles")
            .update({ welcome_email_sent_at: new Date().toISOString() })
            .eq("user_id", profile.user_id);
        }
        unsubscribed++;
        continue;
      }

      const lang: "ar" | "en" = profile.language === "en" ? "en" : "ar";
      const { subject, html, unsubUrl } = buildEmail(
        profile.name ?? "", lang, profile.unsubscribe_token ?? undefined, nextTrial[lang],
      );

      if (dryRun) { sent++; continue; }

      try {
        const result = await sendEmail(profile.email, subject, html, unsubUrl);

        await supabase.from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);

        const { error: logErr } = await supabase.from("email_logs").insert({
          template: TEMPLATE,
          to_email: profile.email,
          to_name: profile.name ?? null,
          status: "sent",
          resend_id: result.id ?? null,
        });
        if (logErr) {
          console.error(`welcome email sent for user ${profile.user_id} but NOT logged:`, logErr.message);
        }

        sent++;
        console.log(`Sent welcome email to user ${profile.user_id} (${lang})`);

        // Stay within Resend rate limits, same as send-name-collection-email.
        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        console.error(
          `welcome email failed for user ${profile.user_id}:`,
          emailErr instanceof Error ? emailErr.message : String(emailErr),
        );
        skipped++;
      }
    }

    console.log(`Welcome emails complete: sent=${sent}, skipped=${skipped}, unsubscribed=${unsubscribed}`);

    // ── Free-trial reminders ───────────────────────────────────────────────
    // Signed up between 2 and 60 days ago, and still: no trial booking under
    // this email, no enrolment, not a private student, not an admin, not
    // unsubscribed. Step 1 once; step 2 once, four days after step 1.
    //
    // Small batches on purpose. Each send is followed by the same 1s pause as
    // above, the whole call has 60s, and a burst is what tripped Resend's
    // rate limit on the 24 Nov re-invite. The first backlog (about 44 people)
    // therefore goes out over several hourly runs, not in one.
    const nudges = { step1: 0, step2: 0, failed: 0, would_send: [] as string[] };
    const NUDGE_BUDGET = Math.max(0, Math.min(10, 45 - sent));
    const DAY = 86_400_000;
    const now = Date.now();

    const { data: candidates, error: candError } = await supabase
      .from("profiles")
      .select("user_id, email, name, language, unsubscribe_token, created_at")
      .not("email", "is", null)
      .eq("email_unsubscribed", false)
      .gte("created_at", new Date(now - 60 * DAY).toISOString())
      .lte("created_at", new Date(now - 2 * DAY).toISOString())
      .order("created_at", { ascending: true });
    if (candError) throw candError;

    const pool = (candidates ?? []).filter((c) => !!c.email);
    if (pool.length > 0 && NUDGE_BUDGET > 0) {
      const emails = pool.map((c) => String(c.email));
      const lower = (v: unknown) => String(v ?? "").toLowerCase();
      const ids = pool.map((c) => c.user_id);

      const [booked, enrolled, privateStudents, admins, logs] = await Promise.all([
        supabase.from("trial_bookings").select("email").in("email", Array.from(new Set([...emails, ...emails.map(lower)]))),
        supabase.from("enrollments").select("user_id").in("user_id", ids).is("deleted_at", null),
        supabase.from("teacher_students").select("email, user_id"),
        supabase.from("user_roles").select("user_id").in("user_id", ids),
        supabase.from("email_logs").select("template, to_email, created_at")
          .in("template", [...NUDGE_TEMPLATES]).in("to_email", emails),
      ]);
      for (const r of [booked, enrolled, privateStudents, admins, logs]) {
        if (r.error) throw r.error;
      }

      const hasTrial = new Set((booked.data ?? []).map((r) => lower(r.email)));
      const hasEnrolment = new Set((enrolled.data ?? []).map((r) => r.user_id));
      const privateEmails = new Set((privateStudents.data ?? []).map((r) => lower(r.email)).filter(Boolean));
      const privateIds = new Set((privateStudents.data ?? []).map((r) => r.user_id).filter(Boolean));
      const adminIds = new Set((admins.data ?? []).map((r) => r.user_id));
      const sentAt = new Map<string, number>();
      for (const l of logs.data ?? []) {
        sentAt.set(`${l.template}|${lower(l.to_email)}`, new Date(l.created_at).getTime());
      }

      let budget = NUDGE_BUDGET;
      for (const c of pool) {
        if (budget <= 0) break;
        const email = lower(c.email);
        if (hasTrial.has(email) || hasEnrolment.has(c.user_id)) continue;
        if (privateEmails.has(email) || privateIds.has(c.user_id) || adminIds.has(c.user_id)) continue;

        const first = sentAt.get(`${NUDGE_TEMPLATES[0]}|${email}`);
        const second = sentAt.get(`${NUDGE_TEMPLATES[1]}|${email}`);
        let step: NudgeStep | null = null;
        if (first === undefined) step = 1;
        else if (second === undefined && now - first >= 4 * DAY) step = 2;
        if (!step) continue;

        const lang: "ar" | "en" = c.language === "en" ? "en" : "ar";
        const isAr = lang === "ar";
        const template = NUDGE_TEMPLATES[step - 1];
        budget--;

        if (dryRun) {
          nudges.would_send.push(`${template}:${lang}`);
          continue;
        }

        try {
          const { subject, html } = buildNudge(step, c.name ?? "", isAr, nextTrial[lang], c.unsubscribe_token ?? undefined);
          const result = await sendEmail(String(c.email), subject, html, unsubscribeUrl(c.unsubscribe_token ?? undefined, isAr));
          // The log row IS the "already sent" marker. If it cannot be written
          // the next run would send again, so stop the whole batch here.
          const { error: logErr } = await supabase.from("email_logs").insert({
            template, to_email: String(c.email), to_name: c.name ?? null,
            status: "sent", resend_id: result.id ?? null,
          });
          if (logErr) throw new Error(`sent but not logged: ${logErr.message}`);
          if (step === 1) nudges.step1++; else nudges.step2++;
          await new Promise((r) => setTimeout(r, 1000));
        } catch (nudgeErr) {
          nudges.failed++;
          console.error(`trial nudge ${template} failed for user ${c.user_id}:`,
            nudgeErr instanceof Error ? nudgeErr.message : String(nudgeErr));
          if (String(nudgeErr).includes("not logged")) break;
        }
      }
    }
    console.log(`Trial nudges: step1=${nudges.step1}, step2=${nudges.step2}, failed=${nudges.failed}, dry_run=${dryRun}`);

    return new Response(
      JSON.stringify({ success: true, dry_run: dryRun, sent, skipped, unsubscribed, nudges, next_trial: nextTrial }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("send-welcome-email error:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
