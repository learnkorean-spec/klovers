import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Loader2, Video, AlertTriangle, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatMoney } from "@/types/students";

/**
 * What a private student sees: her own lessons, and nothing else.
 *
 * Every other student-facing page here is built around the Korean course — the
 * textbook, the vocabulary reviews, the Hangul games, the level ladder. None of
 * that belongs to a private student, and none of it belongs to an English one
 * at all. This page carries only the four facts such a student actually needs:
 * when her lessons are, how many are left, what she owes, and where to join.
 *
 * It reads the teaching roster directly. Until the migration that ships with
 * this page, those tables were admin-only and a private student could not see a
 * single row about her own lessons — true for the Korean students too, not just
 * the English one.
 *
 * A student with no roster row is not an error: she is an ordinary site
 * student who reached this URL. She is told so and sent back.
 */

const DAY_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COPY = {
  ar: {
    title: "حصصي",
    subtitle: "مواعيدك وباقتك في مكان واحد.",
    weekly: "ميعادك الأسبوعي",
    noWeekly: "لسه مافيش ميعاد أسبوعي مسجّل. كلّميني ونظبّطه.",
    bundle: "باقتك",
    noBundle: "مافيش باقة مسجّلة دلوقتي.",
    used: "اتاخد",
    left: "الباقي",
    ofN: "من",
    classes: "حصة",
    upcoming: "الحصص الجاية",
    noUpcoming: "مافيش حصص محجوزة دلوقتي.",
    join: "ادخل الحصة",
    owes: "عليكي دفعة مستحقة",
    pay: "ارفعي الإيصال",
    lastCovered: "دي آخر حصة في باقتك — اللي بعدها بداية باقة جديدة.",
    notPrivate: "الصفحة دي لطلبة الحصص الخاصة. حسابك مش مربوط بحصص خاصة.",
    backToDashboard: "ارجع لحسابك",
    loadFailed: "مقدرناش نحمّل بياناتك.",
    refresh: "حاول تاني",
  },
  en: {
    title: "My lessons",
    subtitle: "Your times and your bundle, in one place.",
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
    pay: "Upload the receipt",
    lastCovered: "This is the last lesson in your bundle — the next one starts a new bundle.",
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

const MyLessonsPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const c = isAr ? COPY.ar : COPY.en;
  const DAY = isAr ? DAY_AR : DAY_EN;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<RosterRow | null>(null);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [balance, setBalance] = useState<Balance | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [dueEnrollmentId, setDueEnrollmentId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/login"); return; }

        // RLS returns this student's own row and no other.
        const { data: ts, error: tsErr } = await supabase
          .from("teacher_students")
          .select("id, full_name, subject, meeting_url")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (tsErr) throw tsErr;

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

        setClasses((cls.data ?? []) as unknown as ClassRow[]);
        // The function is not SECURITY DEFINER, so RLS has already narrowed
        // this to her own bundles; the find is belt and braces.
        setBalance(
          ((bal.data ?? []) as unknown as Balance[]).find(b => b.student_id === row.id) ?? null,
        );
        setSessions((ses.data ?? []) as unknown as SessionRow[]);
        setDueEnrollmentId((enr.data as { id?: string } | null)?.id ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : c.loadFailed);
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
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
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

  return (
    <div className="min-h-screen" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-5">

          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {c.title} — {roster.full_name}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{c.subtitle}</p>
          </div>

          {dueEnrollmentId && (
            <Card className="border-amber-300 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-700">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
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
                      <span className="font-mono">{hhmm(cl.start_time)}</span>{" "}
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
                  onClick={() => window.open(roster.meeting_url!, "_blank", "noopener,noreferrer")}
                >
                  <Video className="h-4 w-4 mr-1.5" /> {c.join}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
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
                      className="h-full bg-primary"
                      style={{
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
              <CardTitle className="text-base flex items-center gap-2">
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
                        <span className="font-mono text-xs text-muted-foreground">
                          {hhmm(s.start_time)}
                        </span>
                      </p>
                      {i === lastCoveredIndex && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          {c.lastCovered}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MyLessonsPage;
