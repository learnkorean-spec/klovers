import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

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

// ── Brand constants (copied from send-confirmation-email) ──
const BRAND_BLACK = "#000000";
const BRAND_YELLOW = "#FFFF00";
const BRAND_DARK = "#1a1a1a";
const BRAND_TEXT = "#333333";

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

/**
 * The header was an <img> of klovers-logo.jpg — 41,004 bytes, byte for byte
 * the size of favicon.ico, i.e. the favicon doing duty as a logo. Outlook
 * blocks remote images by default and Gmail's promotions tab often does, so
 * for those readers the brand was a broken-image icon.
 *
 * Now the drawn lockup from templates/common.ts (#275): nothing to load,
 * sharp at any density. Repeated rather than imported because this is a
 * separate edge function with its own bundle — if the shared header changes,
 * change it here too.
 */
function brandWrapper(content: string, isRtl: boolean, unsubLine: string) {
  const dir = isRtl ? "direction: rtl; text-align: right;" : "";
  return `
  <div translate="no" class="notranslate" style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden;">
    <div style="height: 5px; background: ${BRAND_YELLOW}; font-size: 0; line-height: 0;">&nbsp;</div>
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
        <tr>
          <td width="42" height="42" align="center" valign="middle" style="width: 42px; height: 42px; background: ${BRAND_YELLOW}; border-radius: 50%; font-family: Arial, Helvetica, sans-serif; font-size: 25px; font-weight: bold; line-height: 42px; color: ${BRAND_BLACK}; text-align: center;">K</td>
          <td width="12" style="width: 12px; font-size: 0; line-height: 0;">&nbsp;</td>
          <td align="left" valign="middle" style="text-align: left;">
            <div translate="no" class="notranslate" style="color: ${BRAND_YELLOW}; font-size: 23px; font-weight: 700; letter-spacing: 2.5px; line-height: 1.1;">KLOVERS</div>
            <div style="color: #9a9a9a; font-size: 9px; letter-spacing: 2.4px; text-transform: uppercase; padding-top: 4px;">Korean Language Academy</div>
          </td>
        </tr>
      </table>
    </div>
    <div style="padding: 28px 24px; ${dir} color: ${BRAND_TEXT};">
      ${content}
      ${unsubLine}
    </div>
    <div style="background: ${BRAND_BLACK}; padding: 20px 24px; text-align: center;">
      <p style="color: ${BRAND_YELLOW}; font-size: 13px; margin: 0 0 8px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
      <a href="https://kloversegy.com" style="color: #cccccc; font-size: 11px; text-decoration: none;">kloversegy.com</a>
    </div>
  </div>`;
}

function brandButton(text: string, href: string) {
  return `<a href="${href}" style="display: inline-block; background: ${BRAND_YELLOW}; color: ${BRAND_BLACK}; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid ${BRAND_BLACK};">${text}</a>`;
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
    <h2 style="color:${BRAND_DARK};font-size:20px;margin:0 0 16px;">
      مرحباً! 👋
    </h2>
    <p style="font-size:15px;line-height:1.8;margin:0 0 16px;">
      لاحظنا أن <strong>اسمك</strong> غير مكتمل في ملفك الشخصي على KLovers.
    </p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 20px;">
      نحتاج إلى اسمك لنتمكن من مخاطبتك بشكل صحيح وإعداد مكانك في الفصل الدراسي.
    </p>
    <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
      <p style="color:#92400e;font-weight:bold;margin:0;font-size:14px;">
        ⚠️ الاسم الكامل مطلوب لاستكمال تسجيلك
      </p>
    </div>
    <div style="text-align:center;margin:0 0 28px;">
      ${brandButton("أكمل ملفك الشخصي الآن ←", ctaUrl)}
    </div>
    <p style="color:#999;font-size:12px;margin:0;">
      إذا كنت قد أضفت اسمك بالفعل، يمكنك تجاهل هذا البريد الإلكتروني.
    </p>`;

  const enContent = `
    <h2 style="color:${BRAND_DARK};font-size:20px;margin:0 0 16px;">
      Hi there! 👋
    </h2>
    <p style="font-size:15px;line-height:1.8;margin:0 0 16px;">
      We noticed your <strong>name</strong> is missing from your KLovers profile.
    </p>
    <p style="font-size:15px;line-height:1.8;margin:0 0 20px;">
      We need your name to address you properly and prepare your class spot.
    </p>
    <div style="background:#fffbeb;border:1px solid #f59e0b;border-radius:8px;padding:14px 18px;margin:0 0 28px;">
      <p style="color:#92400e;font-weight:bold;margin:0;font-size:14px;">
        ⚠️ Your full name is required to complete registration
      </p>
    </div>
    <div style="text-align:center;margin:0 0 28px;">
      ${brandButton("Complete My Profile →", ctaUrl)}
    </div>
    <p style="color:#999;font-size:12px;margin:0;">
      If you've already added your name, you can ignore this email.
    </p>`;

  return {
    subject: "أكمل ملفك الشخصي / Complete Your Profile — KLovers",
    html: brandWrapper(isAr ? arContent : enContent, isAr, unsubLine),
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
        // Was `Sent name request to ${profile.email}` — a student's address in
        // the log stream. The user id identifies the row without it.
        console.log(`Sent name request to user ${profile.user_id} (${lang})`);

        // 1s delay to stay within Resend rate limits
        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        // Was `Failed to send to ${profile.email}`. Same reason.
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
