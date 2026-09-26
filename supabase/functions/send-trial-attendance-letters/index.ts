/**
 * The two letters that a recorded attendance makes possible.
 *
 * Until `attended` existed (migration 20260918190000) nothing in the database
 * said who had been in the room, so the letter after a trial was aimed by the
 * clock and written in deliberately neutral words — it could not know whether
 * the reader had come. It still is, and it still should be: that letter goes to
 * everyone two hours after the class, before anybody has marked anything.
 *
 * This is the one that runs afterwards, once Re has answered:
 *
 *   attended = true    enrolment is open, here is your seat
 *   attended = false   the time may not have suited you — here is another trial
 *
 * Never both, and never to the undecided. A booking still marked "not decided
 * yet" is not in the working set at all: the third state exists precisely so
 * that silence is not read as absence, and a sender that guessed would throw
 * that away. `attended_letter_sent_at` closes a booking once its letter has
 * gone — so pressing Confirm twice reaches nobody twice, and correcting a mark
 * afterwards corrects the RECORD without sending the contradicting letter.
 *
 * WHICH LETTERS. `letters` selects: "came" (the default), "missed", or "both".
 * Re's call on 19 September was to write only to the students who came, for
 * now. The default is the narrow one deliberately: a caller that forgets the
 * parameter writes to FEWER people, not more, and the ones it does write to are
 * the ones who were in the room. Nobody is dropped by this — an unsent no-show
 * keeps a null stamp and stays in the working set, so her letter can go later
 * with one press. `missed_waiting` in the response is how many are waiting, so
 * the number never goes quiet.
 *
 * Unsubscribes are resolved from profiles OR leads, the pattern established in
 * #502/#505/#506/#510. 27 of the 39 live bookings have no account, so a
 * profiles-only lookup would mean no unsubscribe link for most of the people
 * this writes to — the exact gap Souâd Rahmouni ran into.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { FROM_EMAIL, REPLY_TO_EMAIL } from "../_shared/sender.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = "https://kloversegy.com";
const FUNCTION_BASE = "https://ewtdgpbybkceokfohhyg.supabase.co/functions/v1";
const ENROL_URL = `${SITE_URL}/enroll-now`;
const TRIAL_URL = `${SITE_URL}/trial-booking`;
const WA_URL = "https://wa.me/201010003084";

type LetterKind = "came" | "missed";
type Selection = LetterKind | "both";

/** Gmail POSTs this machine-to-machine (RFC 8058) — it must be a server route. */
const headerUnsubscribeUrl = (token: string | null, isAr: boolean) =>
  token
    ? `${FUNCTION_BASE}/unsubscribe-email?token=${token}&lang=${isAr ? "ar" : "en"}`
    : `${SITE_URL}/unsubscribe`;

/** What a human clicks in the footer — the page, not the endpoint. */
const footerUnsubscribeUrl = (token: string | null) =>
  token ? `${SITE_URL}/unsubscribe?token=${token}` : `${SITE_URL}/unsubscribe`;

type Booking = {
  id: string;
  name: string | null;
  email: string | null;
  user_id: string | null;
  class_language: string | null;
  attended: boolean | null;
};

async function sendBatch(
  emails: { to: string; subject: string; html: string; text: string; unsubscribeUrl: string }[],
) {
  const payload = emails.map(e => ({
    from: FROM_EMAIL,
    reply_to: REPLY_TO_EMAIL,
    to: [e.to],
    subject: e.subject,
    html: e.html,
    text: e.text,
    headers: {
      "List-Unsubscribe": `<${e.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  }));
  const res = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Resend batch error: ${await res.text()}`);
  return await res.json();
}

/**
 * The house wrapper, kept deliberately plain: one message, one button.
 *
 * Standing rule 3 (Re, 16 September) — "emails as much as possible must be
 * neutral not too much data". So neither letter names her level, quotes a
 * price, or recaps the class. The one thing each says is the next step.
 */
function wrap(bodyHtml: string, isAr: boolean, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" ${isAr ? 'dir="rtl"' : ""}>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:#FFF9EC;font-family:${isAr ? "'Cairo',Tahoma,Arial,sans-serif" : "'Inter',-apple-system,'Segoe UI',Arial,sans-serif"};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF9EC;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#FFF9EC;border:1px solid #2E2E2E;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
  <tr><td style="background:#2E2E2E;padding:24px 40px;text-align:center;">
    <p style="margin:0;color:#FFFF00;font-size:12px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${isAr ? "كلوفرز" : "KLovers Academy"}</p>
  </td></tr>
  <tr><td style="padding:32px 40px;color:#2E2E2E;font-size:15px;line-height:1.8;text-align:${isAr ? "right" : "left"};">
    ${bodyHtml}
    <p style="color:#2E2E2E;font-size:14px;margin:24px 0 0;">
      ${isAr
        ? `أي سؤال؟ <a href="${WA_URL}" style="color:#2E2E2E;text-decoration:underline;font-weight:700;">المراسلة على واتساب</a>.`
        : `Any questions? <a href="${WA_URL}" style="color:#2E2E2E;text-decoration:underline;font-weight:700;">Message us on WhatsApp</a>.`}
    </p>
    <p style="color:#2E2E2E;opacity:.6;font-size:11px;text-align:center;margin:24px 0 0;">
      <a href="${unsubUrl}" style="color:#2E2E2E;text-decoration:underline;">${isAr ? "إلغاء الاشتراك" : "Unsubscribe"}</a>
      &nbsp;·&nbsp; ${isAr ? "كلوفرز، مصر" : "KLovers Academy, Egypt"}
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function button(label: string, url: string): string {
  return `<div style="margin:24px 0;text-align:center;">
    <a href="${url}" style="background:#FFFF00;color:#2E2E2E;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:16px;font-weight:700;display:inline-block;">${label}</a>
  </div>`;
}

/** She was in the room. The next step is a seat, so that is the whole letter. */
function cameLetter(name: string, isAr: boolean, unsubUrl: string) {
  const who = name?.trim() || (isAr ? "أهلاً" : "there");
  if (isAr) {
    return {
      subject: "كلوفرز — مقعد في المجموعة",
      text: `مرحباً ${who}،\n\nيسعدنا حضور الحصة معنا.\n\nالتسجيل مفتوح: اختيار المستوى والموعد المناسب من صفحة التسجيل:\n${ENROL_URL}\n\nيُحجز المقعد من وقت التسجيل، والدفع بعد بداية المجموعة.\n\nإلغاء الاشتراك: ${unsubUrl}\nكلوفرز — kloversegy.com`,
      html: wrap(
        `<h1 style="color:#2E2E2E;font-size:22px;margin:0 0 12px;">مرحباً ${who}،</h1>
         <p style="margin:0 0 6px;">يسعدنا حضور الحصة معنا.</p>
         <p style="margin:0;">التسجيل مفتوح: اختيار المستوى والموعد المناسب من صفحة التسجيل.</p>
         ${button("اختيار المجموعة", ENROL_URL)}
         <p style="margin:0;">يُحجز المقعد من وقت التسجيل، والدفع بعد بداية المجموعة.</p>`,
        true, unsubUrl,
      ),
    };
  }
  return {
    subject: "KLovers — your place in the group",
    text: `Hi ${who},\n\nIt was good to have you in the class.\n\nEnrolment is open — choose your level and a time that suits you:\n${ENROL_URL}\n\nYour seat is held from the moment you enrol, and payment comes after the group starts.\n\nUnsubscribe: ${unsubUrl}\nKLovers Academy — kloversegy.com`,
    html: wrap(
      `<h1 style="color:#2E2E2E;font-size:22px;margin:0 0 12px;">Hi ${who},</h1>
       <p style="margin:0 0 6px;">It was good to have you in the class.</p>
       <p style="margin:0;">Enrolment is open — choose your level and a time that suits you.</p>
       ${button("Choose your group", ENROL_URL)}
       <p style="margin:0;">Your seat is held from the moment you enrol, and payment comes after the group starts.</p>`,
      false, unsubUrl,
    ),
  };
}

/**
 * She did not come.
 *
 * The letter offers another trial and asks for nothing else. No "we missed
 * you", no reason requested, no note that the seat was held: a person who did
 * not turn up usually knows she did not, and the useful thing to hand her is
 * the next date rather than the feeling of having been counted absent.
 *
 * Not sent unless a caller asks for it by name — see `letters` above.
 */
function missedLetter(name: string, isAr: boolean, unsubUrl: string) {
  const who = name?.trim() || (isAr ? "أهلاً" : "there");
  if (isAr) {
    return {
      subject: "كلوفرز — حصة تجريبية في موعد آخر",
      text: `مرحباً ${who}،\n\nربما لم يكن الموعد مناسبًا. تتوفر مواعيد أخرى للحصة التجريبية، ويمكن حجز مقعد في أيٍّ منها:\n${TRIAL_URL}\n\nإلغاء الاشتراك: ${unsubUrl}\nكلوفرز — kloversegy.com`,
      html: wrap(
        `<h1 style="color:#2E2E2E;font-size:22px;margin:0 0 12px;">مرحباً ${who}،</h1>
         <p style="margin:0;">ربما لم يكن الموعد مناسبًا. تتوفر مواعيد أخرى للحصة التجريبية، ويمكن حجز مقعد في أيٍّ منها.</p>
         ${button("حجز حصة تجريبية", TRIAL_URL)}`,
        true, unsubUrl,
      ),
    };
  }
  return {
    subject: "KLovers — a trial class at another time",
    text: `Hi ${who},\n\nThe time may not have suited you. There are other trial slots, and you can book any of them here:\n${TRIAL_URL}\n\nUnsubscribe: ${unsubUrl}\nKLovers Academy — kloversegy.com`,
    html: wrap(
      `<h1 style="color:#2E2E2E;font-size:22px;margin:0 0 12px;">Hi ${who},</h1>
       <p style="margin:0;">The time may not have suited you. There are other trial slots, and you can book any of them.</p>
       ${button("Book a trial class", TRIAL_URL)}`,
      false, unsubUrl,
    ),
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const ok = (data: unknown) =>
    new Response(JSON.stringify(data), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const err = (msg: string, status = 400) =>
    new Response(JSON.stringify({ error: msg }), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    // ── Admin guard ───────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!jwt) return err("Unauthorized — admin JWT required", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: authErr } = await supabase.auth.getUser(jwt);
    if (authErr || !user) return err("Unauthorized", 401);

    const { data: roleRow } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!roleRow) return err("Forbidden — admin role required", 403);

    // ── Body ──────────────────────────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const dry_run: boolean = body.dry_run !== false;
    const trial_date: string | null = body.trial_date ?? null;
    const start_time: string | null = body.start_time ?? null;
    // Anything other than an explicit "missed"/"both" means the students who
    // came. The narrow reading of an unrecognised value is on purpose: a typo
    // must not widen who gets written to.
    const letters: Selection =
      body.letters === "missed" ? "missed" : body.letters === "both" ? "both" : "came";
    if (!trial_date) return err("trial_date is required");

    // ── The working set ───────────────────────────────────────────────────────
    // Marked, and not yet written to. An unmarked booking is NOT here: undecided
    // is not a no-show, and a sender that treated it as one would undo the only
    // reason the third state exists.
    let q = supabase
      .from("trial_bookings")
      .select("id, name, email, user_id, class_language, attended")
      .eq("trial_date", trial_date)
      .neq("status", "cancelled")
      .not("attended", "is", null)
      .is("attended_letter_sent_at", null)
      .not("email", "is", null);
    if (start_time) q = q.eq("start_time", start_time);

    const { data: rows, error: rowsErr } = await q;
    if (rowsErr) throw rowsErr;

    const bookings = (rows ?? []) as Booking[];
    if (!bookings.length) {
      return ok({
        dry_run, trial_date, start_time, letters,
        eligible: 0, sent: 0,
        came_waiting: 0, missed_waiting: 0,
        note: "Nobody is marked and unsent for this session.",
      });
    }

    // ── Unsubscribe state, from either identity table ─────────────────────────
    // An account is the stronger identity, so profiles first; leads carry the
    // 27 bookings made without signing up.
    const emails = [...new Set(bookings.map(b => (b.email ?? "").trim().toLowerCase()).filter(Boolean))];
    const userIds = [...new Set(bookings.map(b => b.user_id).filter(Boolean))] as string[];

    const [{ data: profiles }, { data: leads }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("user_id, email, email_unsubscribed, unsubscribe_token").in("user_id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      supabase.from("leads").select("email, email_unsubscribed, unsubscribe_token").in("email", emails),
    ]);

    const byUser = new Map<string, any>();
    for (const p of profiles ?? []) if (p.user_id) byUser.set(p.user_id, p);
    const byEmail = new Map<string, any>();
    for (const l of leads ?? []) {
      const k = (l.email ?? "").trim().toLowerCase();
      // Unsubscribed wins over any other row for the same address.
      if (!k) continue;
      const prev = byEmail.get(k);
      if (!prev || l.email_unsubscribed === true) byEmail.set(k, l);
    }

    type Planned = {
      booking: Booking;
      isAr: boolean;
      letter: LetterKind;
      token: string | null;
    };
    const planned: Planned[] = [];
    let skippedUnsubscribed = 0;

    for (const b of bookings) {
      const k = (b.email ?? "").trim().toLowerCase();
      const p = b.user_id ? byUser.get(b.user_id) : null;
      const l = byEmail.get(k);
      if (p?.email_unsubscribed === true || l?.email_unsubscribed === true) {
        skippedUnsubscribed += 1;
        continue;
      }
      planned.push({
        booking: b,
        // Arabic unless the booking says English. The trial rooms are Arabic by
        // default and a wrong-language letter reads as a letter to somebody else.
        isAr: (b.class_language ?? "arabic").toLowerCase() !== "english",
        letter: b.attended === true ? "came" : "missed",
        token: p?.unsubscribe_token ?? l?.unsubscribe_token ?? null,
      });
    }

    // Reported whether or not they are selected, so "4 no-shows are waiting" is
    // visible rather than something the caller has to know to go looking for.
    const cameWaiting = planned.filter(p => p.letter === "came").length;
    const missedWaiting = planned.filter(p => p.letter === "missed").length;

    const selected = planned.filter(p => letters === "both" || p.letter === letters);

    const withoutUnsubscribeLink = selected.filter(p => !p.token).length;
    const cameCount = selected.filter(p => p.letter === "came").length;
    const missedCount = selected.filter(p => p.letter === "missed").length;

    if (dry_run) {
      return ok({
        dry_run: true,
        trial_date, start_time, letters,
        eligible: selected.length,
        came: cameCount,
        missed: missedCount,
        came_waiting: cameWaiting,
        missed_waiting: missedWaiting,
        skipped_unsubscribed: skippedUnsubscribed,
        without_unsubscribe_link: withoutUnsubscribeLink,
        recipients: selected.map(p => ({
          name: p.booking.name,
          email: p.booking.email,
          letter: p.letter,
          language: p.isAr ? "ar" : "en",
        })),
      });
    }

    // ── Send ──────────────────────────────────────────────────────────────────
    const BATCH_SIZE = 100;
    let sent = 0;
    let errors = 0;
    const errorLog: string[] = [];

    for (let i = 0; i < selected.length; i += BATCH_SIZE) {
      const chunk = selected.slice(i, i + BATCH_SIZE);
      const payload = chunk.map(p => {
        const footer = footerUnsubscribeUrl(p.token);
        const built = p.letter === "came"
          ? cameLetter(p.booking.name ?? "", p.isAr, footer)
          : missedLetter(p.booking.name ?? "", p.isAr, footer);
        return {
          to: p.booking.email as string,
          subject: built.subject,
          html: built.html,
          text: built.text,
          unsubscribeUrl: headerUnsubscribeUrl(p.token, p.isAr),
        };
      });

      try {
        await sendBatch(payload);
        sent += payload.length;
        // Stamped only after the batch is accepted, and only for the rows in it.
        // A no-show who was not selected keeps a null stamp and stays in the
        // working set, so her letter can still go later with one press.
        const ids = chunk.map(p => p.booking.id);
        const { error: stampErr } = await supabase
          .from("trial_bookings")
          .update({ attended_letter_sent_at: new Date().toISOString() } as never)
          .in("id", ids);
        if (stampErr) {
          // The letters went. Say so loudly rather than pretending they did not:
          // an unstamped row can be written to twice by the next press.
          console.error("[attendance-letters] stamp failed after send:", stampErr.message);
          errorLog.push(`sent but not stamped: ${ids.join(",")} — ${stampErr.message}`);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`[attendance-letters] batch ${i} failed:`, msg);
        errors += payload.length;
        errorLog.push(msg);
      }
    }

    console.log(
      `[attendance-letters] ${trial_date} ${start_time ?? "(all times)"} letters=${letters} sent=${sent} ` +
      `came=${cameCount} missed=${missedCount} missed_waiting=${missedWaiting} ` +
      `unsub_skipped=${skippedUnsubscribed} errors=${errors}`,
    );

    return ok({
      dry_run: false,
      trial_date, start_time, letters,
      sent, errors,
      came: cameCount,
      missed: missedCount,
      came_waiting: cameWaiting,
      missed_waiting: missedWaiting,
      skipped_unsubscribed: skippedUnsubscribed,
      without_unsubscribe_link: withoutUnsubscribeLink,
      errorLog,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[attendance-letters] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
