import { useLanguage } from "@/contexts/LanguageContext";
import { toArabicDigits } from "@/lib/trustFigures";

/**
 * Right/wrong line shown under a game question. One place for the wording so
 * the Arabic page reads Arabic («نقاط الخبرة», Arabic-Indic digits) and no
 * game carries emoji (brand guard, 27 Sep 2026).
 */
export const CorrectText = ({ korean, xp = 5 }: { korean?: string; xp?: number }) => {
  const { language } = useLanguage();
  if (language === "ar") {
    return <>{`${korean ? `${korean} ` : ""}إجابة صحيحة، +${toArabicDigits(xp)} نقاط خبرة`}</>;
  }
  return <>{`${korean ?? "Correct!"} +${xp} XP`}</>;
};

export const AnswerText = ({ answer }: { answer: string }) => {
  const { language } = useLanguage();
  return <>{language === "ar" ? `الإجابة: ${answer}` : `Answer: ${answer}`}</>;
};
