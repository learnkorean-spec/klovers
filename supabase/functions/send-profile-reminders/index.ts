import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

/**
 * ⚠ This was "https://statuesque-dusk-8db757.netlify.app" — the Lovable
 * preview deploy, dead since the move to kloversegy.com.
 *
 * That is the whole email. Its single call to action is a link to
 * /complete-profile, and it pointed at a host that no longer resolves, so
 * nobody who received this could ever do the thing it asked for. The email
 * then arrived AGAIN the next morning, because the only way to stop it is to
 * complete the profile it made impossible to complete.
 *
 * /complete-profile is a real route on the live site and is deliberately
 * unguarded (src/App.tsx), so the ?email= link works without a login — which
 * is what this letter needs, since the reader may never have signed in.
 */
const SITE_URL = "https://kloversegy.com";
const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";

/**
 * Sending limits.
 *
 * There were none. This function ran daily from cron job `auto-profile-reminders`
 * (09:00 UTC, via public.auto_send_profile_reminders), sent to everyone still
 * missing a field, kept no record of having sent, and had no cap and no
 * spacing. Identical in shape to the payment-reminder fault fixed in #267:
 * a condition that becomes true and then stays true forever.
 *
 * How many went out cannot be recovered. This function calls Resend directly
 * rather than going through send-confirmation-email, so it never wrote a row
 * to email_logs — there is no record to count. Measured today: one paid
 * enrollment matches, and its enrollment dates from 26 February.
 *
 * Three reminders, a day apart, then silence. If someone has ignored three,
 * the fourth is not persuasion, it is a complaint waiting to be filed against
 * a domain that also carries the receipts and the class links.
 */
const MAX_REMINDERS = 3;
const MIN_HOURS_BETWEEN = 24;

/** The template name this function records under in email_logs. */
const TEMPLATE = "profile_reminder";

/**
 * RFC 8058 one-click unsubscribe, plus the visible footer link.
 *
 * Gmail and Yahoo require the headers of any bulk sender. Without them the
 * only way out of a recurring email is the spam button — and this domain also
 * sends the payment confirmations, the receipts and the class links, so a
 * complaint here is charged against the mail the business runs on.
 *
 * Two URLs on purpose, the same split send-trial-broadcast uses: the header
 * is an unattended POST from Google's servers and must reach the function
 * directly, while the visible link goes to the site route.
 */
function unsubscribeUrl(token: string | undefined, isAr: boolean) {
  return token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;
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

interface MissingField {
  label_en: string;
  label_ar: string;
  param: string; // query param key
}

function buildReminderEmail(
  name: string, missing: MissingField[], lang: string, profile_email: string,
  unsubUrl: string,
) {
  const isAr = lang === "ar";

  const missingItems = missing
    .map((f) => `<li style="margin: 4px 0;">${isAr ? f.label_ar : f.label_en}</li>`)
    .join("");

  const missingBox = `
    <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="color: #92400e; font-weight: bold; margin: 0 0 8px 0;">⚠️ ${isAr ? "بيانات ناقصة:" : "Missing information:"}</p>
      <ul style="color: #78350f; margin: 0; padding-${isAr ? "right" : "left"}: 20px;">${missingItems}</ul>
    </div>`;

  const ctaBtnStyle = `display: inline-block; background: #FFFF00; color: #000000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;`;

  const profileUrl = `${SITE_URL}/complete-profile?email=${encodeURIComponent(profile_email)}`;
  const ctaBtn = `<a href="${profileUrl}" style="${ctaBtnStyle}">${isAr ? "أكمل بياناتك الآن" : "Complete My Profile Now"}</a>`;

  // Matches the lockup in templates/common.ts brandWrapper: mark and wordmark
  // on one line, tagline beneath. This function cannot import that file — it
  // is a separate edge function with its own bundle — so the markup is
  // repeated. If the shared header changes, change it here too.
  //
  // It also said "K-LOVERS", with a hyphen, which is not the name. Fixed.
  const emailHeader = `
    <div style="height: 5px; background: #FFFF00; font-size: 0; line-height: 0;">&nbsp;</div>
    <div style="background: #000000; padding: 20px 24px; text-align: center;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin: 0 auto;">
        <tr>
          <td width="42" height="42" align="center" valign="middle" style="width: 42px; height: 42px; background: #FFFF00; border-radius: 50%; font-family: Arial, Helvetica, sans-serif; font-size: 25px; font-weight: bold; line-height: 42px; color: #000000; text-align: center;">K</td>
          <td width="12" style="width: 12px; font-size: 0; line-height: 0;">&nbsp;</td>
          <td align="left" valign="middle" style="text-align: left;">
            <div translate="no" class="notranslate" style="color: #FFFF00; font-size: 23px; font-weight: 700; letter-spacing: 2.5px; line-height: 1.1;">KLOVERS</div>
            <div style="color: #9a9a9a; font-size: 9px; letter-spacing: 2.4px; text-transform: uppercase; padding-top: 4px;">Korean Language Academy</div>
          </td>
        </tr>
      </table>
    </div>`;

  const unsubLine = isAr
    ? `<p style="text-align:center;margin-top:20px;font-size:11px;color:#999">لا تريد استلام هذه الرسائل؟ <a href="${unsubUrl}" style="color:#999">إلغاء الاشتراك</a></p>`
    : `<p style="text-align:center;margin-top:20px;font-size:11px;color:#999">Don't want these emails? <a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p>`;

  if (isAr) {
    return {
      subject: "KLovers — أكمل بياناتك لبدء الدروس 📝",
      html: `
        <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
          ${emailHeader}
          <div style="padding: 32px 28px; direction: rtl; text-align: right;">
            <h2 style="color: #111; font-size: 22px; margin: 0 0 8px 0;">مرحباً ${name || ""}! 👋</h2>
            <p style="color: #444; font-size: 15px; line-height: 1.7; margin: 12px 0;">ملفك الشخصي ببعض البيانات الناقصة. أكملها حتى نتمكن من مطابقتك مع فصل اللغة الكورية المناسب لمستواك وجدولك.</p>
            ${missingBox}
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin: 16px 0;">يستغرق الأمر دقيقتين فقط — وبمجرد الاكتمال، ستكون خطوة واحدة أقرب لبدء رحلتك الكورية! 🇰🇷</p>
            <div style="text-align: center; margin: 28px 0;">
              ${ctaBtn}
            </div>
            <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;">— فريق KLovers</p>
            ${unsubLine}
          </div>
        </div>`,
    };
  }

  return {
    subject: "KLovers — Complete your profile to start classes 📝",
    html: `
      <div translate="no" class="notranslate" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        ${emailHeader}
        <div style="padding: 32px 28px;">
          <h2 style="color: #111; font-size: 22px; margin: 0 0 8px 0;">Hi ${name || "there"}! 👋</h2>
          <p style="color: #444; font-size: 15px; line-height: 1.7; margin: 12px 0;">Your KLovers profile is missing a few details. Fill them in so we can match you with the right Korean class for your level and schedule.</p>
          ${missingBox}
          <p style="color: #444; font-size: 14px; line-height: 1.6; margin: 16px 0;">It only takes 2 minutes — and once complete, you're one step closer to starting your Korean journey! 🇰🇷</p>
          <div style="text-align: center; margin: 28px 0;">
            ${ctaBtn}
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 16px;"><span translate="no" class="notranslate">— The KLovers Team</span></p>
          ${unsubLine}
        </div>
      </div>`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: enrollments, error: eErr } = await supabase
      .from("enrollments")
      .select("id, user_id, preferred_days, timezone")
      .eq("approval_status", "APPROVED")
      .eq("payment_status", "PAID");

    if (eErr) throw eErr;

    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("user_id, name, email, level, country, unsubscribe_token, email_unsubscribed");

    if (pErr) throw pErr;

    const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

    // Every profile_reminder this function has ever recorded, in one read
    // rather than a query per person. Two enrollments match today; this stays
    // one round trip if that becomes two hundred.
    const { data: priorSends, error: lErr } = await supabase
      .from("email_logs")
      .select("to_email, created_at")
      .eq("template", TEMPLATE)
      .eq("status", "sent");

    if (lErr) throw lErr;

    const history = new Map<string, { count: number; last: number }>();
    for (const row of (priorSends || []) as any[]) {
      const key = String(row.to_email || "").toLowerCase();
      if (!key) continue;
      const at = new Date(row.created_at).getTime();
      const cur = history.get(key);
      if (cur) {
        cur.count += 1;
        if (at > cur.last) cur.last = at;
      } else {
        history.set(key, { count: 1, last: at });
      }
    }

    let sent = 0;
    let skipped = 0;
    const stopped = { unsubscribed: 0, cap_reached: 0, too_soon: 0 };

    for (const enrollment of enrollments || []) {
      const profile = profileMap.get(enrollment.user_id) as any;
      if (!profile?.email) { skipped++; continue; }

      // Checked here, not only wherever the list was built: this runs daily,
      // and someone can opt out between one run and the next.
      if (profile.email_unsubscribed) { stopped.unsubscribed++; continue; }

      const missing: MissingField[] = [];

      if (!profile.name || profile.name.trim() === "") {
        missing.push({ label_en: "Full Name", label_ar: "الاسم الكامل", param: "name" });
      }
      if (!profile.level || profile.level.trim() === "") {
        missing.push({ label_en: "Korean Level", label_ar: "مستوى اللغة الكورية", param: "level" });
      }
      if (!profile.country || profile.country.trim() === "") {
        missing.push({ label_en: "Country", label_ar: "البلد", param: "country" });
      }
      if (!enrollment.timezone || enrollment.timezone.trim() === "") {
        missing.push({ label_en: "Timezone", label_ar: "المنطقة الزمنية", param: "timezone" });
      }
      if (!enrollment.preferred_days || enrollment.preferred_days.length === 0) {
        missing.push({ label_en: "Preferred Class Days", label_ar: "أيام الحصص المفضلة", param: "days" });
      }

      if (missing.length === 0) { skipped++; continue; }

      // The two gates that were missing. Read from what was actually recorded
      // as sent, so a run that crashed halfway cannot double up, and a person
      // who has had three is finished with permanently rather than until the
      // next deploy.
      const seen = history.get(String(profile.email).toLowerCase());
      if (seen) {
        if (seen.count >= MAX_REMINDERS) { stopped.cap_reached++; continue; }
        const hoursSince = (Date.now() - seen.last) / 3_600_000;
        if (hoursSince < MIN_HOURS_BETWEEN) { stopped.too_soon++; continue; }
      }

      const lang = ["egypt", "مصر", "saudi", "السعودية", "uae", "الإمارات", "iraq", "العراق", "jordan", "الأردن", "morocco", "المغرب", "algeria", "الجزائر", "tunisia", "تونس", "libya", "ليبيا", "sudan", "السودان", "yemen", "اليمن", "syria", "سوريا", "lebanon", "لبنان", "palestine", "فلسطين", "bahrain", "البحرين", "qatar", "قطر", "oman", "عمان", "kuwait", "الكويت"]
        .some(c => (profile.country || "").toLowerCase().includes(c)) ? "ar" : "en";

      const unsubUrl = unsubscribeUrl(profile.unsubscribe_token, lang === "ar");
      const { subject, html } = buildReminderEmail(profile.name, missing, lang, profile.email, unsubUrl);

      try {
        await sendEmail(profile.email, subject, html, unsubUrl);
        sent++;

        // Recorded only after Resend returned 2xx. The row IS the cap — an
        // unrecorded send is one this function will make again tomorrow, so
        // recording an optimistic send would be the same bug in a new place.
        const { error: logErr } = await supabase.from("email_logs").insert({
          template: TEMPLATE,
          to_email: profile.email,
          to_name: profile.name || null,
          enrollment_id: enrollment.id,
          status: "sent",
        });
        // A send that happened but was not written down is the dangerous
        // case, so it is said out loud - without the address, which does not
        // belong in a log.
        if (logErr) {
          console.error(
            `profile_reminder sent for enrollment ${enrollment.id} but NOT recorded:`,
            logErr.message,
          );
        }

        await new Promise((r) => setTimeout(r, 1000));
      } catch (emailErr) {
        // Was `Failed to send to ${profile.email}` — a student's address in
        // the log stream. The enrollment id identifies the row without it.
        console.error(
          `profile_reminder failed for enrollment ${enrollment.id}:`,
          emailErr instanceof Error ? emailErr.message : String(emailErr),
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, stopped }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Profile reminder error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
