import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VocabularyReview } from "@/components/VocabularyReview";
import { useSRS } from "@/hooks/useSRS";
import { useGamification } from "@/hooks/useGamification";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KloverIcon from "@/components/KloverIcon";
import { toArabicDigits } from "@/lib/trustFigures";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { LeaguePromotionModal, BadgeUnlockToast } from "@/components/XpAnimation";
import { useToast } from "@/hooks/use-toast";
import { BADGES } from "@/constants/gamification";
import { supabase } from "@/integrations/supabase/client";

export function VocabularyReviewPage() {
  useSEO({
    title: "Vocabulary Review",
    description: "Review your Korean vocabulary with spaced repetition on Klovers. Master words faster with smart flashcard scheduling.",
    canonical: "https://kloversegy.com/review",
  });

  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { dueCards, loading: srsLoading, recordReview } = useSRS();
  const { awardXp, leaguePromotion, newBadges, clearLeaguePromotion, clearNewBadges } = useGamification();
  const { toast: uiToast } = useToast();
  const [sessionStarted, setSessionStarted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonOptions, setLessonOptions] = useState<{ id: number; title: string }[]>([]);
  const [sessionCardCount, setSessionCardCount] = useState(0);

  useEffect(() => {
    if (newBadges.length > 0) {
      newBadges.forEach(badgeKey => {
        const badge = BADGES.find(b => b.key === badgeKey);
        if (badge) {
          uiToast({
            description: <BadgeUnlockToast badgeName={badge.name} badgeEmoji={badge.emoji} />,
            duration: 4000,
          });
        }
      });
      clearNewBadges();
    }
  }, [newBadges]);

  useEffect(() => {
    if (dueCards.length === 0) return;
    const lessonIds = [...new Set(dueCards.map(c => c.lesson_id).filter(Boolean))];
    if (lessonIds.length === 0) return;
    supabase
      .from("textbook_lessons")
      .select("id, title_en, sort_order")
      .in("id", lessonIds)
      .order("sort_order")
      .then(({ data, error }) => {
        if (error) {
          console.error("[VocabularyReviewPage] lesson filter", error);
          return;
        }
        setLessonOptions((data || []).map((l: any) => ({
          id: l.id,
          title: isAr ? `الدرس ${toArabicDigits(l.sort_order)}: ${l.title_en}` : `Lesson ${l.sort_order}: ${l.title_en}`,
        })));
      });
  }, [dueCards, isAr]);

  const filteredCards = selectedLessonId ? dueCards.filter(c => c.lesson_id === selectedLessonId) : dueCards;

  const handleReviewComplete = async (vocabId: number, quality: number) => {
    try {
      await recordReview(vocabId, quality);
      // Count the card for this session's summary. VocabularyReview rates
      // 0 Again · 1 Hard · 2 Ok · 3 Good · 4 Easy; Good and Easy count as mastered.
      setReviewedCount((prev) => prev + 1);
      if (quality >= 3) setMasteredCount((prev) => prev + 1);
      setXpEarned((prev) => prev + 5);
      await awardXp(0, "review");
    } catch {
      toast.error(isAr ? "تعذّر حفظ المراجعة، يُرجى المحاولة مرة أخرى." : "Could not save review. Please try again.");
    }
  };

  useEffect(() => {
    if (reviewedCount > 0 && sessionCardCount > 0 && reviewedCount >= sessionCardCount && !sessionComplete) {
      setSessionComplete(true);
    }
  }, [reviewedCount, sessionCardCount, sessionComplete]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Header />
      <main id="main-content" className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Page header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate("/textbook")} className="mb-4 -ms-2">
              {isAr ? "العودة للكتاب" : "Back to Textbook"}
            </Button>
            {/* World mode: review lives in Cluby's Memory Garden (lead: Cluby).
                Scene with Cluby holding a clover: Re's image, 25 Sep 2026. */}
            <div className="relative mb-3 h-28 overflow-hidden rounded-2xl border border-border bg-ivory dark:bg-card md:h-40">
              <img
                src="/assets/story/world-memory-garden-cluby-leaf.webp"
                alt={isAr ? "كلوبي يحمل ورقة برسيم في حديقة الذاكرة، حيث تنمو الكلمات التي تعلّمها الطالب" : "Cluby holding a clover leaf in the Memory Garden, where learned words grow"}
                width={1600}
                height={900}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4">
                <span className="shrink-0 rounded-xl bg-ivory p-1"><KloverIcon name="books-stack" className="h-9 w-9 md:h-11 md:w-11" /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-klovers-yellow">{isAr ? "حديقة ذاكرة كلوبي" : "Cluby's Memory Garden"}</p>
                  <h1 className="font-display text-2xl font-extrabold leading-tight text-white md:text-4xl">{isAr ? "مراجعة المفردات" : "Vocabulary Review"}</h1>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">{isAr ? "هنا تُزرع كل كلمة جديدة، وبالتكرار المتباعد يعيد كلوبي كل كلمة قبل أن تذبل في الذاكرة." : "Every new word is planted here. With spaced repetition, Cluby brings each one back just before it fades."}</p>
          </div>

          {/* Stats cards */}
          {!sessionStarted && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: isAr ? "مطلوب اليوم" : "Due Today", value: filteredCards.length, sub: isAr ? "بطاقات جاهزة للمراجعة" : "cards ready to review" },
                { label: isAr ? "الوقت المطلوب" : "Time Needed", value: Math.max(1, Math.ceil(filteredCards.length / 6)), sub: isAr ? "دقائق (حوالي ٦ بطاقات في الدقيقة)" : "minutes (about 6 cards a minute)" },
                { label: isAr ? "XP متاحة" : "XP Available", value: `${filteredCards.length * 5}`, sub: isAr ? "5 XP لكل بطاقة" : "5 XP per card" },
              ].map(({ label, value, sub }) => (
                <Card key={label}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-foreground">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Main content */}
          {srsLoading ? (
            <Card className="border-2">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-klovers-yellow border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-muted-foreground">{isAr ? "جارٍ تحميل مراجعة المفردات..." : "Loading your vocabulary review…"}</p>
                </div>
              </CardContent>
            </Card>
          ) : dueCards.length === 0 && !sessionStarted ? (
            <Card className="border-2">
              <CardContent className="text-center py-12">
                <KloverIcon name="sprout" className="mx-auto mb-4 h-16 w-16" />
                <h2 className="text-2xl font-bold text-foreground mb-2">{isAr ? "لا توجد بطاقات مطلوبة اليوم!" : "No Cards Due Today!"}</h2>
                <p className="text-muted-foreground mb-6">{isAr ? "اكتملت مراجعة جميع المفردات، وتعود الحديقة بكلمات جديدة غدًا." : "Every word has been reviewed. The garden will have new ones tomorrow."}</p>
                <Button onClick={() => navigate("/textbook")} className="gap-2">
                  {isAr ? "مواصلة التعلّم" : "Continue Learning"}
                </Button>
              </CardContent>
            </Card>
          ) : !sessionStarted ? (
            <Card className="border-2">
              <CardContent className="py-12 text-center">
                <KloverIcon name="flashcard-ga" className="mx-auto mb-4 h-16 w-16" />
                <h2 className="text-2xl font-bold text-foreground mb-4">{isAr ? "هل حان وقت المراجعة؟" : "Ready to Review?"}</h2>
                <p className="cluby-note mb-3 text-base text-foreground/80" lang={isAr ? "ar" : "en"}>
                  {isAr ? "«كلوبي حفظ لك هذه الكلمات»" : "Cluby saved these for you."}
                </p>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {isAr
                    ? <>لديك <strong>{filteredCards.length}</strong> مفردة جاهزة. ستستغرق هذه الجلسة حوالي {Math.max(1, Math.ceil(filteredCards.length / 6))} دقائق.</>
                    : <>You have <strong>{filteredCards.length}</strong> vocabulary items ready. This session will take about {Math.max(1, Math.ceil(filteredCards.length / 6))} minutes.</>
                  }
                </p>
                {lessonOptions.length > 1 && (
                  <div className="mb-6 text-start">
                    <label className="block text-sm font-medium text-foreground mb-2">{isAr ? "تصفية حسب الدرس" : "Filter by lesson"}</label>
                    <select
                      value={selectedLessonId ?? ""}
                      onChange={e => setSelectedLessonId(e.target.value ? Number(e.target.value) : null)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-klovers-yellow"
                    >
                      <option value="">{isAr ? `جميع الدروس (${toArabicDigits(dueCards.length)} بطاقة)` : `All lessons (${dueCards.length} cards)`}</option>
                      {lessonOptions.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.title} ({isAr ? `${toArabicDigits(dueCards.filter(c => c.lesson_id === l.id).length)} بطاقة` : `${dueCards.filter(c => c.lesson_id === l.id).length} cards`})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Button onClick={() => { setSessionCardCount(filteredCards.length); setSessionStarted(true); }} size="lg" className="gap-2">
                  {isAr ? "بدء جلسة المراجعة" : "Start Review Session"}
                </Button>
                <div className="mt-8 text-start space-y-3 bg-muted/50 p-6 rounded-xl">
                  <h3 className="font-semibold text-sm text-foreground"><KloverIcon name="lightbulb-sprout" className="me-1 inline h-6 w-6 align-middle" />{isAr ? "نصائح" : "Tips"}</h3>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    <li>• {isAr ? "التقييم الصادق يساعد الخوارزمية على العمل بشكل أفضل" : "Rate yourself honestly, this helps the algorithm work better"}</li>
                    <li>• {isAr ? "\"مرة أخرى\" = نسيان تام (البطاقة تتكرر غداً)" : "\"Again\" = complete blackout (card repeats tomorrow)"}</li>
                    <li>• {isAr ? "\"سهل\" = إجابة مثالية (البطاقة لن تظهر لأسابيع)" : "\"Easy\" = perfect response (card won't appear for weeks)"}</li>
                    <li>• {isAr ? "استراحة قصيرة كل 20 بطاقة تحافظ على التركيز" : "Take breaks every 20 cards to stay focused"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            sessionComplete ? (
              <Card className="border-2">
                <CardContent className="py-12 text-center space-y-5">
                  <KloverIcon name="badge-blossom" className="mx-auto h-16 w-16" />
                  <h2 className="text-2xl font-bold text-foreground">{isAr ? "اكتملت الجلسة!" : "Session Complete!"}</h2>
                  <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{reviewedCount}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "تمت المراجعة" : "Reviewed"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground"><span className="rounded-full bg-klovers-green px-2 text-charcoal">{masteredCount}</span></p>
                      <p className="text-xs text-muted-foreground">{isAr ? "تم الإتقان" : "Mastered"}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">+{xpEarned}</p>
                      <p className="text-xs text-muted-foreground">{isAr ? "XP مكتسب" : "XP Earned"}</p>
                    </div>
                  </div>
                  {masteredCount === reviewedCount && (
                    <p className="text-sm font-medium text-foreground"><span className="me-1.5 inline-block h-2 w-2 rounded-full bg-klovers-green" aria-hidden="true" />{isAr ? "جلسة مثالية: كل البطاقات معروفة" : "Perfect session: you knew every card"}</p>
                  )}
                  <div className="flex gap-3 justify-center pt-2">
                    <Button variant="outline" onClick={() => { setSessionComplete(false); setSessionStarted(false); setReviewedCount(0); setMasteredCount(0); setXpEarned(0); }}>
                      {isAr ? "مراجعة مرة أخرى" : "Review Again"}
                    </Button>
                    <Button onClick={() => navigate("/dashboard")}>
                      {isAr ? "العودة للوحة التحكم" : "Back to Dashboard"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div>
                <VocabularyReview cards={filteredCards} onComplete={handleReviewComplete} isLoading={srsLoading} />
                {xpEarned > 0 && (
                  <div className="mt-8 text-center">
                    <Card className="border-2 border-klovers-yellow bg-ivory dark:bg-card">
                      <CardContent className="pt-6 pb-5">
                        <p className="text-sm text-muted-foreground mb-1">{isAr ? "XP مكتسب في هذه الجلسة" : "XP Earned This Session"}</p>
                        <p className="text-3xl font-bold text-foreground">+{xpEarned} XP</p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </main>
      <Footer />
      {leaguePromotion && (
        <LeaguePromotionModal
          fromLeague={leaguePromotion.fromLeague}
          toLeague={leaguePromotion.toLeague}
          onClose={clearLeaguePromotion}
        />
      )}
    </div>
  );
}
