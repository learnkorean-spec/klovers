import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";
// The shared header/footer (Re's rule 4: one chrome everywhere). Imported
// rather than copied, so a design change made in common.ts reaches this
// letter too.
import {
  BRAND_DARK, BRAND_GRAY, BRAND_MUTED, BRAND_TEXT, BRAND_YELLOW, WHATSAPP_URL,
  brandWrapper, brandButton,
} from "../send-confirmation-email/templates/common.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://kloversegy.com";
const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

/**
 * Sending limits.
 *
 * `name_reminder_sent_at` gave this function SPACING — seven days — but no
 * CAP. It records only the last send, never a count, so the query
 * "name is empty AND last reminder older than 7 days" is true again every
 * seventh morning, forever, for anyone who simply does not intend to fill in
 * their name. There is one such profile today; it was last reminded on
 * 3 September and would have been reminded on the 10th, the 17th, and so on
 * with no end.
 *
 * Same family as the payment-reminder (#267) and profile-reminder (#276)
 * faults: a condition that becomes true and then stays true. It is milder
 * here — weekly, not daily — which is exactly why it survived two audits.
 *
 * Three, then stop. The count comes from email_logs, the same store #276
 * uses, so no migration is needed and the record that proves a send is the
 * record that enforces the cap.
 */
const MAX_REMINDERS = 3;

/** The template name this function records under in email_logs. */
const TEMPLATE = "name_reminder";

/**
 * RFC 8058 one-click unsubscribe, plus the visible footer link.
 *
 * This email had neither, and it is a recurring unsolicited nudge — the exact
 * shape of mail that gets marked as spam when there is no other way out. The
 * complaint lands on the domain that also carries the receipts and the class
 * links.
 *
 * Two URLs on purpose, matching send-trial-broadcast and #276: the header is
 * an unattended POST from Google's servers and must reach the function
 * directly; the visible link goes to the site route.
 */
function unsubscribeUrl(token: string | undefined, isAr: boolean) {
  return token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
}

function whatsappBlock(isAr: boolean): string {
  return `
    <p style="color: ${BRAND_MUTED}; font-size: 13px;">${isAr ? "أي سؤال؟ راسلنا على واتساب." : "Any questions? Message us on WhatsApp."}</p>
    <div style="margin: 20px 0; text-align: center;">
      <a href="${WHATSAPP_URL}" style="display: inline-block; background-color: #25D366 !important; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">💬 ${isAr ? "واتساب" : "WhatsApp"}</a>
    </div>`;
}

// ── Arabic-speaking countries ──
const ARABIC_COUNTRIES = [
  "egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات",
  "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب",
  "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا",
  "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا",
  "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين",
  "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت",
];

function detectLang(country: string): "ar" | "en" {
  const c = (country || "").toLowerCase().trim();
  if (!c || ARABIC_COUNTRIES.some((k) => c.includes(k))) return "ar";
  return "en";
}

function buildEmail(profileEmail: string, lang: "ar" | "en", unsubUrl: string) {
  const isAr = lang === "ar";
  const ctaUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(profileEmail)}`;

  const unsubLine = isAr
    ? `<p style="text-align:center;margin-top:20px;font-size:11px;color:#999">لا تريد استلام هذه الرسائل؟ <a href="${unsubUrl}" style="color:#999">إلغاء الاشتراك</a></p>`
    : `<p style="text-align:center;margin-top:20px;font-size:11px;color:#999">Don't want these emails? <a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p>`;

  const arContent = `
    <h1 style="color:${BRAND_DARK};font-size:22px;">مرحباً،</h1>
    <p>خانة <strong>الاسم</strong> في حسابك على KLovers ما زالت فارغة.</p>
    <p>نستخدم الاسم في رسائلك وفي تجهيز مكانك في المجموعة.</p>
    <div style="background-color:${BRAND_GRAY};border-right:4px solid ${BRAND_YELLOW};border-radius:4px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;color:${BRAND_TEXT};font-size:14px;">إضافة الاسم تستغرق أقل من دقيقة.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${brandButton("أضيفي اسمك", ctaUrl)}
    </div>
    <p style="color:${BRAND_MUTED};font-size:13px;">إذا كنتِ أضفتِ اسمك بالفعل، لا حاجة لأي خطوة.</p>
    ${whatsappBlock(true)}
    ${unsubLine}`;

  const enContent = `
    <h1 style="color:${BRAND_DARK};font-size:22px;">Hi,</h1>
    <p>The <strong>name</strong> field on your KLovers account is still empty.</p>
    <p>We use it in your emails and to prepare your place in a group.</p>
    <div style="background-color:${BRAND_GRAY};border-left:4px solid ${BRAND_YELLOW};border-radius:4px;padding:14px 18px;margin:16px 0;">
      <p style="margin:0;color:${BRAND_TEXT};font-size:14px;">Adding it takes less than a minute.</p>
    </div>
    <div style="text-align:center;margin:24px 0;">
      ${brandButton("Add your name", ctaUrl)}
    </div>
    <p style="color:${BRAND_MUTED};font-size:13px;">If you have already added it, there is nothing else to do.</p>
    ${whatsappBlock(false)}
    ${unsubLine}`;

  return {
    subject: isAr ? "KLovers — أضيفي اسمك إلى حسابك" : "KLovers — add your name to your account",
    html: brandWrapper(isAr ? arContent : enContent, isAr),
  };
}

async function sendEmail(
  to: string, subject: string, html: string, unsubUrl: string,
) {
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Query profiles with empty/null name that haven't been reminded in 7 days
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("user_id, email, country, name_reminder_sent_at, unsubscribe_token, email_unsubscribed")
      .or("name.is.null,name.eq.")
      .or(`name_reminder_sent_at.is.null,name_reminder_sent_at.lt.${sevenDaysAgo}`);

    if (error) throw error;

    // How many name_reminders each address has already had. One read, not one
    // per person. This is the cap: name_reminder_sent_at holds only the most
    // recent send and can never answer "how many".
    const { data: priorSends, error: lErr } = await supabase
      .from("email_logs")
      .select("to_email")
      .eq("template", TEMPLATE)
      .eq("status", "sent");

    if (lErr) throw lErr;

    const counts = new Map<string, number>();
    for (const row of (priorSends || []) as any[]) {
      const key = String(row.to_email || "").toLowerCase();
      if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    let sent = 0;
    let skipped = 0;
    const stopped = { unsubscribed: 0, cap_reached: 0 };

    for (const profile of profiles ?? []) {
      if (!profile.email) {
        skipped++;
        continue;
      }

      // Checked in the loop, not only where the list was built: this runs
      // daily and someone can opt out between two runs.
      if (profile.email_unsubscribed) { stopped.unsubscribed++; continue; }

      if ((counts.get(String(profile.email).toLowerCase()) ?? 0) >= MAX_REMINDERS) {
        stopped.cap_reached++;
        continue;
      }

      const lang = detectLang(profile.country ?? "");
      const unsubUrl = unsubscribeUrl(profile.unsubscribe_token, lang === "ar");
      const { subject, html } = buildEmail(profile.email, lang, unsubUrl);

      try {
        await sendEmail(profile.email, subject, html, unsubUrl);

        await supabase
          .from("profiles")
          .update({ name_reminder_sent_at: new Date().toISOString() })
          .eq("user_id", profile.user_id);

        // Written only after a verified 2xx. This row is what the cap counts,
        // so writing it optimistically would be the same bug in a new place:
        // an unrecorded send is one this function makes again next week.
        const { error: logErr } = await supabase.from("email_logs").insert({
          template: TEMPLATE,
          to_email: profile.email,
          status: "sent",
        });
        if (logErr) {
          console.error(
            `name_reminder sent for user ${profile.user_id} but NOT recorded:`,
            logErr.message,
          );
        }

        sent++;
        console.log(`Sent name request to user ${profile.user_id} (${lang})`);

        // 1s delay to stay within Resend rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        console.error(
          `name_reminder failed for user ${profile.user_id}:`,
          emailErr instanceof Error ? emailErr.message : String(emailErr),
        );
        skipped++;
      }
    }

    console.log(
      `Name collection emails complete: sent=${sent}, skipped=${skipped}, ` +
      `stopped=${JSON.stringify(stopped)}`,
    );

    return new Response(
      JSON.stringify({ success: true, sent, skipped, stopped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("send-name-collection-email error:", msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
