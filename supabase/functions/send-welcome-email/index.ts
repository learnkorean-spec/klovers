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

function buildEmail(name: string, lang: "ar" | "en", unsubToken: string | undefined) {
  const isAr = lang === "ar";
  const unsubUrl = unsubscribeUrl(unsubToken, isAr);
  const safeName = (name || "").trim();

  const arContent = `
    <h1 style="color: ${BRAND_DARK}; font-size: 22px;">أهلاً بك في عائلة KLovers${safeName ? `، ${safeName}` : ""}! 🎉</h1>
    <p>تم تسجيلك بنجاح. هذه أسرع طريقة تبدئي بها:</p>
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
    <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-top: 28px;">وانضمي لمجتمعنا على تيليجرام — تحديثات، تذكيرات، وطلاب زيك يتعلموا الكورية:</p>
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
    <p>You're officially registered. Here's the fastest way to get started:</p>
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
    <p style="color: ${BRAND_TEXT}; font-size: 15px; margin-top: 28px;">And join our Telegram community — updates, reminders, and other students learning Korean with you:</p>
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

    // Newly-registered profiles that have never been sent this email.
    // welcome_email_sent_at is the idempotency marker, checked here AND
    // written right after a verified send, same discipline as
    // send-name-collection-email's cap — an unrecorded send is one this
    // function would send again next hour.
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, email, name, language, unsubscribe_token, email_unsubscribed")
      .is("welcome_email_sent_at", null)
      .not("email", "is", null);

    if (error) throw error;

    let sent = 0;
    let skipped = 0;
    let unsubscribed = 0;

    for (const profile of profiles ?? []) {
      if (!profile.email) { skipped++; continue; }

      if (profile.email_unsubscribed) {
        // Still mark it, or this profile is re-selected every single run.
        await supabase.from("profiles")
          .update({ welcome_email_sent_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);
        unsubscribed++;
        continue;
      }

      const lang: "ar" | "en" = profile.language === "en" ? "en" : "ar";
      const { subject, html, unsubUrl } = buildEmail(profile.name ?? "", lang, profile.unsubscribe_token ?? undefined);

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

    return new Response(
      JSON.stringify({ success: true, sent, skipped, unsubscribed }),
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
