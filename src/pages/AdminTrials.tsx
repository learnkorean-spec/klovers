/**
 * /admin/trials — the three questions, and nothing else.
 *
 * Re said the trial bookings screen is too complicated. Asked what she actually
 * does on it, she named three things:
 *
 *   1. who is coming to the next session
 *   2. accept the new bookings
 *   3. find one particular person
 *
 * The screen she has answers none of them well. It is one flat table of all 74
 * bookings across every date, eight columns wide, and the widest column is a
 * free-text field carrying engineering notes - "Slot inactive and (for 18 of
 * 20) in the wrong language. A fresh invitation offering the live slots was
 * emailed first - see email logs, template admin message..." - so every row is
 * four lines tall and the sessions themselves are invisible inside it.
 *
 * WHY THERE ARE NO BIG BUTTONS HERE
 *
 * The loudest control on that screen is the yellow "Accept all pending (30)",
 * and /admin/guide lists it in red under "أزرار متضغطيهاش" - buttons you
 * must not press - because it relabels every booking at once and changes
 * nothing about who receives an email. Three of the other prominent controls
 * are on the same list. A screen that needs a written manual with a forbidden
 * section is a screen, not a manual, that needs fixing, so none of those four
 * appear here at all.
 *
 * The one legitimate action - ask a session to confirm, check the count, send -
 * is a ritual with a count-matching step in the middle, and it still lives on
 * the old screen. This page links to it at the point of use rather than
 * reimplementing it half-way.
 *
 * It also replaces the session table in /admin/guide, which is a hand-written
 * snapshot dated 9 September 2026 and says so in its own subtitle. These
 * numbers are read when the page opens.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminShell from "@/components/admin/AdminShell";

const BRAND = "#FFFF00";

interface Booking {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  level: string | null;
  class_language: string | null;
  trial_date: string | null;
  start_time: string | null;
  status: string | null;
  is_tba: boolean | null;
  attendance_response: string | null;
  attendance_email_sent_at: string | null;
  attendance_responded_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  attended: boolean | null;
}

/** "2026-09-25" -> "الجمعة 25 سبتمبر". Read as a plain date, never shifted. */
function arDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
}

/** "16:30" -> "4:30 م". The stored time is Cairo, which is where the school is. */
function arTime(hhmm: string | null): string {
  if (!hhmm) return "موعد مش محدد";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "م" : "ص";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}

const LANG_AR: Record<string, string> = { arabic: "عربي", english: "إنجليزي" };

/**
 * One student's state, in the words Re would use.
 *
 * Deliberately a sentence and not a status code: "pending" and
 * "confirmed_attendance" are the database's vocabulary, and reading them is a
 * translation step she should not have to do.
 */
function saidWhat(b: Booking): { label: string; tone: "yes" | "no" | "wait" | "gone" } {
  if (b.status === "cancelled") return { label: "لغت", tone: "gone" };
  if (b.attendance_response === "yes") return { label: "هتحضر", tone: "yes" };
  if (b.attendance_response === "no") return { label: "مش هتقدر", tone: "no" };
  if (b.attendance_email_sent_at) return { label: "اتسألت ولسه ماردتش", tone: "wait" };
  return { label: "لسه ماتسألتش", tone: "wait" };
}

const TONE: Record<string, string> = {
  yes:  "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300",
  no:   "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300",
  wait: "border-border bg-muted text-muted-foreground",
  gone: "border-border bg-muted text-muted-foreground line-through",
};

function Chip({ children, tone }: { children: React.ReactNode; tone: string }) {
  return (
    <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TONE[tone]}`}>
      {children}
    </span>
  );
}

/** A person, one line. The cancellation note is the only thing that expands. */
function Person({ b }: { b: Booking }) {
  const [why, setWhy] = useState(false);
  const said = saidWhat(b);
  return (
    <li className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border py-2 last:border-0">
      <span className="font-medium">{b.name || "بدون اسم"}</span>
      <span dir="ltr" className="text-xs text-muted-foreground">{b.email}</span>
      <Chip tone={said.tone}>{said.label}</Chip>
      {b.cancel_reason && (
        <button
          type="button"
          onClick={() => setWhy(v => !v)}
          className="rounded-sm text-[11px] text-muted-foreground underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {why ? "إخفاء السبب" : "ليه؟"}
        </button>
      )}
      {why && b.cancel_reason && (
        <p className="w-full text-[11px] leading-relaxed text-muted-foreground">{b.cancel_reason}</p>
      )}
    </li>
  );
}

export default function AdminTrials() {
  const [rows, setRows] = useState<Booking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: err } = await supabase
        .from("trial_bookings")
        .select(
          "id,name,email,phone,level,class_language,trial_date,start_time,status,is_tba," +
          "attendance_response,attendance_email_sent_at,attendance_responded_at," +
          "cancelled_at,cancel_reason,created_at,attended",
        )
        .order("trial_date", { ascending: true });
      if (!alive) return;
      if (err) { setError(err.message); return; }
      setRows((data ?? []) as unknown as Booking[]);
    })();
    return () => { alive = false; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  /**
   * The sessions, newest first among the ones still ahead. A booking with no
   * date (TBA) belongs to no session and is left out here on purpose: it is not
   * an answer to "who is coming", and the old screen already gives it a section
   * of its own that is entirely cancelled rows.
   */
  const sessions = useMemo(() => {
    const live = (rows ?? []).filter(
      b => b.trial_date && !b.is_tba && b.trial_date >= today && b.status !== "cancelled",
    );
    const byKey = new Map<string, Booking[]>();
    for (const b of live) {
      const key = `${b.trial_date}|${b.start_time ?? ""}|${b.class_language ?? ""}`;
      byKey.set(key, [...(byKey.get(key) ?? []), b]);
    }
    return [...byKey.entries()]
      .map(([key, people]) => {
        const [date, time, lang] = key.split("|");
        return {
          key, date, time, lang, people,
          yes:    people.filter(p => p.attendance_response === "yes").length,
          no:     people.filter(p => p.attendance_response === "no").length,
          asked:  people.filter(p => p.attendance_email_sent_at).length,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [rows, today]);

  const found = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    return (rows ?? [])
      .filter(b =>
        (b.name ?? "").toLowerCase().includes(needle) ||
        (b.email ?? "").toLowerCase().includes(needle))
      .slice(0, 25);
  }, [rows, q]);

  return (
    <AdminShell activeId="trials">
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="bg-[#111] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="block h-5 w-5 rounded" style={{ background: BRAND }} />
            <span className="text-xs font-bold tracking-[.16em] text-neutral-300">KLOVERS</span>
          </div>
          <h1 className="mb-2 text-3xl font-bold leading-snug">الحصص التجريبية</h1>
          <p className="m-0 text-sm text-neutral-400">
            الأرقام دي بتتقرا دلوقتي من النظام — مش لقطة قديمة. المواعيد بتوقيت القاهرة.
          </p>
        </div>
      </header>

      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-24 text-[16.5px] leading-[1.85]">
        {error && (
          <p className="mt-8 rounded-lg border border-destructive p-4 text-sm">
            ماقدرتش أقرا الحجوزات: {error}
          </p>
        )}

        {/* ---- 1. مين جاي الحصة الجاية ---- */}
        <h2 className="mt-12 mb-1 flex items-center gap-3 text-xl font-bold">
          <span className="block h-3 w-3 shrink-0 rounded-sm" style={{ background: BRAND }} />
          الحصص الجاية
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          كل حصة ومين فيها. أهم حاجة في السطر هي <b>هل الدعوة اتبعتت</b> — من غيرها محدش هيرد.
        </p>

        {rows === null && <p className="text-sm text-muted-foreground">بقرا…</p>}
        {rows !== null && sessions.length === 0 && (
          <p className="rounded-lg border p-4 text-sm text-muted-foreground">مفيش حصص جاية بتاريخ.</p>
        )}

        <div className="space-y-3">
          {sessions.map(s => {
            const noReply = s.people.length - s.yes - s.no;
            const isOpen = open === s.key;
            return (
              <div key={s.key} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-lg font-bold">{arDate(s.date)}</span>
                  <span className="text-muted-foreground">{arTime(s.time)}</span>
                  <span className="rounded-md border px-2 py-0.5 text-[11px]">
                    {LANG_AR[s.lang] ?? s.lang ?? "—"}
                  </span>
                  {s.asked === 0 ? (
                    <span className="rounded-md border border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      الدعوة لسه مااتبعتتش
                    </span>
                  ) : s.asked < s.people.length ? (
                    <span className="rounded-md border border-amber-400 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                      اتبعتت لـ {s.asked} من {s.people.length}
                    </span>
                  ) : (
                    <span className="rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300">
                      الدعوة اتبعتت للكل
                    </span>
                  )}
                </div>

                <p className="mt-1 text-sm text-muted-foreground">
                  <b className="text-foreground">{s.people.length}</b> حجز ·{" "}
                  <b className="text-foreground">{s.yes}</b> هيحضروا ·{" "}
                  {noReply} لسه ماردوش
                  {s.no > 0 && <> · {s.no} مش هيقدروا</>}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : s.key)}
                    className="rounded-sm text-sm underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    {isOpen ? "إخفاء الأسماء" : `الأسماء (${s.people.length})`}
                  </button>
                  {s.asked < s.people.length && (
                    <Link
                      to="/admin?tab=trials"
                      className="text-sm font-semibold underline decoration-2 underline-offset-4"
                    >
                      ابعتي الدعوة ←
                    </Link>
                  )}
                </div>

                {isOpen && (
                  <ul className="mt-3 list-none p-0">
                    {s.people
                      .slice()
                      .sort((a, b) => (b.attendance_response ?? "").localeCompare(a.attendance_response ?? ""))
                      .map(p => <Person key={p.id} b={p} />)}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        {/* ---- 2. دوّري على حد ---- */}
        <h2 className="mt-12 mb-1 flex items-center gap-3 text-xl font-bold">
          <span className="block h-3 w-3 shrink-0 rounded-sm" style={{ background: BRAND }} />
          دوّري على حد
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">بالاسم أو الإيميل — في كل الحجوزات، قديمها وجديدها.</p>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="اكتبي حرفين على الأقل…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />
        {q.trim().length >= 2 && (
          found.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">مفيش حد بالاسم ده.</p>
          ) : (
            <ul className="mt-3 list-none p-0">
              {found.map(b => (
                <li key={b.id} className="border-b border-border py-3 last:border-0">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <span className="font-medium">{b.name || "بدون اسم"}</span>
                    <span dir="ltr" className="text-xs text-muted-foreground">{b.email}</span>
                    <Chip tone={saidWhat(b).tone}>{saidWhat(b).label}</Chip>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {b.trial_date && !b.is_tba
                      ? <>{arDate(b.trial_date)} · {arTime(b.start_time)}</>
                      : "ماخدتش ميعاد"}
                    {b.class_language && <> · {LANG_AR[b.class_language] ?? b.class_language}</>}
                    {b.level && <> · {b.level}</>}
                  </p>
                  {b.cancel_reason && (
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{b.cancel_reason}</p>
                  )}
                </li>
              ))}
            </ul>
          )
        )}

        {/* ---- 3. اللي متعملش من هنا ---- */}
        <h2 className="mt-12 mb-1 flex items-center gap-3 text-xl font-bold">
          <span className="block h-3 w-3 shrink-0 rounded-sm" style={{ background: BRAND }} />
          ليه مفيش أزرار كتير هنا
        </h2>
        <div className="rounded-l-lg border-r-4 border-red-500 bg-red-50 p-4 text-sm dark:bg-red-950/40">
          <p className="m-0">
            الأربع أزرار اللي في الشاشة القديمة — <b>Accept all pending</b> و<b>Confirm</b> و
            <b>Reject / Unschedule</b> و<b>Resend with new dates</b> — موجودين في{" "}
            <Link to="/admin/guide" className="underline decoration-2 underline-offset-4">الدليل</Link>{" "}
            تحت عنوان «أزرار متضغطيهاش». عشان كده موجودش ولا واحد فيهم هنا.
          </p>
        </div>

        <footer className="mt-14 border-t border-border pt-5 text-sm text-muted-foreground">
          <p>
            إرسال الدعوات لسه في{" "}
            <Link to="/admin?tab=trials" className="underline decoration-2 underline-offset-4">الشاشة القديمة</Link>
            {" "}— فيها خطوة مراجعة للعدد قبل الإرسال، وماحبتش أنقلها نص نقلة.
          </p>
          <p className="mt-4 flex gap-4">
            <Link to="/admin/today" className="underline decoration-2 underline-offset-4">← اللوحة</Link>
            <Link to="/admin/guide" className="underline decoration-2 underline-offset-4">الدليل</Link>
          </p>
        </footer>
      </main>
    </div>
    </AdminShell>
  );
}
