import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2 } from "lucide-react";
import { SRSCard } from "@/hooks/useSRS";
import Korean from "@/components/Korean";
import { useLanguage } from "@/contexts/LanguageContext";

interface VocabularyReviewProps {
  cards: SRSCard[];
  /** quality: 0 Again · 1 Hard · 2 Ok · 3 Good · 4 Easy */
  onComplete: (vocabId: number, quality: number) => Promise<void>;
  isLoading?: boolean;
}

/**
 * One flashcard at a time for the Memory Garden (/review).
 * Brand guard (25 Sep 2026): palette only (yellow, charcoal, ivory), no emoji,
 * Arabic in gender-neutral MSA.
 */
export function VocabularyReview({
  cards,
  onComplete,
  isLoading = false,
}: VocabularyReviewProps) {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);

  // The session's deck: the cards as they were when it started. The parent's
  // list is re-fetched after every answer and shrinks (an answered card is no
  // longer due), so walking it by index skipped every other card.
  const [deck, setDeck] = useState<SRSCard[]>(cards);
  useEffect(() => {
    if (deck.length === 0 && cards.length > 0) setDeck(cards);
  }, [cards, deck.length]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentCard = deck[currentIndex];
  const progress = ((currentIndex + 1) / deck.length) * 100;

  const speakKorean = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRating = async (quality: number) => {
    if (!currentCard || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onComplete(currentCard.lesson_vocabulary_id, quality);

      // Move to next card
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
      } else {
        // All cards reviewed
        setCurrentIndex(deck.length);
      }
    } catch (error) {
      console.error("Failed to record review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">{tr("Loading cards...", "جارٍ تحميل البطاقات...")}</div>
      </div>
    );
  }

  if (deck.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold mb-2">{tr("All caught up!", "اكتملت المراجعة!")}</h3>
        <p className="text-muted-foreground">
          {tr("No vocabulary needs review today.", "لا توجد مفردات تحتاج إلى مراجعة اليوم.")}
        </p>
      </div>
    );
  }

  if (currentIndex >= deck.length) {
    return (
      <div className="text-center py-12">
        <h3 className="text-2xl font-bold mb-2">{tr("Review complete!", "اكتملت المراجعة!")}</h3>
        <p className="text-muted-foreground mb-6">
          {isAr ? `تمت مراجعة ${deck.length} من المفردات اليوم.` : `You reviewed ${deck.length} vocabulary items today.`}
        </p>
        <Button
          onClick={() => {
            setCurrentIndex(0);
            setIsFlipped(false);
          }}
        >
          {tr("Start another session", "بدء جلسة أخرى")}
        </Button>
      </div>
    );
  }

  const ratings: { q: number; en: string; ar: string; title: string; titleAr: string }[] = [
    { q: 0, en: "Again", ar: "مرة أخرى", title: "Did not recognise it", titleAr: "لم تُعرف الكلمة" },
    { q: 1, en: "Hard", ar: "صعب", title: "Wrong, but remembered after seeing it", titleAr: "إجابة خاطئة، ثم تذكّر بعد رؤيتها" },
    { q: 2, en: "Ok", ar: "مقبول", title: "Right, with real difficulty", titleAr: "إجابة صحيحة بصعوبة" },
    { q: 3, en: "Good", ar: "جيد", title: "Right, after some hesitation", titleAr: "إجابة صحيحة بعد تردّد بسيط" },
    { q: 4, en: "Easy", ar: "سهل", title: "Right, without hesitation", titleAr: "إجابة صحيحة دون تردّد" },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {isAr ? `البطاقة ${currentIndex + 1} من ${deck.length}` : `Card ${currentIndex + 1} of ${deck.length}`}
          </span>
          <span className="text-muted-foreground">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div
        className="h-64 cursor-pointer perspective"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card
          className={`h-full flex items-center justify-center transition-all duration-300 border-2 hover:shadow-lg ${
            isFlipped ? "bg-ivory dark:bg-card border-klovers-yellow" : "bg-card"
          }`}
        >
          <CardContent className="text-center p-8">
            {isFlipped ? (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{tr("MEANING", "المعنى")}</p>
                <p className="text-3xl font-bold text-foreground">{currentCard.meaning}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{tr("KOREAN", "الكورية")}</p>
                <Korean className="text-5xl font-bold mb-4 block">{currentCard.korean}</Korean>
                <p className="text-lg text-muted-foreground">
                  {currentCard.romanization}
                </p>

                {/* Audio Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    speakKorean(currentCard.korean);
                  }}
                  className="mt-4"
                >
                  <Volume2 className="w-4 h-4 me-2" aria-hidden="true" />
                  {tr("Pronounce", "النطق")}
                </Button>
              </div>
            )}

            <p className="text-xs text-muted-foreground mt-6">
              {isAr
                ? `النقر لقلب البطاقة · رُوجعت ${currentCard.review_count} مرة`
                : `Click to flip • Reviewed ${currentCard.review_count} times`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Buttons */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-center">
          {tr("How well did you remember this?", "ما مدى تذكّر هذه الكلمة؟")}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {ratings.map((r) => (
            <Button
              key={r.q}
              variant={r.q === 4 ? "default" : "outline"}
              disabled={isSubmitting}
              onClick={() => handleRating(r.q)}
              className="text-xs"
              title={isAr ? r.titleAr : r.title}
            >
              {isAr ? r.ar : r.en}
            </Button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {tr("Your rating decides when this card comes back", "يحدّد التقييم موعد عودة هذه البطاقة")}
        </p>
      </div>

      {/* Info Box */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          <p>
            <strong>{tr("Tip:", "نصيحة:")}</strong>{" "}
            {tr(
              "Rate honestly. \"Again\" resets the card, and \"Easy\" waits the longest before showing it again.",
              "الصدق في التقييم مهم: «مرة أخرى» تعيد البطاقة من البداية، و«سهل» يؤجّل ظهورها أطول مدة.",
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
