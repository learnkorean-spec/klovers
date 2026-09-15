// Sends the trial book to the students who said they are coming.
//
// Invoked hourly by pg_cron (trigger_trial_guide). Idempotent: every booking
// carries `guide_sent_at`, so a re-run in the same hour is a no-op and no
// student ever receives the book twice.
//
// Who it writes to, and why it is not the prep letter:
//   `trial_prep` goes to EVERYONE booked on tomorrow's session, silent or not.
//   This one goes only to `attendance_response = 'yes'` — the students who
//   answered the confirmation letter with "I am coming". That is Re's rule:
//   the book goes to the people who will actually sit the class.
//
// When: the day before the class, and the day of the class (Cairo). Two days
// rather than one on purpose — a student who confirms late, on the morning of
// her own class, still gets the book in time. The stamp keeps it to one
// letter either way.
//
// Safety: `dry_run` defaults to TRUE, exactly like send-attendance-confirmations.
// Nothing is sent unless the caller passes `dry_run: false`, which the cron
// does. A bare manual call lists the recipients and sends nothing.

import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { cairoDateKey, shiftDateKey } from "../_shared/cairoTime.ts";
import { isCronOrAdmin } from "../_shared/cronAuth.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// The book itself. Public objects in the `student-materials` bucket, which is
// public and PDF-only. Overridable by environment variable so the file can
// move (to kloversegy.com, say) without a redeploy of this function.
const GUIDE_URL_AR = Deno.env.get("TRIAL_GUIDE_URL_AR") ??
  "https://ewtdgpbybkceokfohhyg.supabase.co/storage/v1/object/public/student-materials/trial-guide/klovers-trial-guide-ar.pdf";
const GUIDE_URL_EN = Deno.env.get("TRIAL_GUIDE_URL_EN") ??
  "https://ewtdgpbybkceokfohhyg.supabase.co/storage/v1/object/public/student-materials/trial-guide/klovers-trial-guide-en.pdf";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  trial_date: string;
  starts_at: string | null;
  user_id: string | null;
  level: string | null;
  class_language: string | null;
  meeting_url: string | null;
  guide_sent_at: string | null;
}

const SELECT_COLUMNS =
  "id, name, email, trial_date, starts_at, user_id, level, class_language, meeting_url, guide_sent_at";

function pickLanguage(classLanguage: string | null): "ar" | "en" {
  return classLanguage === "arabic" ? "ar" : "en";
}

/** "الجمعة 18 سبتمبر · 16:30 بتوقيت القاهرة" / "Friday 18 September · 16:30 Cairo" */
function classTimeLabel(startsAt: string | null, lang: "ar" | "en"): string {
  if (!startsAt) return "";
  const d = new Date(startsAt);
  const locale = lang === "ar" ? "ar-EG" : "en-GB";
  const day = new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long", timeZone: "Africa/Cairo",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo",
  }).format(d);
  return lang === "ar"
    ? `${day} · ${time} بتوقيت القاهرة`
    : `${day} · ${time} Cairo`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    }
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    if (!(await isCronOrAdmin(req, supabase))) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let body: { dry_run?: boolean } = {};
    try { body = await req.json(); } catch { /* empty body = dry run */ }
    const dryRun = body?.dry_run !== false;

    const today = cairoDateKey();
    const tomorrow = shiftDateKey(today, 1);

    const { data, error } = await supabase
      .from("trial_bookings")
      .select(SELECT_COLUMNS)
      .in("trial_date", [today, tomorrow])
      .eq("attendance_response", "yes")
      .is("guide_sent_at", null)
      .not("is_tba", "is", true)
      .neq("status", "cancelled")
      .not("email", "is", null)
      .limit(200);

    if (error) throw new Error(`query: ${error.message}`);
    const rows = (data ?? []) as Booking[];

    const recipients: Array<{ id: string; email: string; trial_date: string; language: string }> = [];
    let sent = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const b of rows) {
      if (!b.email) { skipped++; continue; }
      const lang = pickLanguage(b.class_language);

      let unsubscribeToken: string | undefined;
      if (b.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("unsubscribe_token, email_unsubscribed")
          .eq("user_id", b.user_id)
          .maybeSingle();
        if (profile?.email_unsubscribed) {
          if (!dryRun) {
            await supabase.from("trial_bookings")
              .update({ guide_sent_at: new Date().toISOString() }).eq("id", b.id);
          }
          skipped++;
          continue;
        }
        unsubscribeToken = profile?.unsubscribe_token ?? undefined;
      }

      recipients.push({ id: b.id, email: b.email, trial_date: b.trial_date, language: lang });
      if (dryRun) continue;

      try {
        const { error: sendErr } = await supabase.functions.invoke("send-confirmation-email", {
          body: {
            email: b.email,
            name: b.name || "there",
            language: lang,
            template: "trial_guide",
            level: b.level,
            guide_url: lang === "ar" ? GUIDE_URL_AR : GUIDE_URL_EN,
            class_time_label: classTimeLabel(b.starts_at, lang),
            ...(b.meeting_url ? { meeting_url: b.meeting_url } : {}),
            ...(unsubscribeToken ? { unsubscribe_token: unsubscribeToken } : {}),
          },
        });
        if (sendErr) throw new Error(sendErr.message);
        await supabase.from("trial_bookings")
          .update({ guide_sent_at: new Date().toISOString() }).eq("id", b.id);
        sent++;
      } catch (e) {
        errors.push(`${b.id}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const result = {
      ok: true, dry_run: dryRun, dates: [today, tomorrow],
      matched: rows.length, sent, skipped, recipients, errors,
    };
    console.log("trial-guide:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("trial-guide error:", msg);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
