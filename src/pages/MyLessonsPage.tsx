import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Loader2, Video, AlertTriangle, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import ExchangeAnnouncement from "@/components/exchange/ExchangeAnnouncement";
import { formatMoney } from "@/types/students";
import WorldEntryCard from "@/components/games/WorldEntryCard";
import StudentSelfService from "@/components/StudentSelfService";
import { VOCA_INK, VOCA_PAPER, VocaStudentHeader, VocaStudentFooter } from "@/components/voca/VocaBrand";

/**
 * What a private student sees: her own lessons, and nothing else.
 *
 * Every other student-facing page here is built around the Korean course — the
 * textbook, the vocabulary reviews, the Hangul games, the level ladder. None of
 * that belongs to a private student, and none of it belongs to an English one
 * at all. This page carries only the four facts such a student actually needs:
 * when her lessons are, how many are left, what she owes, and where to join.
 *
 * World mode (Re, 25 Sep 2026): Korean private students open onto the
 * Conversation Café, the same world as the schedule and profile pages. English
 * students keep a plain header — their own world is to be built later, and
 * nothing here may tell them they are learning Korean.
 *
 * It reads the teaching roster directly. Until the migration that ships with
 * this page, those tables were admin-only and a private student could not see a
 * single row about her own lessons — true for the Korean students too, not just
 * the English one.
 *
 * Every read here is error-checked rather than defaulted, and the reason is
 * specific to this page: an ignored failure renders as "no bundle recorded" and
 * "nothing booked", which is indistinguishable from a student who genuinely has
 * neither. A broken page must not be able to impersonate an empty one.
 *
 * A student with no roster row is not an error: she is an ordinary site
 * student who reached this URL. She is told so and sent back.
 */

const DAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CAFE_IMAGE = "/assets/story/world-conversation-cafe.webp";

const COPY = {
  ar: {
    title: "حصصي",
    subtitle: "المواعيد والباقة في مكان واحد.",
    world: "مقهى المحادثة",
    cluby: "«طاولتك محجوزة، وكل حصة جملة جديدة على الطاولة»",
    cafeAlt: "مقهى المحادثة في عالم كلوفرز، حيث تُقال الجمل الكورية الأولى",
    weekly: "الموعد الأسبوعي",
    noWeekly: "لا يوجد موعد أسبوعي مسجّل بعد. يمكن التواصل معي لتحديده.",
    bundle: "الباقة",
    noBundle: "لا توجد باقة مسجّلة حاليًا.",
    used: "المستخدم",
    left: "المتبقي",
    ofN: "من",
    classes: "حصة",
    upcoming: "الحصص القادمة",
    noUpcoming: "لا توجد حصص محجوزة حاليًا.",
    join: "دخول الحصة",
    owes: "توجد دفعة مستحقة",
    bundleUnpaid: "لم يتم دفع الباقة بعد",
    bundleDue: (amount: string, label: string) => `المستحق ${amount} عن باقة «${label}». يُرجى الدفع ثم رفع صورة الإيصال.`,
    bundlePending: "تم إرسال الدفع، بانتظار تأكيد المعلّمة.",
    payNow: "ادفع الآن",
    pay: "رفع الإيصال",
    lastCovered: "هذه آخر حصة في الباقة الحالية، وما بعدها بداية باقة جديدة.",
    notPrivate: "هذه الصفحة مخصّصة لطلاب الحصص الخاصة، والحساب غير مرتبط بحصص خاصة.",
    backToDashboard: "العودة إلى الحساب",
    loadFailed: "تعذّر تحميل البيانات.",
    refresh: "إعادة المحاولة",
  },
  en: {
    title: "My lessons",
    subtitle: "Your times and your bundle, in one place.",
    world: "The Conversation Café",
    cluby: "“Your table is saved. Every lesson puts a new sentence on it.”",
    cafeAlt: "The Conversation Café in the Klovers world, where the first Korean sentences are spoken",
    weekly: "Your weekly time",
    noWeekly: "No weekly time recorded yet. Message me and we'll set one.",
    bundle: "Your bundle",
    noBundle: "No bundle recorded right now.",
    used: "Used",
    left: "Left",
    ofN: "of",
    classes: "classes",
    upcoming: "Upcoming lessons",
    noUpcoming: "Nothing booked right now.",
    join: "Join the lesson",
    owes: "You have a payment due",
    bundleUnpaid: "Your bundle isn't paid yet",
    bundleDue: (amount: string, label: string) => `${amount} is due for your "${label}" bundle. Please pay, then upload the receipt.`,
    bundlePending: "Payment sent: waiting for your teacher to confirm it.",
    payNow: "Pay now",
    pay: "Upload the receipt",
    lastCovered: "This is the last lesson in your bundle, the next one starts a new bundle.",
    notPrivate: "This page is for private-lesson students. Your account has no private lessons.",
    backToDashboard: "Back to your account",
    loadFailed: "We could not load your details.",
    refresh: "Try again",
  },
};

interface RosterRow {
  id: string;
  full_name: string;
  subject: string;
  meeting_url: string | null;
}

interface ClassRow {
  weekday: number;
  start_time: string;
  duration_minutes: number;
}

interface Balance {
  student_id: string;
  label: string;
  total_classes: number;
  used_classes: number;
  remaining_classes: number;
  total_price: number;
  currency: string;
}

interface SessionRow {
  id: string;
  session_date: string;
  start_time: string;
}

/** "16:00:00" or "16:00" -> "16:00". */
const hhmm = (t: string) => (t ?? "").slice(0, 5);

/** Korean private students get the story world; any other subject does not. */
const isKoreanSubject = (subject: string | null | undefined) => /korean|كوري/i.test(subject ?? "");

/**
 * English private students are Voca students, not Klovers ones (Re, 23 Oct
 * 2026: "they are under voca"). For them this page is fully Voca: Voca's
 * header and footer instead of the sitewide Klovers ones, Voca maroon accents
 * instead of klovers-green, and no KLOVERS World card — that door leads into
 * the Korean story world, which is not their course. Korean private students
 * are unchanged.
 */
const isEnglishSubject = (subject: string | null | undefined) => /english/i.test(subject ?? "");

const MyLessonsPage = () => {
  const navigate = useNavigate();
  const { language, toggleLanguage } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const c = isAr ? COPY.ar : COPY.en;
  const DAY = isAr ? DAY_AR : DAY_EN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterRow | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [dueEnrollmentId, setDueEnrollmentId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  // The active bundle when it has no paid_on: taught on credit, so she owes it.
  const [unpaid, setUnpaid] = useState<{ label: string; total_price: number; currency: string; pending: boolean } | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        const session = sessionData.session;
        if (!session) { navigate("/login"); return; }
        setUserId(session.user.id);

        // RLS returns this student's own row and no other.
        const { data: ts, error: tsError } = await supabase
          .from("teacher_students")
          .select("id, full_name, subject, meeting_url")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (tsError) throw tsError;

        if (!ts) { setLoading(false); return; }
        const row = ts as unknown as RosterRow;
        setRoster(row);

        const today = new Date().toISOString().slice(0, 10);

        const [cls, bal, ses, enr] = await Promise.all([
          supabase
            .from("teacher_student_classes")
            .select("weekday, start_time, duration_minutes")
            .eq("student_id", row.id)
            .is("effective_to", null)
            .order("weekday"),
          supabase.rpc("get_student_bundle_balances"),
          supabase
            .from("student_class_sessions")
            .select("id, session_date, start_time")
            .eq("student_id", row.id)
            .eq("outcome", "scheduled")
            .gte("session_date", today)
            .order("session_date")
            .limit(6),
          supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("approval_status", "PENDING_PAYMENT")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        // One rejected read here would otherwise render as an empty section,
        // which reads exactly like a student who has no bundle and no lessons.
        const failed = [cls.error, bal.error, ses.error, enr.error].find(Boolean);
        if (failed) throw failed;

        setClasses((cls.data ?? []) as unknown as ClassRow[]);
        // The function is not SECURITY DEFINER, so RLS has already narrowed
        // this to her own bundles; the find is belt and braces.
        setBalance(
          ((bal.data ?? []) as unknown as Balance[]).find(b => b.student_id === row.id) ?? null,
        );
        setSessions((ses.data ?? []) as unknown as SessionRow[]);
        setDueEnrollmentId((enr.data as { id?: string } | null)?.id ?? null);

        // Is the active bundle paid? get_student_bundle_balances doesn't carry
        // paid_on, so read it from the bundle itself (RLS: her own rows only),
        // plus her latest claim on it, so a payment she already reported reads
        // as "waiting" rather than "you must pay".
        const { data: activeBundle, error: abError } = await supabase
          .from("student_bundles")
          .select("id, label, total_price, currency, paid_on")
          .eq("student_id", row.id)
          .eq("status", "active")
          .order("purchased_on", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (abError) throw abError;
        const ab = activeBundle as { id: string; label: string | null; total_price: number; currency: string | null; paid_on: string | null } | null;
        if (ab && !ab.paid_on) {
          const { data: claim, error: claimError } = await supabase
            .from("student_payment_claims")
            .select("status")
            .eq("bundle_id", ab.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (claimError) throw claimError;
          setUnpaid({
            label: ab.label ?? "",
            total_price: Number(ab.total_price),
            currency: ab.currency ?? "EGP",
            pending: (claim as { status?: string } | null)?.status === "pending",
          });
        } else {
          setUnpaid(null);
        }
      } catch (err) {
        console.error("[my-lessons]", err);
        setError(c.loadFailed);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-sm">
            <AlertTriangle className="h-10 w-10 mx-auto text-wrong dark:text-[#FF3131]" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={() => window.location.reload()}>{c.refresh}</Button>
          </div>
        </main>
      </div>
    );
  }

  if (!roster) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 flex items-center justify-center px-4">
          <div className="text-center space-y-4 max-w-sm">
            <p className="text-sm text-muted-foreground">{c.notPrivate}</p>
            <Button onClick={() => navigate("/dashboard")}>{c.backToDashboard}</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // The lesson after the last one her bundle pays for. Shown on the row itself
  // rather than as a separate warning, so she reads it while looking at the
  // date it applies to.
  const lastCoveredIndex = balance ? balance.remaining_classes - 1 : -1;
  const inWorld = isKoreanSubject(roster.subject);
  const voca = isEnglishSubject(roster.subject);

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"} style={voca ? { backgroundColor: VOCA_PAPER } : undefined}>
      {voca ? <VocaStudentHeader tr={tr} toggleLanguage={toggleLanguage} /> : <Header />}
      <main id="main-content" className={voca ? "pt-10 pb-16 px-4" : "pt-24 pb-16 px-4"}>
        <div className="max-w-2xl mx-auto space-y-5">

          <ExchangeAnnouncement isAr={isAr} surface="english_dashboard" />

          {inWorld ? (
            <div className="space-y-2">
              <div className="relative h-32 overflow-hidden rounded-2xl border border-border bg-ivory dark:bg-card md:h-40">
                <img
                  src={CAFE_IMAGE}
                  alt={c.cafeAlt}
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-klovers-yellow">{c.world}</p>
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-white md:text-3xl">
                    {c.title}: {roster.full_name}
                  </h1>
                </div>
              </div>
              <p className="cluby-note text-sm text-foreground/80" lang={isAr ? "ar" : "en"}>{c.cluby}</p>
              <p className="text-sm text-muted-foreground">{c.subtitle}</p>
            </div>
          ) : (
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={voca ? { color: VOCA_INK } : undefined}>
                {c.title}: {roster.full_name}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
            </div>
          )}

          {unpaid && (
            <div
              role="alert"
              className="rounded-xl border-2 p-4 flex flex-wrap items-center justify-between gap-3"
              style={voca
                ? { borderColor: VOCA_INK, backgroundColor: unpaid.pending ? "#ffffff" : VOCA_INK, color: unpaid.pending ? VOCA_INK : "#ffffff" }
                : { borderColor: "#FF3131", backgroundColor: "rgba(255,49,49,0.1)" }}
            >
              <div className="flex items-start gap-2 min-w-0">
                {unpaid.pending ? <Clock className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold">{unpaid.pending ? c.bundlePending : c.bundleUnpaid}</p>
                  {!unpaid.pending && (
                    <p className="text-sm opacity-90 mt-0.5">
                      {c.bundleDue(formatMoney(unpaid.total_price, unpaid.currency), unpaid.label)}
                    </p>
                  )}
                </div>
              </div>
              {!unpaid.pending && (
                <Button
                  size="sm"
                  className="rounded-full font-bold"
                  style={voca ? { backgroundColor: "#FFFF00", color: "#111111" } : undefined}
                  onClick={() => document.getElementById("pay")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                >
                  <Wallet className="h-4 w-4 me-1.5" /> {c.payNow}
                </Button>
              )}
            </div>
          )}

          {dueEnrollmentId && (
            <Card className="border-2 border-[#FF3131] bg-[#FF3131]/10 dark:bg-card">
              <CardContent className="pt-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0" />
                  {c.owes}
                </p>
                <Button size="sm" onClick={() => navigate(`/pay/${dueEnrollmentId}`)}>
                  {c.pay}
                </Button>
              </CardContent>
            </Card>
          )}

          {inWorld && <WorldEntryCard isAr={isAr} compact />}

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={voca ? { color: VOCA_INK } : undefined}>
                <Clock className="h-4 w-4" /> {c.weekly}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {classes.length === 0 ? (
                <p className="text-sm text-muted-foreground">{c.noWeekly}</p>
              ) : (
                <ul className="space-y-1.5">
                  {classes.map((cl, i) => (
                    <li key={i} className="text-sm text-foreground">
                      <span className="font-medium">{DAY[cl.weekday]}</span>{" "}
                      <span className="tabular-nums">{hhmm(cl.start_time)}</span>{" "}
                      <span className="text-xs text-muted-foreground">
                        · {cl.duration_minutes} {isAr ? "دقيقة" : "min"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {roster.meeting_url && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  style={voca ? { borderColor: VOCA_INK, color: VOCA_INK } : undefined}
                  onClick={() => window.open(roster.meeting_url!, "_blank", "noopener,noreferrer")}
                >
                  <Video className="h-4 w-4 me-1.5" /> {c.join}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={voca ? { color: VOCA_INK } : undefined}>
                <Wallet className="h-4 w-4" /> {c.bundle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!balance ? (
                <p className="text-sm text-muted-foreground">{c.noBundle}</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{balance.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.used} {balance.used_classes} {c.ofN} {balance.total_classes} ·{" "}
                    <span className="text-foreground font-medium">
                      {c.left} {balance.remaining_classes} {c.classes}
                    </span>{" "}
                    · {formatMoney(balance.total_price, balance.currency)}
                  </p>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={voca ? "h-full" : "h-full bg-klovers-green"}
                      style={{
                        ...(voca ? { backgroundColor: VOCA_INK } : {}),
                        width: `${Math.min(100, Math.max(0,
                          (balance.used_classes / Math.max(1, balance.total_classes)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2" style={voca ? { color: VOCA_INK } : undefined}>
                <CalendarDays className="h-4 w-4" /> {c.upcoming}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{c.noUpcoming}</p>
              ) : (
                <ul className="space-y-2">
                  {sessions.map((s, i) => (
                    <li key={s.id} className="rounded-md bg-muted/30 px-3 py-2">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{s.session_date}</span>{" "}
                        <span className="tabular-nums text-xs text-muted-foreground">
                          {hhmm(s.start_time)}
                        </span>
                      </p>
                      {i === lastCoveredIndex && (
                        <p
                          className={`mt-1 border-s-2 ps-2 text-[11px] font-medium text-foreground ${voca ? "" : "border-klovers-yellow"}`}
                          style={voca ? { borderColor: VOCA_INK } : undefined}
                        >
                          {c.lastCovered}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {userId && (
            <div id="pay" className="scroll-mt-24">
              <StudentSelfService userId={userId} paymentOnly accent={voca ? VOCA_INK : undefined} />
            </div>
          )}

        </div>
      </main>
      {voca ? <VocaStudentFooter tr={tr} /> : <Footer />}
    </div>
  );
};

export default MyLessonsPage;
