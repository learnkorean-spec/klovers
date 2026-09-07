import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  GraduationCap, ArrowRight, ArrowLeft, Mic, Square, Play, RotateCcw,
  CheckCircle2, AlertCircle, PenLine, Loader2,
} from "lucide-react";
import {
  SEJONG1_SECTIONS, SEJONG1_QUESTIONS, SEJONG1_READING_TEXT,
  SEJONG1_WRITING, SEJONG1_SPEAKING, SEJONG1_MCQ_MAX,
  computeUnitPlacement,
  type SejongSectionId, type SejongQuestion, type UnitPlacementResult,
} from "@/constants/sejong1Placement";

/**
 * Unit placement test for 세종한국어 1 — the book Klovers teaches from.
 *
 * Separate from /placement-test on purpose. That one is public, captures leads
 * and decides a course LEVEL (hangul/l1…l6). This one is login-only and decides
 * which UNIT of Sejong Korean 1 a student starts from, which is a teaching
 * decision rather than a sales one.
 *
 * Multiple choice and reading grade themselves. Writing and speaking are stored
 * for the teacher — nothing tries to grade Korean prose or pronunciation here.
 */

const STORAGE_KEY = "klovers_unit_placement_draft_v1";
const AUDIO_BUCKET = "placement-audio";
/** Sections A–F are the auto-graded steps; writing and speaking follow. */
const MCQ_STEPS = SEJONG1_SECTIONS.length;
const TOTAL_STEPS = MCQ_STEPS + 2;

type Phase = "intro" | "test" | "result";

interface Draft {
  answers: Record<string, number>;
  writing: Record<string, string>;
  step: number;
  startedAt: number;
}

const UnitPlacementPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [writing, setWriting] = useState<Record<string, string>>({});
  const [audio, setAudio] = useState<Record<string, Blob>>({});
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UnitPlacementResult | null>(null);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);

  const questionsBySection = useMemo(() => {
    const map = {} as Record<SejongSectionId, SejongQuestion[]>;
    for (const s of SEJONG1_SECTIONS) map[s.id] = [];
    for (const q of SEJONG1_QUESTIONS) map[q.section].push(q);
    return map;
  }, []);

  // ---- draft resume -------------------------------------------------------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      if (!d?.answers || typeof d.step !== "number") return;
      setAnswers(d.answers);
      setWriting(d.writing || {});
      setStep(d.step);
      setStartedAt(d.startedAt || Date.now());
      setPhase("test");
      toast({
        title: isAr ? "تم استئناف الاختبار" : "Test resumed",
        description: isAr
          ? "رجّعنا إجاباتك السابقة. التسجيلات الصوتية بتتعمل من جديد."
          : "Your previous answers were restored. Audio recordings are not kept in the draft.",
      });
    } catch {
      // A corrupt draft is not worth surfacing — start clean.
    }
    // Intentionally runs once; toast/isAr are stable enough for a resume notice.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== "test") return;
    try {
      const d: Draft = { answers, writing, step, startedAt };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
    } catch {
      // Private mode / quota — the test still works, it just cannot resume.
    }
  }, [answers, writing, step, startedAt, phase]);

  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step, phase]);

  // ---- audio --------------------------------------------------------------
  const stopRecording = useCallback(() => {
    recorderRef.current?.stop();
    recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    setRecordingId(null);
  }, []);

  useEffect(() => () => stopRecording(), [stopRecording]);

  const startRecording = async (promptId: string) => {
    setMicError(null);
    if (typeof MediaRecorder === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicError(
        isAr
          ? "المتصفح ده مش بيدعم التسجيل الصوتي. سيبي القسم ده فاضي والمدرّس هيقيّمه في الحصة."
          : "This browser cannot record audio. Leave this section empty — your teacher will assess it live.",
      );
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
      setMicError(
        isAr
          ? "مقدرناش نوصل للمايك. اسمحي للمتصفح باستخدام المايك، أو سيبي القسم ده والمدرّس هيقيّمه في الحصة."
          : "Microphone access was denied. Allow it in your browser, or skip this section and your teacher will assess it live.",
      );
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

  // ---- submit -------------------------------------------------------------
  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    const res = computeUnitPlacement(answers);
    const attemptId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    // Upload audio first, then write the row, so a stored row never points at
    // a file that failed to upload.
    const speaking: { id: string; prompt: string; path: string }[] = [];
    for (const p of SEJONG1_SPEAKING) {
      const blob = audio[p.id];
      if (!blob) continue;
      const path = `${user.id}/${attemptId}/${p.id}.webm`;
      const { error } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, blob, { contentType: blob.type || "audio/webm", upsert: true });
      if (error) {
        // One failed clip must not cost the student the whole attempt.
        continue;
      }
      speaking.push({ id: p.id, prompt: p.ko, path });
    }

    const writingRows = SEJONG1_WRITING
      .filter((p) => (writing[p.id] || "").trim().length > 0)
      .map((p) => ({ id: p.id, prompt: p.ko, text: writing[p.id].trim() }));

    const { error } = await (supabase as any).from("unit_placement_tests").insert({
      id: attemptId,
      user_id: user.id,
      book: "sejong1",
      section_scores: res.sectionScores,
      mcq_score: res.mcqScore,
      start_unit: res.start.key,
      failed_section: res.failedSection,
      suggested_level_key: res.start.levelKey,
      answers,
      writing: writingRows,
      speaking_audio: speaking,
      duration_seconds: Math.round((Date.now() - startedAt) / 1000),
    });

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: isAr ? "لم يتم الحفظ" : "Could not save",
        description: isAr
          ? "النتيجة ظاهرة تحت، بس محصلش حفظ. جرّبي تاني أو صوّري الشاشة."
          : "Your result is shown below but was not saved. Try again, or screenshot it.",
      });
    } else {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }

    setResult(res);
    setPhase("result");
  };

  // ---- guards -------------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const t = (ar: string, en: string) => (isAr ? ar : en);

  // ---- render helpers -----------------------------------------------------
  const renderQuestion = (q: SejongQuestion, index: number) => (
    <div key={q.id} className="space-y-2">
      {q.group && (
        <p className="text-sm font-semibold text-foreground pt-4" dir="ltr">{q.group}</p>
      )}
      {q.bogi && (
        <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1.5" dir="ltr">
          <p className="text-xs text-muted-foreground">&lt;보기&gt;</p>
          <p className="text-sm">{q.bogi.stem}</p>
          <p className="text-sm">
            {q.bogi.options.map((o, i) => (
              <span key={i} className={cn("mr-4", i === q.bogi!.answerIndex && "font-bold")}>
                {i === q.bogi!.answerIndex ? "❶❷❸❹"[i] : "①②③④"[i]} {o}
              </span>
            ))}
          </p>
        </div>
      )}
      <p className="text-sm font-medium" dir="ltr">
        <span className="text-muted-foreground mr-1.5">{q.id}.</span>
        {q.stem.split("\n").map((line, li) => (
          <span key={li} className={li > 0 ? "block ml-6" : undefined}>{line}</span>
        ))}
      </p>
      {q.hintAr && isAr && (
        <p className="text-xs text-muted-foreground border-r-2 border-primary/40 pr-2" dir="rtl">
          {q.hintAr}
        </p>
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
              <span className="text-muted-foreground mr-1 text-xs">{"①②③④"[oi]}</span> {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
      {index >= 0 && <div className="h-1" />}
    </div>
  );

  const sectionStep = SEJONG1_SECTIONS[step];
  const answeredInStep = sectionStep
    ? questionsBySection[sectionStep.id].filter((q) => answers[q.id] !== undefined).length
    : 0;

  // ---- intro --------------------------------------------------------------
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main id="main-content" className="flex-1 container max-w-3xl py-10">
          <Card dir={isAr ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GraduationCap className="h-6 w-6 text-primary" />
                {t("اختبار تحديد الوحدة", "Unit placement test")}
              </CardTitle>
              <p className="text-sm text-muted-foreground" dir="ltr">세종한국어 1 · 예비편 ~ 12과</p>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>
                {t(
                  "الاختبار ده بيحدد إنتي تبدئي من أي وحدة في كتاب 세종한국어 1 — مش بيدّي درجة كلية.",
                  "This test decides which unit of Sejong Korean 1 you start from. It is not scored as a single total.",
                )}
              </p>
              <ul className="space-y-1.5 list-disc ms-5 text-muted-foreground">
                <li>{t("٦ أقسام اختيار من متعدد وقراءة — تتصحح تلقائيًا.", "6 multiple-choice and reading sections — graded automatically.")}</li>
                <li>{t("٣ أسئلة كتابة بالكوري — يصححها المدرّس.", "3 Korean writing questions — marked by your teacher.")}</li>
                <li>{t("٥ أسئلة شفهية بالتسجيل الصوتي — يقيّمها المدرّس. تقدري تتخطاها.", "5 spoken questions recorded with your microphone — assessed by your teacher. You may skip them.")}</li>
                <li>{t("حوالي ٣٠ دقيقة. تقدري تقفلي الصفحة وترجعي، إجاباتك محفوظة.", "About 30 minutes. You can close the page and come back — your answers are saved.")}</li>
                <li>{t("من غير قاموس ولا ترجمة — النتيجة الصادقة هي اللي بتحطك في المكان الصح.", "No dictionary or translator — an honest result is what puts you in the right place.")}</li>
              </ul>
              <div className="flex gap-2 pt-2">
                <Button onClick={() => { setStartedAt(Date.now()); setPhase("test"); }}>
                  {t("ابدئي الاختبار", "Start the test")}
                  <ArrowRight className={cn("h-4 w-4", isAr ? "mr-2 rotate-180" : "ml-2")} />
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")}>
                  {t("رجوع", "Back")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- result -------------------------------------------------------------
  if (phase === "result" && result) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main id="main-content" className="flex-1 container max-w-3xl py-10 space-y-4">
          <Card dir={isAr ? "rtl" : "ltr"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                {t("نتيجتك", "Your result")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t("نقطة البداية المناسبة ليكي", "Your starting point")}
                </p>
                <p className="text-2xl font-bold" dir="ltr">{result.start.labelKo}</p>
                <p className="text-sm">{isAr ? result.start.labelAr : result.start.labelEn}</p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  {t("تفصيل الأقسام", "Section breakdown")}
                </p>
                <div className="space-y-1.5">
                  {SEJONG1_SECTIONS.map((s) => {
                    const score = result.sectionScores[s.id];
                    const passed = score >= s.pass;
                    const decided = result.failedSection === s.id;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "flex items-center justify-between rounded-lg border px-3 py-2 text-sm",
                          decided ? "border-primary bg-primary/5" : "border-border",
                        )}
                      >
                        <span className="flex items-center gap-2">
                          {passed
                            ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                            : <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />}
                          <span>{isAr ? s.titleAr : s.titleEn}</span>
                        </span>
                        <Badge variant={passed ? "secondary" : "outline"} dir="ltr">
                          {score} / {s.max}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t(
                    `المجموع التلقائي ${result.mcqScore} من ${SEJONG1_MCQ_MAX} — لكن اللي حدد نقطة البداية هو أول قسم لم تجتازيه، مش المجموع.`,
                    `Auto-graded total ${result.mcqScore} of ${SEJONG1_MCQ_MAX} — but your starting point comes from the first section you did not pass, not from the total.`,
                  )}
                </p>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
                <p className="font-semibold mb-1 flex items-center gap-2">
                  <PenLine className="h-4 w-4" />
                  {t("الكتابة والشفهي", "Writing and speaking")}
                </p>
                <p className="text-muted-foreground">
                  {t(
                    "اتحفظوا للمدرّس. هيراجعهم ويأكد نقطة البداية — ممكن يعدّلها لو الإنتاج أضعف أو أقوى من الفهم.",
                    "Saved for your teacher. They will review them and confirm your starting point — it can move if your production is weaker or stronger than your comprehension.",
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => navigate("/dashboard")}>
                  {t("رجوع للوحة التحكم", "Back to dashboard")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  // ---- test ---------------------------------------------------------------
  const isWritingStep = step === MCQ_STEPS;
  const isSpeakingStep = step === MCQ_STEPS + 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main id="main-content" className="flex-1 container max-w-3xl py-8 space-y-4">
        <div ref={topRef} />

        <div dir={isAr ? "rtl" : "ltr"} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">
              {t("اختبار تحديد الوحدة", "Unit placement test")}
            </span>
            <span className="text-muted-foreground" dir="ltr">
              {step + 1} / {TOTAL_STEPS}
            </span>
          </div>
          <Progress value={((step + 1) / TOTAL_STEPS) * 100} />
        </div>

        <Card dir={isAr ? "rtl" : "ltr"}>
          <CardHeader className="pb-3">
            {sectionStep && (
              <>
                <CardTitle className="text-lg">
                  {isAr ? sectionStep.titleAr : sectionStep.titleEn}
                </CardTitle>
                <p className="text-xs text-muted-foreground" dir="ltr">{sectionStep.titleKo}</p>
              </>
            )}
            {isWritingStep && (
              <CardTitle className="text-lg">{t("القسم (ز) — الكتابة", "Section G — Writing")}</CardTitle>
            )}
            {isSpeakingStep && (
              <CardTitle className="text-lg">{t("القسم (ح) — الشفهي", "Section H — Speaking")}</CardTitle>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* --- multiple choice / reading --- */}
            {sectionStep && (
              <>
                <p className="text-sm text-muted-foreground">
                  {isAr ? sectionStep.instrAr : sectionStep.instrEn}
                </p>
                {sectionStep.groupKo && (
                  <p className="text-sm font-semibold" dir="ltr">{sectionStep.groupKo}</p>
                )}
                {sectionStep.id === "F" && (
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1" dir="ltr">
                    {SEJONG1_READING_TEXT.map((line, i) => (
                      <p key={i} className="text-sm leading-relaxed">{line}</p>
                    ))}
                  </div>
                )}
                <div className="space-y-4">
                  {questionsBySection[sectionStep.id].map(renderQuestion)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(
                    `أجبتِ على ${answeredInStep} من ${questionsBySection[sectionStep.id].length}. الأسئلة الفارغة جزء طبيعي من تحديد المستوى.`,
                    `${answeredInStep} of ${questionsBySection[sectionStep.id].length} answered. Leaving questions blank is a normal part of placement.`,
                  )}
                </p>
              </>
            )}

            {/* --- writing --- */}
            {isWritingStep && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "اكتبي بالكوري. لو مش قادرة على سؤال، سيبيه وانتقلي للي بعده.",
                    "Write in Korean. If you cannot answer one, leave it and move on.",
                  )}
                </p>
                {SEJONG1_WRITING.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    <p className="text-sm font-medium" dir="ltr">{p.id}. {p.ko}</p>
                    {isAr && <p className="text-xs text-muted-foreground" dir="rtl">{p.ar}</p>}
                    {p.useKo && (
                      <p className="text-xs text-muted-foreground" dir="ltr">※ {p.useKo}</p>
                    )}
                    <Textarea
                      dir="ltr"
                      rows={3}
                      lang="ko"
                      value={writing[p.id] || ""}
                      onChange={(e) => setWriting((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="한국어로 쓰세요…"
                    />
                  </div>
                ))}
              </>
            )}

            {/* --- speaking --- */}
            {isSpeakingStep && (
              <>
                <p className="text-sm text-muted-foreground">
                  {t(
                    "سجّلي إجابتك بصوتك. لو المايك مش شغال، سيبي القسم ده والمدرّس هيقيّمه في الحصة.",
                    "Record your answer. If your microphone does not work, skip this section — your teacher will assess it live.",
                  )}
                </p>
                {micError && (
                  <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    {micError}
                  </p>
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
                          <Button
                            type="button"
                            size="sm"
                            variant={recorded ? "outline" : "default"}
                            onClick={() => startRecording(p.id)}
                            disabled={recordingId !== null}
                          >
                            {recorded
                              ? <RotateCcw className="h-3.5 w-3.5 me-1.5" />
                              : <Mic className="h-3.5 w-3.5 me-1.5" />}
                            {recorded ? t("سجّلي تاني", "Re-record") : t("سجّلي", "Record")}
                          </Button>
                        ) : (
                          <Button type="button" size="sm" variant="destructive" onClick={stopRecording}>
                            <Square className="h-3.5 w-3.5 me-1.5" />
                            {t("إيقاف", "Stop")}
                          </Button>
                        )}
                        {recorded && !isRec && (
                          <Button type="button" size="sm" variant="ghost" onClick={() => playBack(p.id)}>
                            <Play className="h-3.5 w-3.5 me-1.5" />
                            {t("تشغيل", "Play")}
                          </Button>
                        )}
                        {recorded && (
                          <Badge variant="secondary" className="self-center">
                            {t("متسجّل", "Recorded")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2" dir={isAr ? "rtl" : "ltr"}>
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0 || submitting}
          >
            <ArrowLeft className={cn("h-4 w-4 me-1.5", isAr && "rotate-180")} />
            {t("السابق", "Back")}
          </Button>

          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={submitting}>
              {t("التالي", "Next")}
              <ArrowRight className={cn("h-4 w-4 ms-1.5", isAr && "rotate-180")} />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting || recordingId !== null}>
              {submitting && <Loader2 className="h-4 w-4 me-1.5 animate-spin" />}
              {t("إنهاء وإظهار النتيجة", "Finish and see my result")}
            </Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UnitPlacementPage;
