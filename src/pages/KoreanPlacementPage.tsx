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
import {
  CheckCircle, ArrowRight, ArrowLeft, Share2,
  Download, RefreshCw, Mic, Square, Play, RotateCcw, PenLine, Loader2,
  Sparkles, Target, Clock, Save, Ban,
} from "lucide-react";
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

const GRADE_META: Record<TopikGrade, { emoji: string; tagline: string }> = {
  pre1: { emoji: "🌱", tagline: "Hangul Foundation" },
  g1: { emoji: "📗", tagline: "TOPIK Level 1" },
  g2: { emoji: "📘", tagline: "TOPIK Level 2" },
  g3: { emoji: "📙", tagline: "TOPIK Level 3" },
  g4: { emoji: "📕", tagline: "TOPIK Level 4" },
  above: { emoji: "🏆", tagline: "Past 4급" },
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
const LADDER: { ko: string; ar: string; en: string; emoji: string }[] = [
  { ko: "한글 기초", ar: "تأسيس الهانغول", en: "Hangul", emoji: "🌱" },
  { ko: "1급", ar: "المستوى الأول", en: "Level 1", emoji: "📗" },
  { ko: "2급", ar: "المستوى الثاني", en: "Level 2", emoji: "📘" },
  { ko: "3급", ar: "المستوى الثالث", en: "Level 3", emoji: "📙" },
  { ko: "4급", ar: "المستوى الرابع", en: "Level 4", emoji: "📕" },
];

const SECTION_IDS = EXAM_SECTIONS.map((s) => s.id);

type Phase = "intro" | "test" | "extras" | "result";

interface Draft {
  answers: Record<string, number>;
  step: number;
  startedAt: number;
  sectionsSeen: string[];
}

const KoreanPlacementPage = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  useSEO({ title: "Korean Placement Test", description: "Take the free Klovers Korean placement test. Discover your TOPIK level and find the perfect course for your learning journey.", canonical: "https://kloversegy.com/placement-test" });

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
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Quiz",
      "name": "Free Korean Language Placement Test",
      "description": "Take the free Klovers Korean placement test to discover your TOPIK level and find the perfect course.",
      "url": "https://kloversegy.com/placement-test",
      "provider": { "@id": "https://kloversegy.com/#organization" },
      "educationalAlignment": {
        "@type": "AlignmentObject",
        "educationalFramework": "TOPIK",
        "targetName": "Korean Language Proficiency"
      }
    });
    document.head.appendChild(script);
    return () => { document.getElementById("placement-schema")?.remove(); };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setUserId(session.user.id);
    });
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
          toast({ title: isAr ? "تم استئناف الاختبار" : "Test resumed", description: isAr ? "تم استعادة تقدمك السابق." : "Your previous progress has been restored." });
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
        ? "المتصفح ده مش بيدعم التسجيل الصوتي. سيبي القسم ده والمدرّس هيقيّمه في الحصة."
        : "This browser cannot record audio. Skip this part — your teacher will assess it live.");
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
        ? "مقدرناش نوصل للمايك. اسمحي للمتصفح باستخدامه، أو سيبي القسم ده."
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
      const { error } = await supabase.from("placement_tests").insert({
        user_id: userId, score: res.score, level: info.levelKey,
      });
      if (!error) {
        // course_level_key is the canonical, machine-set column. profiles.level
        // is the learner's own free-form self-assessment and stays untouched.
        const { error: profileError } = await supabase.from("profiles").update({ course_level_key: info.levelKey } as any).eq("user_id", userId);
        // The placement row is already written, so a failed profile update
        // costs the student nothing they can see; the next attempt corrects it.
        if (profileError) return;
      }
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
    setPhase("test");
  };

  // ---- result-screen actions (funnel-critical literals) --------------------
  const handleShare = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const label = isAr ? info.labelAr : info.labelEn;
    const text = `I took the Klovers Korean Placement Test!\nMy level: ${label}\nFind yours → ${SITE_URL}/placement-test`;
    navigator.clipboard.writeText(text)
      .then(() => toast({ title: isAr ? "تم النسخ!" : "Copied to clipboard!", description: isAr ? "شارك مستواك مع أصدقائك." : "Share your level with friends." }))
      .catch(() => toast({ title: `${SITE_URL}/placement-test`, description: isAr ? "انسخ الرابط لمشاركة نتيجتك." : "Copy the link to share your result." }));
  };

  const handleWhatsAppEnroll = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const text = encodeURIComponent(`مرحباً! أنهيت اختبار تحديد المستوى ومستواي: ${info.labelAr}. هل يمكنني الحجز؟`);
    trackAndOpenWhatsApp(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, { cta_label: "placement_enroll", metadata: { level: info.levelKey, score: res.score } });
  };

  const handleDownloadCard = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const meta = GRADE_META[res.grade];
    const canvas = document.createElement("canvas");
    drawPlacementCard(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: `${info.labelKo} — ${info.labelEn}`,
      tagline: meta.tagline,
      score: res.score,
      total: res.max,
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-${res.grade}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل البطاقة!" : "Card downloaded!", description: isAr ? "شارك مستواك على مواقع التواصل." : "Share your level on social media." });
  };

  const handleDownloadCertificate = (res: ExamResult) => {
    const info = TOPIK_GRADES[res.grade];
    const meta = GRADE_META[res.grade];
    const canvas = document.createElement("canvas");
    drawPlacementCertificate(canvas, {
      levelEmoji: meta.emoji,
      levelLabel: `${info.labelKo} — ${info.labelEn}`,
      tagline: meta.tagline,
      score: res.score,
      total: res.max,
      date: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
    });
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = `klovers-certificate-${res.grade}.png`;
    a.click();
    toast({ title: isAr ? "تم تحميل الشهادة!" : "Certificate downloaded!", description: isAr ? "شارك إنجازك على LinkedIn أو سيرتك الذاتية." : "Share your achievement on LinkedIn or CV." });
  };

  const handleLeadSubmit = async () => {
    if (!leadName.trim() || !leadEmail.trim()) {
      toast({ title: isAr ? "يرجى إدخال اسمك وبريدك الإلكتروني." : "Please enter your name and email.", variant: "destructive" }); return;
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
      toast({ title: isAr ? "لم نستطع الحفظ. حاول مرة أخرى." : "We could not save that. Please try again.", variant: "destructive" });
      return;
    }
    setLeadSaved(true);
    track.custom("placement_lead_captured", { level: levelKey });
    logLeadEvent({ source_type: "email", cta_label: "placement_study_plan", metadata: { level: levelKey } });
  };

  const saveExtras = async () => {
    if (!userId || !result) return;
    setSavingExtras(true);
    const attemptId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const speaking: { id: string; prompt: string; path: string }[] = [];
    for (const p of SEJONG1_SPEAKING) {
      const blob = audio[p.id];
      if (!blob) continue;
      const path = `${userId}/${attemptId}/${p.id}.webm`;
      const { error } = await supabase.storage.from(AUDIO_BUCKET)
        .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true });
      if (error) continue; // one failed clip must not cost the whole attempt
      speaking.push({ id: p.id, prompt: p.ko, path });
    }

    const writingRows = SEJONG1_WRITING
      .filter((p) => (writing[p.id] || "").trim().length > 0)
      .map((p) => ({ id: p.id, prompt: p.ko, text: writing[p.id].trim() }));

    const { error } = await (supabase as any).from("unit_placement_tests").insert({
      id: attemptId,
      user_id: userId,
      book: EXAM_BOOK_KEY,
      section_scores: result.sectionScores,
      mcq_score: result.score,
      start_unit: result.grade,
      // No section can fail on its own any more, so there is nothing to name
      // here; the column stays for the rows written before today.
      failed_section: null,
      suggested_level_key: TOPIK_GRADES[result.grade].levelKey,
      answers,
      writing: writingRows,
      speaking_audio: speaking,
      duration_seconds: Math.round((Date.now() - startedAt) / 1000),
    });

    setSavingExtras(false);
    if (error) {
      toast({ variant: "destructive", title: isAr ? "لم يتم الحفظ" : "Could not save", description: isAr ? "جرّب مرة أخرى." : "Please try again." });
      return;
    }
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
      { icon: Target, text: t("بأسئلة على شكل امتحان TOPIK الحقيقي", "Questions in the real TOPIK reading formats") },
      { icon: Clock,  text: t("٥٢ سؤال — وتقدر تنهيه بدري", `${EXAM_MAX} questions — and you can finish early`) },
      { icon: Save,   text: t("اقفل وارجع — محفوظ", "Close it and come back — saved") },
      { icon: Ban,    text: t("من غير قاموس ولا ترجمة", "No dictionary, no translator") },
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
                  className="absolute text-6xl font-bold text-amber-300/10 dark:text-amber-400/[0.07]"
                  style={{ top: `${8 + i * 24}%`, left: `${4 + i * 24}%`, transform: `rotate(${-14 + i * 9}deg)` }}
                >
                  {char}
                </span>
              ))}
            </div>

            <Card dir={isAr ? "rtl" : "ltr"} className="relative overflow-hidden border-border/70 shadow-xl">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-primary/70 to-primary" />
              <CardContent className="pt-8 pb-7 space-y-7">

                <div className="space-y-4 text-center">
                  <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-950/40 border border-black/10 dark:border-amber-800/40 px-4 py-1.5 rounded-full text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <Sparkles className="h-3.5 w-3.5" />
                    {t("مجاني · من غير تسجيل", "Free · no sign-up")}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">
                    {t("اعرف مستواك في الكوري", "Find your Korean level")}
                  </h1>

                  <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {t("أسئلة قراءة على شكل امتحان TOPIK الحقيقي. اختبار واحد، ٥٢ سؤال، بيبدأ من الأسهل وبيغطّي من المستوى الأول للرابع — وأول ما الأسئلة تعدّي مستواك تقدر تنهيه بنفسك.",
                       `Reading questions in the real TOPIK formats. One test of ${EXAM_MAX} questions, easiest first, covering levels 1 to 4 — and once the questions are past you, you can finish it yourself.`)}
                  </p>
                </div>

                {/* What the test can answer. Shown before they start, because a
                    named result is a clearer promise than "we'll tell you". */}
                <div>
                  <p className="text-[11px] font-bold tracking-[0.08em] text-muted-foreground text-center mb-3">
                    {t("المستويات اللي الاختبار ده بيقيسها", "THE LEVELS THIS TEST MEASURES")}
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
                        <div className="text-xl leading-none">{l.emoji}</div>
                        <div className="text-sm font-bold leading-tight" dir="ltr">{l.ko}</div>
                        <div className="text-[10px] text-muted-foreground leading-tight">
                          {isAr ? l.ar : l.en}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center mt-2">
                    {t("بتجاوب اللي تقدر عليه ومجموعك هو اللي بيحدد مستواك، زي درجات القطع في TOPIK نفسه — مفيش قسم بينهي الاختبار في وشك.",
                       "You answer what you can and your total decides the level, the way TOPIK's own cut scores work — no section ends the test on you.")}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-2.5">
                  {FEATURES.map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-2.5 bg-muted/60 rounded-xl px-3 py-2.5 text-sm font-medium">
                      <Icon className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0" />
                      <span className="leading-snug">{text}</span>
                    </div>
                  ))}
                </div>

                {/* One button, because there is now one test. The second choice
                    below it is not a variant of the test — it is the answer for
                    the student the first question would already be too hard for,
                    and it is styled quietly so it reads as a way out rather than
                    a competing option. */}
                <div className="space-y-2.5 pt-1">
                  <Button size="lg" className="w-full font-semibold" onClick={startTest}>
                    {t("ابدأ الاختبار", "Start the test")}
                    <ArrowRight className={cn("h-4 w-4 ms-1.5", isAr && "rotate-180")} />
                  </Button>

                  <button
                    type="button"
                    onClick={handleCannotReadHangul}
                    className="w-full text-start rounded-xl border border-border bg-muted/40 px-4 py-3 hover:border-primary/60 transition-colors"
                  >
                    <span className="block text-sm font-bold leading-snug">
                      {t("لسه مش عارف أقرا الهانغول — وريني مستواي",
                         "I can't read Hangul yet — show me my level")}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-snug mt-0.5">
                      {t("من غير أسئلة — بنوديك لنتيجتك على طول.",
                         "No questions — this takes you straight to your result.")}
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
          <Card dir={isAr ? "rtl" : "ltr"}>
            <CardContent className="pt-6 space-y-5">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center space-y-2">
                <p className="text-4xl">{GRADE_META[result.grade].emoji}</p>
                <p className="text-sm text-muted-foreground">{t("مستواك", "Your level")}</p>
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
                    <Badge dir="ltr">{result.score} / {result.attempted}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {seenSections.map((s) => (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                        <span>{isAr ? s.titleAr : s.titleEn}</span>
                        <Badge variant="secondary" dir="ltr">{result.sectionScores[s.id] ?? 0} / {s.max}</Badge>
                      </div>
                    ))}
                  </div>
                  {result.stoppedEarly && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {t("انت اللي اخترت تنهي هنا، والمستوى ده متحسب على الأقسام اللي جاوبتها فعلًا.",
                         "You chose to finish here, and this level is worked out from the sections you actually answered.")}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {t("مستواك اتحدد من مجموع درجاتك في الأقسام اللي شُفتها، بنفس طريقة TOPIK اللي بيقارن مجموعك بدرجة قطع.",
                       "Your level comes from your total across the sections you were shown, the same way TOPIK measures a total against a cut score.")}
                  </p>
                </div>
              )}

              {/* Email capture, inline and above the CTAs rather than behind a
                  small button. Only for visitors we do not already have. */}
              {!userId && (
                <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
                  {leadSaved ? (
                    <div className="text-center py-2 space-y-2">
                      <CheckCircle className="h-9 w-9 text-green-600 mx-auto" />
                      <p className="font-semibold text-sm">{t("هنبعتلك خطتك قريب!", "We'll send your plan shortly!")}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <p className="font-semibold text-sm">
                          {t("عايز خطة دراسية لمستواك؟", "Want a study plan for your level?")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isAr
                            ? `اكتب اسمك وبريدك وهنبعتلك خطة مخصصة لمستوى ${info.labelAr}.`
                            : `Leave your name and email and we'll send a plan built for ${info.labelEn}.`}
                        </p>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <Input placeholder={t("اسمك", "Your name")} value={leadName} onChange={e => setLeadName(e.target.value)} />
                        <Input placeholder={t("بريدك الإلكتروني", "Your email")} type="email" value={leadEmail} onChange={e => setLeadEmail(e.target.value)} />
                      </div>
                      <Button className="w-full" size="sm" onClick={handleLeadSubmit} disabled={leadSaving}>
                        {leadSaving ? t("جارٍ الإرسال...", "Sending…") : t("ابعتوا لي الخطة", "Send me the plan")}
                      </Button>
                    </>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => navigate("/free-trial")}
                  className="flex-1 min-w-[9rem] font-semibold">
                  {t("احجز تجربتي المجانية", "Book My Free Trial")}
                </Button>
                <Button size="sm" variant="outline" className="flex-1 min-w-[9rem]" onClick={() => handleWhatsAppEnroll(result)}>
                  {t("تواصل واتساب", "WhatsApp us")}
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
                  <RefreshCw className="h-3.5 w-3.5" /> {t("إعادة", "Retake")}
                </Button>
              </div>

              {userId && !extrasSaved && (
                <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-2">
                  <p className="font-semibold flex items-center gap-2"><PenLine className="h-4 w-4" />
                    {t("عايز تقييم أدق؟", "Want a sharper placement?")}</p>
                  <p className="text-muted-foreground">
                    {t("أضف عيّنة كتابة وتسجيل صوتي قصير، والمدرّس يراجعهم قبل أول حصة. اختياري تمامًا.",
                       "Add a short writing sample and a voice recording for your teacher to review before your first class. Entirely optional.")}
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setPhase("extras")}>
                    {t("أضف الكتابة والصوت", "Add writing and voice")}
                  </Button>
                </div>
              )}
              {extrasSaved && (
                <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  {t("اتحفظت للمدرّس. شكرًا!", "Saved for your teacher. Thank you!")}
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
              <h2 className="text-lg font-bold">{t("الكتابة والصوت — للمدرّس", "Writing and voice — for your teacher")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("مفيش تصحيح آلي هنا. المدرّس هو اللي يراجع.", "Nothing here is auto-graded. Your teacher reviews it.")}
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
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">{micError}</p>
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
                          {recorded ? t("سجّل تاني", "Re-record") : t("سجّل", "Record")}
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
                      {recorded && <Badge variant="secondary" className="self-center">{t("متسجّل", "Recorded")}</Badge>}
                    </div>
                  </div>
                );
              })}

              <div className="flex gap-2">
                <Button onClick={saveExtras} disabled={savingExtras || recordingId !== null}>
                  {savingExtras && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
                  {t("احفظ للمدرّس", "Save for my teacher")}
                </Button>
                <Button variant="ghost" onClick={() => setPhase("result")}>{t("رجوع للنتيجة", "Back to result")}</Button>
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
              {t(`القسم ${step + 1} من ${totalSteps}`, `Section ${step + 1} of ${totalSteps}`)}
            </span>
          </div>
          <Progress value={sectionQuestions.length ? (answeredHere / sectionQuestions.length) * 100 : 0} />
          <p className="text-xs text-muted-foreground">
            {t(`جاوبت ${answeredHere} من ${sectionQuestions.length} في القسم ده`,
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
                {t("جاوب اللي تقدر عليه. مفيش قسم بيوقف الاختبار — ومن القسم التالت وانت اللي تقرر تكمّل ولا تقف.",
                   "Answer what you can. No section stops the test — and from the third section onward it is you who decides whether to carry on.")}
              </p>
            )}

            <div className="space-y-4">{sectionQuestions.map(renderQuestion)}</div>

            {section.id === "A" && (
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("لسه مابتعرفش تقرا الحروف الكورية؟ ده مش رسوب — ده بالظبط المستوى اللي بنبدأ منه.",
                     "Cannot read the Korean alphabet yet? That is not a fail — it is exactly where we start.")}
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleCannotReadHangul}>
                  {t("لسه مش عارف أقرا الهانغول — وريني مستواي", "I cannot read Hangul yet — show my level")}
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
                {t("مش قادر أكمل أكتر من كده — وريني مستواي", "That's as far as I can go — show me my level")}
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
