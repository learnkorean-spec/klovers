import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { drawPlacementCard, drawPlacementCertificate } from "@/lib/canvasRenderer";
import { SITE_URL, WHATSAPP_NUMBER } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp, logLeadEvent } from "@/lib/leadTracking";
import { track } from "@/lib/tracking";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toArabicDigits } from "@/lib/trustFigures";
import { BrandIcon } from "@/components/student-dashboard/premium/primitives";
import type { BrandIconName } from "@/lib/dashboardProgress";
import {
  CheckCircle, ArrowRight, ArrowLeft, Share2,
  Download, RefreshCw, Mic, Square, Play, RotateCcw, PenLine, Loader2,
  Target, Clock, Save, Ban,
} from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import ScholarshipMatches from "@/components/ScholarshipMatches";
import {
  EXAM_SECTIONS, EXAM_QUESTIONS, EXAM_MAX, EXAM_BOOK_KEY, gradeExam,
  type ExamQuestion, type ExamResult,
} from "@/constants/topikPapers";
import { TOPIK_GRADES, type TopikGrade } from "@/constants/topikPlacement";
import { SEJONG1_WRITING, SEJONG1_SPEAKING } from "@/constants/sejong1Placement";

/**
 * The Korean placement test — one test of fifty-two reading items, answered as
 * a TOPIK grade (급).
 *
 * The page briefly asked the student to choose between a TOPIK I paper and a
 * TOPIK II paper before the first question. That is asking her to place herself
 * before the placement test will place her, so the two banks are now a single
 * test, easiest first. The bank, the cut scores and the grading live in
 * topikPapers.ts; the copy for each grade lives in topikPlacement.ts. This file
 * only sequences and renders.
 *
 * Fifty-two questions is a lot to put in front of a beginner, and the page
 * answers that by handing her the decision rather than making it for her: from
 * section C onward there is a control that finishes the test on what she has
 * answered. Nothing ejects her mid-exam, which is the behaviour this page
 * removed and must not grow back.
 *
 * Two things must survive every future edit, because they are why the page is
 * public:
 *
 *   1. The lead funnel. Every `logLeadEvent` cta_label below is the same
 *      literal the page has always sent, so the funnel queries keep working
 *      across changes instead of splitting into before/after buckets.
 *      `source_type: "placement"` on `recommendation_shown` is not a typo — it
 *      is what historical rows use.
 *   2. `source: "placement_test"` on the leads insert. An RLS policy
 *      (20260404000001_placement_leads_anon_policy.sql) allows anonymous
 *      inserts ONLY with that exact string. Change it and every logged-out
 *      lead is silently rejected.
 */

const STORAGE_KEY = "klovers_placement_draft_v6"; // v6: one test, sectionsSeen stored
/**
 * A finished attempt that has nowhere to go yet, because the visitor was not
 * signed in when she finished it.
 *
 * This route is public on purpose — the lead funnel lives on it — but the save
 * has always been gated on `userId`, so a signed-out visitor answered every
 * question, was shown her level, and left no row behind. Between 22 Apr and
 * 10 Sep 2026 that discarded 16 finished attempts, roughly one in three, and
 * the opt-in email form on the result screen caught exactly one of them.
 *
 * The attempt is parked here instead and written the moment a session appears.
 * That is what makes the sign-in ask on the result screen worth pressing: it
 * saves work she has already done rather than asking her to repeat it.
 *
 * Raw answers are stored, not the graded result, so the replay grades through
 * the same `gradeExam` as everything else and there is one grader, not two.
 */
const PENDING_KEY = "klovers_placement_pending_v1";
/** A parked attempt older than this is dropped; retaking is cheap. */
const PENDING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const AUDIO_BUCKET = "placement-audio";

/**
 * The card / certificate / share row on the result screen, held back for now.
 *
 * Re asked for it to come off on 8 Sep. It is a flag rather than a deletion
 * because the three handlers and the canvas renderers behind them are intact
 * and the row is one boolean away from returning.
 *
 * There is a reason to leave it off until the copy is revisited: both images
 * are drawn with `score` out of `max`, and every student who finishes early —
 * including the person who says up front that she cannot read Hangul — would be
 * handed a certificate reading something over 52, a denominator counting
 * questions she was never asked.
 */
const SHOW_RESULT_SHARING = false;

const CIRCLED = ["①", "②", "③", "④"];
const FILLED = ["❶", "❷", "❸", "❹"];

/**
 * The id of one attempt, minted before the row is written.
 *
 * finish() and saveExtras() are different handlers minutes apart, and the
 * second has to reach the row the first wrote rather than open a second
 * attempt — so the id is made once and kept in state.
 *
 * unit_placement_tests.id is a uuid column. `crypto.randomUUID` is absent on
 * older Safari and on any non-secure origin, and the fallback that used to sit
 * inline in saveExtras() produced a timestamp-and-random string, which Postgres
 * would have rejected outright. The fallback below builds a real v4.
 */
const newAttemptId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const b = new Uint8Array(16);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(b);
  } else {
    for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  }
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const GRADE_META: Record<TopikGrade, { emoji: string; tagline: string }> = {
  pre1: { emoji: "", tagline: "Hangul Foundation" },
  g1: { emoji: "", tagline: "TOPIK Level 1" },
  g2: { emoji: "", tagline: "TOPIK Level 2" },
  g3: { emoji: "", tagline: "TOPIK Level 3" },
  g4: { emoji: "", tagline: "TOPIK Level 4" },
  above: { emoji: "", tagline: "Past 4급" },
};

/**
 * The levels the test measures, shown on the intro screen.
 *
 * Nothing else on the site tells a visitor what the result will look like, and
 * "we will tell you your level" is a weaker promise than showing the levels it
 * chooses between. The order is the order of the ladder.
 *
 * One of the six grades is deliberately absent. `above` is not a level — it is
 * the test saying it has run out of room — so listing it here would promise a
 * placement the result screen then refuses to make.
 */
const LADDER: { ko: string; ar: string; en: string; icon: BrandIconName }[] = [
  { ko: "한글 기초", ar: "تأسيس الهانغول", en: "Hangul", icon: "hangul-card" },
  { ko: "1급", ar: "المستوى الأول", en: "Level 1", icon: "flashcards" },
  { ko: "2급", ar: "المستوى الثاني", en: "Level 2", icon: "conversation" },
  { ko: "3급", ar: "المستوى الثالث", en: "Level 3", icon: "culture-fan" },
  { ko: "4급", ar: "المستوى الرابع", en: "Level 4", icon: "passport" },
];

/** Klovers library icon for each result (the UI never shows emoji). */
const GRADE_ICON: Record<TopikGrade, BrandIconName> = {
  pre1: "hangul-card",
  g1: "flashcards",
  g2: "conversation",
  g3: "culture-fan",
  g4: "passport",
  above: "trophy",
};

/** The story world that matches each result, shown on the result screen. */
const GRADE_WORLD: Record<TopikGrade, string> = {
  pre1: "world-hangul-village",
  g1: "world-vocabulary-market",
  g2: "world-conversation-cafe",
  g3: "world-culture-street",
  g4: "world-seoul-journey",
  above: "world-seoul-journey",
};

/** World names (KLOVERS_WORLD.worlds) for the result's scene line. */
const GRADE_WORLD_NAME: Record<TopikGrade, { en: string; ar: string }> = {
  pre1: { en: "Hangul Village", ar: "قرية الهانغول" },
  g1: { en: "Vocabulary Market", ar: "سوق المفردات" },
  g2: { en: "Conversation Café", ar: "مقهى المحادثة" },
  g3: { en: "Culture Street", ar: "شارع الثقافة" },
  g4: { en: "Seoul Journey", ar: "رحلة سيول" },
  above: { en: "Seoul Journey", ar: "رحلة سيول" },
};

const SECTION_IDS = EXAM_SECTIONS.map((s) => s.id);

type Phase = "intro" | "test" | "extras" | "result";

interface Draft {
  answers: Record<string, number>;
  step: number;
  startedAt: number;
  sectionsSeen: string[];
}

/** A finished attempt parked for a visitor who was not signed in. */
interface PendingAttempt {
  answers: Record<string, number>;
  sectionsSeen: string[];
  startedAt: number;
  finishedAt: number;
}

const KoreanPlacementPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  useSEO({
    title: isAr ? "اختبار تحديد المستوى في اللغة الكورية" : "Korean Placement Test",
    description: isAr
      ? "اختبار مجاني لتحديد المستوى في اللغة الكورية من كلوفرز: أسئلة قراءة بصيغ امتحان TOPIK تحدّد المستوى من تأسيس الهانغول حتى المستوى الرابع، مع ترشيح الدورة المناسبة."
      : "Take the free Klovers Korean placement test. Discover your TOPIK level and find the perfect course for your learning journey.",
    canonical: "https://kloversegy.com/placement-test",
  });

  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  /**
   * The sections the student has actually been shown, in order. This is the
   * difference between a question she got wrong and a question she was never
   * asked, and the result screen is unusable without it.
   */
  const [sectionsSeen, setSectionsSeen] = useState<string[]>([SECTION_IDS[0]]);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  /** The row finish() wrote, so the optional extras can update it. */
  const [attemptId, setAttemptId] = useState<string | null>(null);

  // Optional teacher-marked extras, logged-in students only
  const [writing, setWriting] = useState<Record<string, string>>({});
  const [audio, setAudio] = useState<Record<string, Blob>>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [savingExtras, setSavingExtras] = useState(false);
  const [extrasSaved, setExtrasSaved] = useState(false);

  // Lead capture
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);

  const questionsBySection = useMemo(() => {
    const map: Record<string, ExamQuestion[]> = {};
    for (const s of EXAM_SECTIONS) map[s.id] = [];
    for (const q of EXAM_QUESTIONS) map[q.section]?.push(q);
    return map;
  }, []);

  // ---- instrumentation ----------------------------------------------------
  useEffect(() => {
    logLeadEvent({ source_type: "placement_test", cta_label: "test_started" });
  }, []);
  useEffect(() => {
    if (phase === "test") {
      logLeadEvent({ source_type: "placement_test", cta_label: `band_${step + 1}_viewed`, metadata: { page: step } });
    }
  }, [step, phase]);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "placement-schema";
    // Arabic on /ar/placement-test, pointing at the Arabic URL (28 Sep 2026).
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": isAr ? "اختبار تحديد مستوى الكورية المجاني" : "Free Korean Language Placement Test",
      "description": isAr
        ? "اختبار مجاني لتحديد المستوى في اللغة الكورية من كلوفرز: أسئلة قراءة بصيغ امتحان TOPIK تحدّد المستوى من تأسيس الهانغول حتى المستوى الرابع، مع ترشيح الدورة المناسبة."
        : "Take the free Klovers Korean placement test to discover your TOPIK level and find the perfect course.",
      "url": isAr ? "https://kloversegy.com/ar/placement-test" : "https://kloversegy.com/placement-test",
      "inLanguage": isAr ? "ar" : "en",
      "provider": { "@id": "https://kloversegy.com/#organization" },
      "educationalAlignment": {
        "@type": "AlignmentObject",
        "educationalFramework": "TOPIK",
        "targetName": isAr ? "إتقان اللغة الكورية" : "Korean Language Proficiency"
      }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("placement-schema")?.remove(); };
  }, [isAr]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
    // A visitor who signs in from the result screen returns to this page with
    // the session arriving as an event — getSession() above has already run and
    // will not run again. Without this subscription a parked attempt would sit
    // unwritten until she happened to reload.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session ? session.user.id : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ---- draft --------------------------------------------------------------
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const d = JSON.parse(saved) as Draft;
        // A draft that cannot say which sections were shown cannot be graded:
        // the result would either credit the student with sections she never
        // reached or claim she got wrong the questions behind them. An
        // unreadable `sectionsSeen` is therefore a discarded draft, not a
        // repairable one.
        const seen = Array.isArray(d?.sectionsSeen)
          && d.sectionsSeen.length > 0
          && d.sectionsSeen.every((id) => SECTION_IDS.includes(id))
          ? d.sectionsSeen
          : null;
        if (seen && d?.answers && Object.keys(d.answers).length > 0) {
          setAnswers(d.answers);
          setSectionsSeen(seen);
          setStep(Math.min(Math.max(d.step ?? 0, 0), EXAM_SECTIONS.length - 1));
          setStartedAt(d.startedAt ?? Date.now());
          setPhase("test");
          toast({ title: isAr ? "تم استئناف الاختبار" : "Test resumed", description: isAr ? "استُعيد التقدّم السابق." : "Your previous progress has been restored." });
        }
      }
    } catch { /* ignore */ }
    // Older versions of this page wrote different shapes under these keys; a
    // stale one would restore nonsense into the new state machine.
    localStorage.removeItem("klovers_placement_draft");
    localStorage.removeItem("klovers_placement_draft_v2");
    localStorage.removeItem("klovers_placement_draft_v3");
    localStorage.removeItem("klovers_placement_draft_v4");
    localStorage.removeItem("klovers_placement_draft_v5");
    localStorage.removeItem("klovers_unit_placement_draft_v1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "test") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, step, startedAt, sectionsSeen } satisfies Draft));
    } catch { /* ignore */ }
  }, [answers, phase, step, startedAt, sectionsSeen]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, phase]);

  // ---- audio --------------------------------------------------------------
  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    setRecordingId(null);
  };
  useEffect(() => () => stopRecording(), []);

  const startRecording = async (promptId: string) => {
    setMicError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError(isAr
        ? "لا يدعم هذا المتصفح التسجيل الصوتي. يمكن تخطّي هذا القسم، وستقيّمه المعلّمة في الحصة."
        : "This browser cannot record audio. Skip this part, your teacher will assess it live.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        setAudio((prev) => ({ ...prev, [promptId]: blob }));
      };
      rec.start();
      recorderRef.current = rec;
      setRecordingId(promptId);
    } catch {
      setMicError(isAr
        ? "تعذّر الوصول إلى الميكروفون. يُرجى السماح للمتصفح باستخدامه، أو تخطّي هذا القسم."
        : "Microphone access was denied. Allow it, or skip this part.");
      setRecordingId(null);
    }
  };

  const playBack = (promptId: string) => {
    const blob = audio[promptId];
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const el = new Audio(url);
    el.onended = () => URL.revokeObjectURL(url);
    void el.play();
  };

  // ---- persistence --------------------------------------------------------
  /**
   * Write a finished attempt: the placement row, the level on the profile, and
   * the per-item attempt.
   *
   * Split out of finish() because it now has two callers — finish() itself for
   * a student who was already signed in, and the effect below, which flushes an
   * attempt parked while she was not.
   */
  const persistAttempt = async (
    uid: string,
    res: ExamResult,
    finalAnswers: Record<string, number>,
    durationSeconds: number,
  ) => {
    const info = TOPIK_GRADES[res.grade];

    // `max_score` is what she was actually asked, which is not always 52: a
    // student who finishes early is scored out of the sections she saw. It is
    // stored because the admin table cannot otherwise tell a 23 out of 52
    // from a 23 out of 30 on the old bank, and printed both as "/30".
    const { error } = await supabase.from("placement_tests").insert({
      user_id: uid, score: res.score, level: info.levelKey, max_score: res.attempted,
    } as any);
    if (!error) {
      // course_level_key is the canonical, machine-set column. profiles.level
      // is the learner's own free-form self-assessment and stays untouched.
      // A trigger normalises the value on the way in, so `l2` is stored as
      // `level_2`; both are the same row of course_levels.
      const { error: profileError } = await supabase.from("profiles").update({ course_level_key: info.levelKey } as any).eq("user_id", uid);
      // The placement row is already written, so a failed profile update
      // costs the student nothing they can see; the next attempt corrects it.
      if (profileError) { /* nothing the student can act on */ }
    }

    // The attempt itself: which item she answered and how, section by
    // section. This used to be written only if she went on to add writing and
    // voice — three deliberate clicks, never once taken — so every attempt
    // before 9 Sep survives as a bare score with no way to see what she
    // missed. saveExtras() updates this row rather than opening a second one.
    const id = newAttemptId();
    const { error: attemptError } = await (supabase as any).from("unit_placement_tests").insert({
      id,
      user_id: uid,
      book: EXAM_BOOK_KEY,
      section_scores: res.sectionScores,
      mcq_score: res.score,
      start_unit: res.grade,
      // No section can fail on its own any more, so there is nothing to name
      // here; the column stays for the rows written before today.
      failed_section: null,
      suggested_level_key: info.levelKey,
      answers: finalAnswers,
      writing: [],
      speaking_audio: [],
      duration_seconds: durationSeconds,
    });
    if (!attemptError) setAttemptId(id);
  };

  /**
   * The moment a session appears, write anything parked — then show it, because
   * a student who signed in to save her result expects to land back on it.
   *
   * The blob is cleared before the write rather than after it. A stale or
   * unreadable one must not be retried on every mount, and a successful write
   * must not be repeated if this effect runs twice; the cost of clearing first
   * is that a write failing mid-flight loses the attempt, which is exactly
   * where it stood before this existed.
   */
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      let parked: PendingAttempt | null = null;
      try {
        const raw = localStorage.getItem(PENDING_KEY);
        if (raw) parked = JSON.parse(raw) as PendingAttempt;
      } catch { /* an unreadable blob is a discarded one */ }
      if (!parked) return;

      // An empty `sectionsSeen` is legitimate here and must stay allowed: it is
      // the student who said up front she cannot read Hangul and was shown no
      // questions at all.
      const usable =
        typeof parked.finishedAt === "number"
        && Date.now() - parked.finishedAt < PENDING_MAX_AGE_MS
        && !!parked.answers && typeof parked.answers === "object"
        && Array.isArray(parked.sectionsSeen)
        && parked.sectionsSeen.every((id) => SECTION_IDS.includes(id));

      try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
      if (!usable || cancelled) return;

      const res = gradeExam(parked.answers, parked.sectionsSeen);
      await persistAttempt(
        userId, res, parked.answers,
        Math.max(0, Math.round((parked.finishedAt - parked.startedAt) / 1000)),
      );
      if (cancelled) return;
      setResult(res);
      setSectionsSeen(parked.sectionsSeen);
      setPhase("result");
      toast({
        title: isAr ? "حُفظت النتيجة" : "Your result is saved",
        description: isAr
          ? "هذه نتيجة الاختبار الذي أُنجز للتو، وقد سُجّلت في الحساب."
          : "This is the test you just took, now on your account.",
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // ---- flow ---------------------------------------------------------------
  /**
   * `seen` is passed in rather than read from state because both callers know
   * something state does not yet: the stop button finishes on the sections
   * shown so far, and the student who cannot read Hangul was shown none.
   */
  const finish = async (finalAnswers: Record<string, number>, seen: string[]) => {
    const res = gradeExam(finalAnswers, seen);
    const info = TOPIK_GRADES[res.grade];
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }

    // Result first, network second — a slow insert must never hold up the
    // thing the student came for.
    setResult(res);
    setPhase("result");
    track.custom("placement_recommendation_shown", { level: info.levelKey, score: res.score });
    logLeadEvent({ source_type: "placement", cta_label: "recommendation_shown", metadata: { level: info.levelKey, score: res.score } });

    if (userId) {
      await persistAttempt(userId, res, finalAnswers, Math.round((Date.now() - startedAt) / 1000));
    } else {
      // Park it. She has answered everything; the only thing missing is an
      // account to hang it on, and the effect above writes it the moment she
      // signs in — from the result screen, or days later in another tab.
      try {
        localStorage.setItem(PENDING_KEY, JSON.stringify({
          answers: finalAnswers, sectionsSeen: seen, startedAt, finishedAt: Date.now(),
        } satisfies PendingAttempt));
      } catch { /* a browser refusing storage costs her the save, not the result */ }
    }
  };

  const nextSection = () => {
    // Nothing is graded until the last section is behind them. The level comes
    // from the total, so there is no question this point in the test could
    // answer, and stopping someone here is the behaviour this page removed.
    if (step < EXAM_SECTIONS.length - 1) {
      const nextId = EXAM_SECTIONS[step + 1].id;
      setSectionsSeen((prev) => (prev.includes(nextId) ? prev : [...prev, nextId]));
      setStep(step + 1);
      return;
    }
    void finish(answers, sectionsSeen);
  };

  /**
   * Beginning the test is also where the funnel learns she got past the intro.
   *
   * This is the event that used to be `paper_chosen`, relabelled now that there
   * is no paper to choose. It stays a label of its own rather than becoming a
   * second `test_started`: the mount-time event has five months behind it and
   * means "reached the placement page", so sending it again here would quietly
   * double its volume and change what every query written against it returns.
   */
  const startTest = () => {
    logLeadEvent({ source_type: "placement_test", cta_label: "test_begun" });
    setAnswers({});
    setResult(null);
    setStep(0);
    setSectionsSeen([SECTION_IDS[0]]);
    setStartedAt(Date.now());
    setAttemptId(null);
    setPhase("test");
  };

  /**
   * The way out for someone who cannot read Hangul at all.
   *
   * The funnel is unambiguous about where this test loses people: 82 sessions
   * reached the first question screen and 32 reached the second. An unanswered
   * test grades to 한글 기초; this button produces the same answer without
   * making them guess their way through it first, and lands them on the result
   * screen, where the trial CTA and the email capture live. No section is
   * recorded as seen, so the breakdown does not report a score on questions
   * that were never put in front of her.
   */
  const handleCannotReadHangul = () => {
    logLeadEvent({ source_type: "placement_test", cta_label: "cannot_read_hangul" });
    void finish({}, []);
  };

  /**
   * Finishing on what she has answered, offered from section C onward.
   *
   * The event is separate from `recommendation_shown` because the two ask
   * different questions of the funnel: one counts results delivered, this one
   * counts the students for whom fifty-two questions was more test than they
   * needed, and where in the test that became true.
   */
  const stopHere = (sectionId: string) => {
    logLeadEvent({ source_type: "placement_test", cta_label: "stopped_early", metadata: { section: sectionId } });
    void finish(answers, sectionsSeen);
  };

  const handleRetake = () => {
    setAnswers({}); setResult(null); setStep(0);
    setSectionsSeen([SECTION_IDS[0]]);
    setWriting({}); setAudio({}); setExtrasSaved(false);
    setLeadSaved(false); setLeadName(""); setLeadEmail("");
    setStartedAt(Date.now());
    // A retake is a new attempt, and must not write its extras over the row the
    // previous one left behind.
    setAttemptId(null);
    setPhase("test");
  };

  // ---- result-screen actions (funnel-critical literals) --------------------
  const handleShare = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const text = isAr
      ? `أُنجز اختبار تحديد المستوى في اللغة الكورية من كلوفرز.\nالمستوى: ${info.labelAr}\nالاختبار متاح مجانًا: ${SITE_URL}/placement-test`
      : `I took the Klovers Korean Placement Test!\nMy level: ${info.labelEn}\nFind yours → ${SITE_URL}/placement-test`;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: isAr ? "تم النسخ!" : "Copied to clipboard!", description: isAr ? "أصبحت مشاركة المستوى مع الأصدقاء متاحة." : "Share your level with friends." }))
      .catch(() => toast({ title: `${SITE_URL}/placement-test`, description: isAr ? "يمكن نسخ الرابط لمشاركة النتيجة." : "Copy the link to share your result." }));
  };

  const handleWhatsAppEnroll = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const text = encodeURIComponent(isAr
      ? `مرحبًا، أُنجز اختبار تحديد المستوى والنتيجة: ${info.labelAr}. ما خطوات الحجز؟`
      : `Hello! I finished the placement test and my level is: ${info.labelEn}. Can I book a place?`);
    trackAndOpenWhatsApp(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, { cta_label: "placement_enroll", metadata: { level: info.levelKey, score: res.score } });
  };

  const handleDownloadCard = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const meta = GRADE_META[res.grade];
    const canvas = document.createElement("canvas");
    drawPlacementCard(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: isAr ? info.labelKo : `${info.labelKo}: ${info.labelEn}`,
      tagline: isAr ? info.labelAr : meta.tagline,
      score: res.score,
      total: res.max,
      lang: isAr ? "ar" : "en",
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-${res.grade}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل البطاقة!" : "Card downloaded!", description: isAr ? "يمكن مشاركة المستوى على مواقع التواصل." : "Share your level on social media." });
  };

  const handleDownloadCertificate = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const meta = GRADE_META[res.grade];
    const canvas = document.createElement("canvas");
    drawPlacementCertificate(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: isAr ? info.labelKo : `${info.labelKo}: ${info.labelEn}`,
      tagline: isAr ? info.labelAr : meta.tagline,
      score: res.score,
      total: res.max,
      date: new Date().toLocaleDateString(isAr ? "ar-EG" : "en-GB", { day: "numeric", month: "long", year: "numeric" }),
      lang: isAr ? "ar" : "en",
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-certificate-${res.grade}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل الشهادة!" : "Certificate downloaded!", description: isAr ? "يمكن مشاركة الإنجاز على لينكدإن أو في السيرة الذاتية." : "Share your achievement on LinkedIn or CV." });
  };

  const handleLeadSubmit = async () => {
    if (!leadName.trim() || !leadEmail.trim()) {
      toast({ title: isAr ? "يُرجى إدخال الاسم والبريد الإلكتروني." : "Please enter your name and email.", variant: "destructive" }); return;
    }
    setLeadSaving(true);
    const levelKey = result ? TOPIK_GRADES[result.grade].levelKey : "";
    // `source` must stay exactly "placement_test": the anon INSERT policy on
    // public.leads checks that literal, so any other value is rejected by RLS.
    const { error } = await supabase.from("leads").insert({
      name: leadName.trim(),
      email: leadEmail.trim(),
      level: levelKey,
      source: "placement_test",
      status: "new",
    });
    setLeadSaving(false);
    if (error) {
      toast({ title: isAr ? "تعذّر الحفظ. يُرجى المحاولة مرة أخرى." : "We could not save that. Please try again.", variant: "destructive" });
      return;
    }
    setLeadSaved(true);
    track.custom("placement_lead_captured", { level: levelKey });
    logLeadEvent({ source_type: "email", cta_label: "placement_study_plan", metadata: { level: levelKey } });
  };

  const saveExtras = async () => {
    if (!userId || !result) return;
    setSavingExtras(true);
    // finish() already opened the attempt and kept its id. The extras are an
    // update to that row, not a second attempt — the self-UPDATE policy on
    // unit_placement_tests allows it until a teacher has marked it. The insert
    // below is the fallback for the case where finish()'s own insert failed:
    // better a row holding only the extras than no row at all.
    const id = attemptId ?? newAttemptId();

    const speaking: { id: string; prompt: string; path: string }[] = [];
    for (const p of SEJONG1_SPEAKING) {
      const blob = audio[p.id];
      if (!blob) continue;
      const path = `${userId}/${id}/${p.id}.webm`;
      const { error } = await supabase.storage.from(AUDIO_BUCKET)
        .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true });
      if (error) continue; // one failed clip must not cost the whole attempt
      speaking.push({ id: p.id, prompt: p.ko, path });
    }

    const writingRows = SEJONG1_WRITING
      .filter((p) => (writing[p.id] || "").trim().length > 0)
      .map((p) => ({ id: p.id, prompt: p.ko, text: writing[p.id].trim() }));

    const extras = { writing: writingRows, speaking_audio: speaking };

    const { error } = attemptId
      ? await (supabase as any).from("unit_placement_tests").update(extras).eq("id", attemptId)
      : await (supabase as any).from("unit_placement_tests").insert({
          id,
          user_id: userId,
          book: EXAM_BOOK_KEY,
          section_scores: result.sectionScores,
          mcq_score: result.score,
          start_unit: result.grade,
          failed_section: null,
          suggested_level_key: TOPIK_GRADES[result.grade].levelKey,
          answers,
          ...extras,
          duration_seconds: Math.round((Date.now() - startedAt) / 1000),
        });

    setSavingExtras(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "لم يتم الحفظ" : "Could not save", description: isAr ? "يُرجى المحاولة مرة أخرى." : "Please try again." });
      return;
    }
    if (!attemptId) setAttemptId(id);
    setExtrasSaved(true);
  };

  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ---- question renderer ---------------------------------------------------
  const renderQuestion = (q: ExamQuestion) => (
    <div key={q.id} className="space-y-2">
      {q.group && (
        <p className="pt-4 text-sm font-semibold" dir="ltr">{q.group}</p>
      )}
      {q.bogi && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5" dir="ltr">
          <p className="text-xs text-muted-foreground">&lt;보기&gt;</p>
          <p className="text-sm">{q.bogi.stem}</p>
          <p className="text-sm">
            {q.bogi.options.map((o, i) => (
              <span key={i} className={cn("mr-4", i === q.bogi!.answerIndex && "font-bold")}>
                {i === q.bogi!.answerIndex ? FILLED[i] : CIRCLED[i]} {o}
              </span>
            ))}
          </p>
        </div>
      )}
      {q.passage && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1" dir="ltr">
          {q.passage.split("\n").map((line, i) => (
            <p key={i} className="text-sm leading-relaxed">{line}</p>
          ))}
        </div>
      )}
      <p className="text-sm font-medium" dir="ltr">
        <span className="text-muted-foreground mr-1.5">{q.id}.</span>
        {q.stem.split("\n").map((line, li) => (
          <span key={li} className={li > 0 ? "block ml-6" : undefined}>{line}</span>
        ))}
      </p>
      {q.hintAr && isAr && (
        <p className="text-xs text-muted-foreground border-r-2 border-primary/40 pr-2" dir="rtl">{q.hintAr}</p>
      )}
      <RadioGroup
        value={answers[q.id]?.toString()}
        onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v, 10) }))}
        className="space-y-1.5 ml-1"
        dir="ltr"
      >
        {q.options.map((opt, oi) => (
          <div key={oi} className="flex items-center space-x-3">
            <RadioGroupItem value={oi.toString()} id={`${q.id}-o${oi}`} />
            <Label htmlFor={`${q.id}-o${oi}`} className="cursor-pointer text-sm">
              <span className="text-muted-foreground mr-1 text-xs">{CIRCLED[oi]}</span> {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );

  // ---- intro ---------------------------------------------------------------
  if (phase === "intro") {
    const FEATURES = [
      { icon: Target, text: t("أسئلة بصيغ امتحان TOPIK الحقيقي", "Questions in the real TOPIK reading formats") },
      { icon: Clock,  text: t("٥٢ سؤالًا، مع إمكانية الإنهاء مبكرًا", `${EXAM_MAX} questions, and you can finish early`) },
      { icon: Save,   text: t("الإغلاق والعودة لاحقًا: التقدّم محفوظ", "Close it and come back, saved") },
      { icon: Ban,    text: t("دون قاموس أو مترجم", "No dictionary, no translator") },
    ];

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        {/* pt-24 clears the fixed h-16 header, items-center puts the card in the
            middle of what is left. */}
        <main id="main-content" className="flex-1 flex items-center justify-center px-4 pt-24 pb-14">
          <div className="relative w-full max-w-2xl">

            {/* Same texture the homepage CTA that sends people here uses, so the
                page they land on looks like the page they came from. */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
              {["한", "국", "어", "급"].map((char, i) => (
                <span
                  key={char}
                  className="absolute text-6xl font-bold text-charcoal/[0.06] dark:text-klovers-yellow/[0.07]"
                  style={{ top: `${8 + i * 24}%`, left: `${4 + i * 24}%`, transform: `rotate(${-14 + i * 9}deg)` }}
                >
                  {char}
                </span>
              ))}
            </div>

            <Card dir={isAr ? "rtl" : "ltr"} className="relative overflow-hidden border-border/70 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />
              {/* Story art from sm up only: on a phone the card is already long,
                  and nothing may push "Start the test" further down. */}
              <img
                src="/assets/story/world-hangul-village.webp"
                alt={isAr ? "قرية الهانغول، أول محطة في رحلة كلوفرز" : "Hangul Village, the first stop on the Klovers journey"}
                width={1600}
                height={900}
                decoding="async"
                className="hidden sm:block w-full aspect-[16/6] object-cover"
              />
              <CardContent className="pt-8 pb-7 space-y-7">

                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-klovers-yellow border border-charcoal/15 px-4 py-1.5 rounded-full text-xs font-semibold text-charcoal">
                    <KloverIcon name="lightbulb-sprout" className="h-3.5 w-3.5" />
                    {t("قرية الهانغول · مجاني ودون تسجيل", "Hangul Village · free, no sign-up")}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                    {t("تحديد المستوى في اللغة الكورية", "Find your Korean level")}
                  </h1>

                  {/* World mode: the test is the gate of Hangul Village. */}
                  <p className="text-sm font-semibold text-foreground max-w-md mx-auto leading-relaxed">
                    {t("عند بوابة قرية الهانغول، كلّ لافتة سؤال. ما يُقرأ منها يكشف أين تبدأ الرحلة.",
                       "At the gate of Hangul Village, every signboard is a question. What you can read shows where your journey begins.")}
                  </p>

                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {t("أسئلة قراءة بصيغ امتحان TOPIK الحقيقي: اختبار واحد من ٥٢ سؤالًا، يبدأ بالأسهل ويغطّي المستويات من الأول إلى الرابع، ويمكن إنهاؤه في أي لحظة بعد أن تتجاوز الأسئلةُ المستوى الحالي.",
                       `Reading questions in the real TOPIK formats. One test of ${EXAM_MAX} questions, easiest first, covering levels 1 to 4, and once the questions are past you, you can finish it yourself.`)}
                  </p>
                </div>

                {/* What the test can answer. Shown before they start, because a
                    named result is a clearer promise than "we'll tell you". */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground text-center mb-3">
                    {t("المستويات التي يقيسها هذا الاختبار", "THE LEVELS THIS TEST MEASURES")}
                  </p>
                  {/* Three across on a phone and five once there is room: five
                      cells at phone width leave each one too narrow for
                      "المستوى الثالث" to sit on a single line. */}
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {LADDER.map((l) => (
                      <div
                        key={l.ko}
                        className="rounded-xl border border-border bg-muted/40 px-2 py-3 text-center space-y-1"
                      >
                        <BrandIcon name={l.icon} className="h-7 w-7 mx-auto" eager />
                        <div className="text-sm font-bold leading-tight" dir="ltr">{l.ko}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {isAr ? l.ar : l.en}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    {t("الإجابة عمّا يمكن الإجابة عنه، والمجموع هو ما يحدّد المستوى، تمامًا كدرجات القطع في TOPIK نفسه. لا يوجد قسم يُنهي الاختبار فجأة.",
                       "You answer what you can and your total decides the level, the way TOPIK's own cut scores work. No section ends the test on you.")}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {FEATURES.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm font-medium">
                      <Icon className="h-4 w-4 text-charcoal dark:text-klovers-yellow shrink-0" />
                      <span className="leading-snug">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Said before the test rather than after it. A visitor who
                    signs in now is never asked again on the result screen, and
                    her attempt is written the instant she finishes instead of
                    being parked. It is a link, not a wall: the test below still
                    starts without an account. */}
                {!userId && (
                  <button
                    type="button"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent("/placement-test")}`)}
                    className="w-full text-start rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 hover:border-primary/60 transition-colors"
                  >
                    <span className="block text-sm font-bold leading-snug">
                      {t("تسجيل الدخول أولًا لحفظ النتيجة",
                         "Sign in first so your result is saved")}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-snug mt-0.5">
                      {t("يمكن البدء دون تسجيل، وسيظهر هذا الخيار مجددًا في النهاية.",
                         "You can start without it, we'll ask again at the end.")}
                    </span>
                  </button>
                )}

                {/* One button, because there is now one test. The second choice
                    below it is not a variant of the test — it is the answer for
                    the student the first question would already be too hard for,
                    and it is styled quietly so it reads as a way out rather than
                    a competing option. */}
                <div className="space-y-2.5 pt-1">
                  <Button size="lg" className="w-full font-semibold" onClick={startTest}>
                    {t("بدء الاختبار", "Start the test")}
                    <ArrowRight className={cn("h-4 w-4 ms-1.5", isAr && "rotate-180")} />
                  </Button>

                  <button
                    type="button"
                    onClick={handleCannotReadHangul}
                    className="w-full text-start rounded-xl border border-border bg-muted/40 px-4 py-3 hover:border-primary/60 transition-colors"
                  >
                    <span className="block text-sm font-bold leading-snug">
                      {t("لا أستطيع قراءة الهانغول بعد: عرض مستواي",
                         "I can't read Hangul yet, show me my level")}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-snug mt-0.5">
                      {t("دون أسئلة: انتقال مباشر إلى النتيجة.",
                         "No questions, this takes you straight to your result.")}
                    </span>
                  </button>
                </div>

              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- result -------------------------------------------------------------
  if (phase === "result" && result) {
    const info = TOPIK_GRADES[result.grade];
    const seenSections = EXAM_SECTIONS.filter((s) => result.sectionsSeen.includes(s.id));
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 pt-24 pb-14 max-w-xl mx-auto w-full space-y-4">
          <Card dir={isAr ? "rtl" : "ltr"} className="overflow-hidden">
            <img
              src={`/assets/story/${GRADE_WORLD[result.grade]}.webp`}
              alt={isAr ? "عالم القصة الذي يبدأ منه هذا المستوى" : "The story world where your level begins"}
              width={1600}
              height={900}
              decoding="async"
              className="w-full aspect-[16/6] object-cover"
            />
            <CardContent className="pt-6 space-y-5">
              {/* World mode: one scene line naming the world this level opens. */}
              <p className="text-sm font-semibold text-center text-foreground">
                {isAr
                  ? `يبدأ الطريق في عالم كلوفرز من ${GRADE_WORLD_NAME[result.grade].ar}.`
                  : `Your road through the Klovers world begins in ${GRADE_WORLD_NAME[result.grade].en}.`}
              </p>
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-2">
                <BrandIcon name={GRADE_ICON[result.grade]} className="h-12 w-12 mx-auto" eager />
                <p className="text-sm text-muted-foreground">{t("المستوى:", "Your level")}</p>
                <p className="text-3xl font-bold" dir="ltr">{info.labelKo}</p>
                <p className="text-sm font-medium">{isAr ? info.labelAr : info.labelEn}</p>
                <p className="text-sm text-muted-foreground">{isAr ? info.noteAr : info.noteEn}</p>
              </div>

              {/* The breakdown is skipped for the student who was never shown a
                  question: a table of nothing over a total of "0 / 0" is not
                  information, and her grade note already says what happened. */}
              {result.attempted > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">{t("تفصيل الإجابات", "Answer breakdown")}</p>
                  {/* Out of what she was asked, never out of 52. Nobody should be
                      told they got wrong a question they never saw. */}
                  <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm mb-1.5">
                    <span className="font-semibold">{t("المجموع", "Total")}</span>
                    <Badge dir="ltr">{isAr ? toArabicDigits(`${result.score} / ${result.attempted}`) : `${result.score} / ${result.attempted}`}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {seenSections.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span>{isAr ? s.titleAr : s.titleEn}</span>
                        <Badge variant="secondary" dir="ltr">{isAr ? toArabicDigits(`${result.sectionScores[s.id] ?? 0} / ${s.max}`) : `${result.sectionScores[s.id] ?? 0} / ${s.max}`}</Badge>
                      </div>
                    ))}
                  </div>
                  {result.stoppedEarly && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("انتهى الاختبار هنا باختيارك، وحُسب هذا المستوى من الأقسام التي أُجيب عنها فعلًا.",
                         "You chose to finish here, and this level is worked out from the sections you actually answered.")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("تحدّد المستوى من مجموع الدرجات في الأقسام المعروضة، بالطريقة نفسها التي يقارن بها TOPIK المجموعَ بدرجة القطع.",
                       "Your level comes from your total across the sections you were shown, the same way TOPIK measures a total against a cut score.")}
                  </p>
                </div>
              )}

              {/* Which scholarships this level can reach (4 Oct 2026). It sits
                  ABOVE the sign-in ask on purpose: it is the reason to press
                  that button, and the reason is stronger than the promise. A
                  visitor gets the six programme names and a lock where the
                  verdict goes — the names and the official facts are public on
                  /scholarships either way; what an account buys is the match.
                  The stage chips are asked here because the level alone cannot
                  answer them: the undergraduate GKS disqualifies anyone who
                  already holds a degree. */}
              <ScholarshipMatches
                levelKey={info.levelKey}
                signedIn={!!userId}
                levelLabel={isAr ? info.labelAr : info.labelEn}
              />

              {/* The first ask for a visitor who is not signed in, and the only
                  one that saves anything. Her answers are already parked in
                  localStorage by finish(); signing in writes them, sets the
                  level on her profile, and turns on the group-times button
                  below. The email form under it stays as the lighter
                  alternative — it captured one lead in three months, so it is no
                  longer the only thing offered here. */}
              {!userId && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      {t("حفظ النتيجة", "Save your result")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("بعد تسجيل الدخول تُحفظ هذه الإجابات في الحساب مباشرة، ويصبح اختيار موعد المجموعة متاحًا. ودون ذلك لا تُسجَّل هذه النتيجة لدينا.",
                         "Sign in and the answers you just gave are saved to your account, so you can pick your group time. Without it, this result is not recorded.")}
                    </p>
                  </div>
                  <Button className="w-full" size="sm"
                    onClick={() => navigate(`/login?redirect=${encodeURIComponent("/placement-test")}`)}>
                    {t("تسجيل الدخول وحفظ النتيجة", "Sign in and save my result")}
                  </Button>
                </div>
              )}

              {/* Email capture, for the visitor who will not make an account.
                  It saves a lead, not the attempt — the copy now says so. */}
              {!userId && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  {leadSaved ? (
                    <div className="text-center py-2 space-y-2">
                      <CheckCircle className="h-9 w-9 fill-klovers-green text-charcoal mx-auto" />
                      <p className="font-semibold text-sm">{t("ستصل الخطة قريبًا.", "We'll send your plan shortly!")}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-sm">
                          {t("إنشاء الحساب ليس مناسبًا الآن؟", "Not ready to make an account?")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr
                            ? `يكفي ترك الاسم والبريد الإلكتروني لتصل خطة مخصّصة لمستوى ${info.labelAr}. (الإجابات نفسها لن تُحفظ.)`
                            : `Leave your name and email and we'll send a plan built for ${info.labelEn}. (Your answers themselves are not saved.)`}
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input placeholder={t("الاسم", "Your name")} value={leadName} onChange={e => setLeadName(e.target.value)} />
                        <Input placeholder={t("البريد الإلكتروني", "Your email")} type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} />
                      </div>
                      <Button className="w-full" size="sm" onClick={handleLeadSubmit} disabled={leadSaving}>
                        {leadSaving ? t("جارٍ الإرسال...", "Sending…") : t("إرسال الخطة", "Send me the plan")}
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* The result screen used to end at a generic /free-trial link that
                  carried nothing the test had just worked out. A logged-in
                  student has a level on her profile by this point -- finish()
                  writes course_level_key a few lines up -- and /dashboard/schedule
                  filters the group packages by exactly that column, so she can be
                  sent straight to the times for her own level instead of being
                  told what it is and left there. A logged-out visitor has no
                  profile to filter by, so for her the trial stays the first ask. */}
              <div className="flex flex-wrap gap-2">
                {userId && (
                  <Button size="sm" onClick={() => navigate("/dashboard/schedule")}
                    className="flex-1 min-w-[9rem] font-semibold">
                    {t("اختيار موعد المجموعة", "Pick your group time")}
                  </Button>
                )}
                <Button size="sm" variant={userId ? "outline" : "default"} onClick={() => navigate("/free-trial")}
                  className="flex-1 min-w-[9rem] font-semibold">
                  {t("حجز الحصة التجريبية المجانية", "Book My Free Trial")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 min-w-[9rem]" onClick={() => handleWhatsAppEnroll(result)}>
                  {t("التواصل عبر واتساب", "WhatsApp us")}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {SHOW_RESULT_SHARING && (
                  <>
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleDownloadCard(result)}>
                      <Download className="h-3.5 w-3.5" /> {t("بطاقة", "Card")}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleDownloadCertificate(result)}>
                      <Download className="h-3.5 w-3.5" /> {t("شهادة", "Certificate")}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1.5" onClick={() => handleShare(result)}>
                      <Share2 className="h-3.5 w-3.5" /> {t("مشاركة", "Share")}
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" className="flex-1 text-xs gap-1.5" onClick={handleRetake}>
                  <RefreshCw className="h-3.5 w-3.5" /> {t("إعادة الاختبار", "Retake")}
                </Button>
              </div>

              {userId && !extrasSaved && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-2">
                  <p className="font-semibold flex items-center gap-2"><PenLine className="h-4 w-4" />
                    {t("تقييم أدق؟", "Want a sharper placement?")}</p>
                  <p className="text-muted-foreground">
                    {t("إضافة عيّنة كتابة وتسجيل صوتي قصير تراجعهما المعلّمة قبل أول حصة. خطوة اختيارية تمامًا.",
                       "Add a short writing sample and a voice recording for your teacher to review before your first class. Entirely optional.")}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setPhase("extras")}>
                    {t("إضافة الكتابة والصوت", "Add writing and voice")}
                  </Button>
                </div>
              )}
              {extrasSaved && (
                <p className="text-sm text-charcoal dark:text-foreground bg-klovers-green/15 border border-klovers-green rounded-lg p-3">
                  {t("حُفظت للمعلّمة. شكرًا.", "Saved for your teacher. Thank you!")}
                </p>
              )}
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- extras (logged-in only) -------------------------------------------
  if (phase === "extras") {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main id="main-content" className="flex-1 px-4 pt-24 pb-14 max-w-xl mx-auto w-full space-y-4">
          <div ref={topRef} />
          <Card dir={isAr ? "rtl" : "ltr"}>
            <CardContent className="pt-6 space-y-5">
              <h2 className="text-lg font-bold">{t("الكتابة والصوت للمعلّمة", "Writing and voice: for your teacher")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("لا يوجد تصحيح آلي هنا؛ المعلّمة هي من تراجع.", "Nothing here is auto-graded. Your teacher reviews it.")}
              </p>

              {SEJONG1_WRITING.map((p) => (
                <div key={p.id} className="space-y-1.5">
                  <p className="text-sm font-medium" dir="ltr">{p.id}. {p.ko}</p>
                  {isAr && <p className="text-xs text-muted-foreground" dir="rtl">{p.ar}</p>}
                  {p.useKo && <p className="text-xs text-muted-foreground" dir="ltr">※ {p.useKo}</p>}
                  <Textarea dir="ltr" rows={3} lang="ko" placeholder="한국어로 쓰세요…"
                    value={writing[p.id] || ""}
                    onChange={(e) => setWriting((prev) => ({ ...prev, [p.id]: e.target.value }))} />
                </div>
              ))}

              {micError && (
                <p className="text-sm text-charcoal dark:text-foreground bg-wrong-graphic/15 border border-wrong-graphic rounded-lg p-3">{micError}</p>
              )}
              {SEJONG1_SPEAKING.map((p) => {
                const recorded = !!audio[p.id];
                const isRec = recordingId === p.id;
                return (
                  <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-sm font-medium" dir="ltr">{p.id}. {p.ko}</p>
                    {isAr && <p className="text-xs text-muted-foreground" dir="rtl">{p.ar}</p>}
                    <div className="flex flex-wrap gap-2">
                      {!isRec ? (
                        <Button type="button" size="sm" variant={recorded ? "outline" : "default"}
                          onClick={() => startRecording(p.id)} disabled={recordingId !== null}>
                          {recorded ? <RotateCcw className="h-3.5 w-3.5 me-1.5" /> : <Mic className="h-3.5 w-3.5 me-1.5" />}
                          {recorded ? t("إعادة التسجيل", "Re-record") : t("تسجيل", "Record")}
                        </Button>
                      ) : (
                        <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                          <Square className="h-3.5 w-3.5 me-1.5" /> {t("إيقاف", "Stop")}
                        </Button>
                      )}
                      {recorded && !isRec && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => playBack(p.id)}>
                          <Play className="h-3.5 w-3.5 me-1.5" /> {t("تشغيل", "Play")}
                        </Button>
                      )}
                      {recorded && <Badge variant="secondary" className="self-center">{t("مُسجَّل", "Recorded")}</Badge>}
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <Button onClick={saveExtras} disabled={savingExtras || recordingId !== null}>
                  {savingExtras && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
                  {t("الحفظ للمعلّمة", "Save for my teacher")}
                </Button>
                <Button variant="ghost" onClick={() => setPhase("result")}>{t("العودة إلى النتيجة", "Back to result")}</Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- the test -----------------------------------------------------------
  const section = EXAM_SECTIONS[step];
  const totalSteps = EXAM_SECTIONS.length;
  const sectionQuestions = questionsBySection[section.id] ?? [];
  /**
   * Progress is counted inside the section and never across all fifty-two.
   * A bar creeping one fifty-second at a time tells a beginner she has barely
   * started when she is in fact most of the way through everything she can do,
   * which is exactly the discouragement the stop button exists to prevent.
   */
  const answeredHere = sectionQuestions.filter((q) => answers[q.id] !== undefined).length;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-4 pt-24 pb-12 max-w-3xl mx-auto w-full space-y-4">
        <div ref={topRef} />

        <div dir={isAr ? "rtl" : "ltr"} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">{t("اختبار تحديد المستوى", "Korean Placement Test")}</span>
            <span className="text-muted-foreground">
              {t(`القسم ${toArabicDigits(step + 1)} من ${toArabicDigits(totalSteps)}`, `Section ${step + 1} of ${totalSteps}`)}
            </span>
          </div>
          <Progress value={sectionQuestions.length ? (answeredHere / sectionQuestions.length) * 100 : 0} />
          <p className="text-xs text-muted-foreground">
            {t(`أُجيب عن ${toArabicDigits(answeredHere)} من ${toArabicDigits(sectionQuestions.length)} في هذا القسم`,
               `${answeredHere} of ${sectionQuestions.length} answered in this section`)}
          </p>
        </div>

        <Card dir={isAr ? "rtl" : "ltr"}>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold">{isAr ? section.titleAr : section.titleEn}</h2>
              <Badge variant="outline" dir="ltr" className="shrink-0">{section.gradeKo}</Badge>
            </div>
            <p className="text-xs text-muted-foreground" dir="ltr">{section.titleKo}</p>
            <p className="text-sm text-muted-foreground">{isAr ? section.instrAr : section.instrEn}</p>
            {section.focusKo && <p className="text-xs text-muted-foreground" dir="ltr">※ {section.focusKo}</p>}

            {step === 0 && (
              <p className="text-sm">
                {t("الإجابة عمّا يمكن الإجابة عنه. لا يوقف أي قسم الاختبار، وبدءًا من القسم الثالث يصبح قرار المتابعة أو التوقف اختياريًا.",
                   "Answer what you can. No section stops the test, and from the third section onward it is you who decides whether to carry on.")}
              </p>
            )}

            <div className="space-y-4">{sectionQuestions.map(renderQuestion)}</div>

            {section.id === "A" && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("قراءة الحروف الكورية غير ممكنة بعد؟ هذا ليس رسوبًا، بل هو بالضبط المستوى الذي نبدأ منه.",
                     "Cannot read the Korean alphabet yet? That is not a fail, it is exactly where we start.")}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleCannotReadHangul}>
                  {t("لا أستطيع قراءة الهانغول بعد: عرض مستواي", "I cannot read Hangul yet, show my level")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-2" dir={isAr ? "rtl" : "ltr"}>
          <Button
            variant="outline"
            onClick={() => { if (step > 0) setStep(step - 1); }}
            disabled={step === 0}
          >
            <ArrowLeft className={cn("h-4 w-4 me-1.5", isAr && "rotate-180")} />
            {t("السابق", "Back")}
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {/* Ghost and muted, sitting next to the primary rather than against
                it: finishing early is a real choice but it is not the one the
                page is asking her to make. */}
            {section.mayStopAfter && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => stopHere(section.id)}>
                {t("هذا أقصى ما أستطيع: عرض مستواي", "That's as far as I can go, show me my level")}
              </Button>
            )}
            <Button onClick={nextSection}>
              {step === totalSteps - 1 ? t("إنهاء الاختبار", "Finish") : t("التالي", "Next")}
              <ArrowRight className={cn("h-4 w-4 ms-1.5", isAr && "rotate-180")} />
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default KoreanPlacementPage;
