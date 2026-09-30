import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon from "@/components/KloverIcon";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import kloversLogo from "@/assets/klovers-logo.jpg";
import { toArabicDigits } from "@/lib/trustFigures";

type LetterRow = { char: string; rom: string; ex: string; ar: string; exAr: string; noteAr?: string };

/*
 * Pronunciation in Arabic script for the Arabic sheet (28 Sep 2026), so the
 * Arabic page carries no Latin romanization. Same conventions as the Arabic
 * transliterations in src/constants/eras.ts (ㄱ = غ, final ㅇ = نغ, ㅐ = يه)
 * and the «غا» «هان» «غوك» examples below. Arabic has no p and one letter
 * for several Korean vowels, so `noteAr` adds a short hint where two
 * letters would otherwise read the same. For Re's review: these are teaching
 * choices, not a standard.
 */
const CONSONANTS: LetterRow[] = [
  { char: "ㄱ", rom: "g / k",  ex: "가 (ga)",  ar: "غ / ك",     exAr: "가 «غا»" },
  { char: "ㄴ", rom: "n",      ex: "나 (na)",  ar: "ن",         exAr: "나 «نا»" },
  { char: "ㄷ", rom: "d / t",  ex: "다 (da)",  ar: "د / ت",     exAr: "다 «دا»" },
  { char: "ㄹ", rom: "r / l",  ex: "라 (ra)",  ar: "ر / ل",     exAr: "라 «را»" },
  { char: "ㅁ", rom: "m",      ex: "마 (ma)",  ar: "م",         exAr: "마 «ما»" },
  { char: "ㅂ", rom: "b / p",  ex: "바 (ba)",  ar: "ب",         exAr: "바 «با»" },
  { char: "ㅅ", rom: "s",      ex: "사 (sa)",  ar: "س",         exAr: "사 «سا»" },
  { char: "ㅇ", rom: "– / ng", ex: "아 (a)",   ar: "صامت / نغ", exAr: "아 «آ»" },
  { char: "ㅈ", rom: "j",      ex: "자 (ja)",  ar: "ج",         exAr: "자 «جا»" },
  { char: "ㅊ", rom: "ch",     ex: "차 (cha)", ar: "تش",        exAr: "차 «تشا»", noteAr: "مع نَفَس" },
  { char: "ㅋ", rom: "k",      ex: "카 (ka)",  ar: "ك",         exAr: "카 «كا»",  noteAr: "مع نَفَس" },
  { char: "ㅌ", rom: "t",      ex: "타 (ta)",  ar: "ت",         exAr: "타 «تا»",  noteAr: "مع نَفَس" },
  { char: "ㅍ", rom: "p",      ex: "파 (pa)",  ar: "ب",         exAr: "파 «با»",  noteAr: "مع نَفَس" },
  { char: "ㅎ", rom: "h",      ex: "하 (ha)",  ar: "ه",         exAr: "하 «ها»" },
];

const DOUBLE_CONSONANTS: LetterRow[] = [
  { char: "ㄲ", rom: "kk",  ex: "까 (kka)", ar: "كّ", exAr: "까 «كّا»" },
  { char: "ㄸ", rom: "tt",  ex: "따 (tta)", ar: "تّ", exAr: "따 «تّا»" },
  { char: "ㅃ", rom: "pp",  ex: "빠 (ppa)", ar: "بّ", exAr: "빠 «بّا»" },
  { char: "ㅆ", rom: "ss",  ex: "싸 (ssa)", ar: "سّ", exAr: "싸 «سّا»" },
  { char: "ㅉ", rom: "jj",  ex: "짜 (jja)", ar: "جّ", exAr: "짜 «جّا»" },
];

const VOWELS: LetterRow[] = [
  { char: "ㅏ", rom: "a",   ex: "아 (a)",   ar: "آ",   exAr: "아 «آ»" },
  { char: "ㅑ", rom: "ya",  ex: "야 (ya)",  ar: "يا",  exAr: "야 «يا»" },
  { char: "ㅓ", rom: "eo",  ex: "어 (eo)",  ar: "أو",  exAr: "어 «أو»",  noteAr: "مفتوحة" },
  { char: "ㅕ", rom: "yeo", ex: "여 (yeo)", ar: "يو",  exAr: "여 «يو»",  noteAr: "مفتوحة" },
  { char: "ㅗ", rom: "o",   ex: "오 (o)",   ar: "أو",  exAr: "오 «أو»",  noteAr: "مستديرة" },
  { char: "ㅛ", rom: "yo",  ex: "요 (yo)",  ar: "يو",  exAr: "요 «يو»",  noteAr: "مستديرة" },
  { char: "ㅜ", rom: "u",   ex: "우 (u)",   ar: "أُو", exAr: "우 «أُو»", noteAr: "مضمومة" },
  { char: "ㅠ", rom: "yu",  ex: "유 (yu)",  ar: "يُو", exAr: "유 «يُو»", noteAr: "مضمومة" },
  { char: "ㅡ", rom: "eu",  ex: "으 (eu)",  ar: "أُ",  exAr: "으 «أُ»",  noteAr: "دون ضم الشفتين" },
  { char: "ㅣ", rom: "i",   ex: "이 (i)",   ar: "إي",  exAr: "이 «إي»" },
];

const COMPOUND_VOWELS: LetterRow[] = [
  { char: "ㅐ", rom: "ae",  ex: "애 (ae)",  ar: "إيه", exAr: "애 «إيه»" },
  { char: "ㅒ", rom: "yae", ex: "얘 (yae)", ar: "ييه", exAr: "얘 «ييه»" },
  { char: "ㅔ", rom: "e",   ex: "에 (e)",   ar: "إيه", exAr: "에 «إيه»", noteAr: "مثل ㅐ" },
  { char: "ㅖ", rom: "ye",  ex: "예 (ye)",  ar: "ييه", exAr: "예 «ييه»", noteAr: "مثل ㅒ" },
  { char: "ㅘ", rom: "wa",  ex: "와 (wa)",  ar: "وا",  exAr: "와 «وا»" },
  { char: "ㅙ", rom: "wae", ex: "왜 (wae)", ar: "ويه", exAr: "왜 «ويه»" },
  { char: "ㅚ", rom: "oe",  ex: "외 (oe)",  ar: "ويه", exAr: "외 «ويه»", noteAr: "مثل ㅙ" },
  { char: "ㅝ", rom: "wo",  ex: "워 (wo)",  ar: "وو",  exAr: "워 «وو»" },
  { char: "ㅞ", rom: "we",  ex: "웨 (we)",  ar: "ويه", exAr: "웨 «ويه»", noteAr: "مثل ㅙ" },
  { char: "ㅟ", rom: "wi",  ex: "위 (wi)",  ar: "وي",  exAr: "위 «وي»" },
  { char: "ㅢ", rom: "ui",  ex: "의 (ui)",  ar: "أُي", exAr: "의 «أُي»" },
];

/** The rules page at the end of the printed sheet. */
const RULES: { en: string; ar: string; ex: string }[] = [
  { en: "Every syllable is one block: a consonant, a vowel, and sometimes a final consonant.", ar: "كل مقطع مربع واحد: حرف ساكن وحرف مدّ، وأحيانًا حرف ساكن أخير.", ex: "가 · 한 · 국" },
  { en: "Read a block left to right, then top to bottom.", ar: "يُقرأ المربع من اليسار إلى اليمين، ثم من أعلى إلى أسفل.", ex: "한 = ㅎ → ㅏ → ㄴ" },
  { en: "Tall vowels sit to the right of the consonant; flat vowels sit under it.", ar: "حروف المدّ الطويلة تُكتب يمين الحرف الساكن، والمسطّحة تُكتب تحته.", ex: "가 · 거 · 고 · 구" },
  { en: "No block starts with a vowel alone: a silent ㅇ holds its place.", ar: "لا يبدأ المربع بحرف مدّ وحده، بل يسبقه ㅇ صامت.", ex: "아 · 오 · 이" },
  { en: "At the end of a block, ㅇ is no longer silent: it sounds \"ng\".", ar: "في آخر المربع لا يكون ㅇ صامتًا، بل يُنطق «نغ».", ex: "강 · 방 · 공" },
  { en: "A final consonant is pronounced with only seven sounds: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ.", ar: "الحرف الأخير يُنطق بسبعة أصوات فقط: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ.", ex: "옷 → [옫] · 부엌 → [부억]" },
  { en: "Write each letter top to bottom, left to right.", ar: "يُكتب كل حرف من أعلى إلى أسفل، ومن اليسار إلى اليمين.", ex: "ㄱ · ㅏ · 가" },
];

const LetterGrid = ({ items, label, isAr }: { items: LetterRow[]; label: string; isAr: boolean }) => (
  <div className="mb-10 print:mb-4 break-inside-avoid">
    <h2 className="text-lg font-black text-foreground mb-3 border-b border-border pb-1 print:mb-2">{label}</h2>
    <div dir="ltr" className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 print:grid-cols-7 gap-2 print:gap-1.5">
      {items.map((item) => (
        <div
          key={item.char}
          className="flex flex-col items-center bg-card border border-border rounded-xl p-3 print:p-1.5 print:rounded-lg hover:border-primary/50 transition-colors break-inside-avoid"
        >
          <span lang="ko" className="text-3xl print:text-2xl font-black text-foreground leading-none mb-1">{item.char}</span>
          {isAr ? (
            <>
              <span dir="rtl" className="text-xs font-bold text-foreground">{item.ar}</span>
              {item.noteAr && <span dir="rtl" className="text-[10px] text-muted-foreground">{item.noteAr}</span>}
              <span dir="rtl" className="text-[10px] text-muted-foreground mt-0.5">{item.exAr}</span>
            </>
          ) : (
            <>
              <span className="text-xs font-bold text-foreground">{item.rom}</span>
              <span lang="ko" className="text-[10px] text-muted-foreground mt-0.5">{item.ex}</span>
            </>
          )}
        </div>
      ))}
    </div>
  </div>
);

/**
 * /hangul-starter — world mode (27 Sep 2026): this sheet is the gate of
 * Hangul Village, the first world in the Klovers canon
 * (src/config/klovers-world.ts). Arabic in neutral MSA, Klovers icons only,
 * no emoji. The letter tables and every fact are unchanged.
 */
const HangulStarterPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  /*
   * 30 Sep 2026 — the free Hangul book is sold from the shop at price 0 (no
   * card, no account). From this story page a visitor puts it in the bag and
   * lands on the shop with the bag already open. The shop code is loaded only
   * on this click, so the sheet itself stays light. If the product is not in
   * the shop yet the visitor gets the PDF directly.
   */
  const addBookToBag = async () => {
    setAdding(true);
    try {
      const shop = await import("@/lib/shop");
      const products = await shop.fetchShopProducts();
      const book = products.find((p) => p.slug === "hangul-starter-free" && shop.visibleIn(p, isAr));
      if (book) {
        shop.cartActions.add(book);
        navigate("/shop?bag=1");
      } else {
        window.location.href = isAr ? "/hangul-starter-ar.pdf" : "/hangul-starter-en.pdf";
      }
    } catch {
      window.location.href = isAr ? "/hangul-starter-ar.pdf" : "/hangul-starter-en.pdf";
    } finally {
      setAdding(false);
    }
  };

  useSEO({
    title: isAr ? "ورقة الهانغول المجانية: الأبجدية الكورية" : "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description: isAr
      ? "تعلُّم الأبجدية الكورية (الهانغول) مجانًا: الحروف الساكنة والمتحركة كاملة مع دليل للنطق بشرح مبسّط، وقابلة للطباعة."
      : "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
    canonical: "https://kloversegy.com/hangul-starter",
  });

  return (
    <div className="min-h-screen bg-background print:bg-white">
      {/* Print (27 Sep 2026, Re's print preview): the sticky header covered the
          first heading, the floating WhatsApp button sat on the letters and
          the grid split across three pages. On paper: no header, footer or
          floating buttons, a small title line, 7 letters per row, and no
          block split between pages. */}
      <style>{`@media print {
        @page { margin: 12mm; }
        .fixed, [class*="fixed "], [class^="fixed"] { display: none !important; }
      }`}</style>
      <div className="print:hidden"><Header /></div>
      <main id="main-content" className="pt-16 print:pt-0">

        {/* Paper-only COVER (Re, 27 Sep 2026: logo + cover first, rules
            page last). Hidden on screen; one full page when printed. */}
        <div className="hidden print:flex flex-col items-center justify-center text-center min-h-[250mm]" style={{ pageBreakAfter: "always" }}>
          <img src={kloversLogo} alt="Klovers" className="h-24 w-24 rounded-full border-4 border-klovers-yellow object-cover mb-4" />
          <p className="text-sm font-bold tracking-[0.25em] text-foreground/70 mb-2">
            {tr("KLOVERS · HANGUL VILLAGE", "كلوفرز · قرية الهانغول")}
          </p>
          <h1 className="font-display text-4xl font-black text-foreground mb-2">
            {tr("Hangul starter sheet", "ورقة الهانغول")}
          </h1>
          <p className="text-base text-foreground/80 mb-6 max-w-md">
            {tr(
              "Every Korean letter on one sheet, with its sound, and the rules for reading a block.",
              "كل الحروف الكورية في ورقة واحدة، مع نطق كل حرف، وقواعد قراءة المقطع.",
            )}
          </p>
          <img
            src="/assets/story/world-hangul-village.webp"
            alt={tr("Hangul Village", "قرية الهانغول")}
            className="w-full max-w-[160mm] rounded-2xl border-2 border-charcoal object-cover aspect-[16/9]"
          />
          <p className="mt-6 text-sm font-bold text-foreground">
            {tr("Reham Elshrkawy · Al-Alsun Korean graduate", "ريهام الشرقاوي · خريجة الألسن، قسم اللغة الكورية")}
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">kloversegy.com</p>
        </div>

        {/* Small running title above the tables on paper */}
        <div className="hidden print:flex items-center justify-between mb-3 border-b border-foreground/30 pb-1">
          <img src={kloversLogo} alt="" aria-hidden="true" className="h-8 w-8 rounded-full object-cover" />
          <p className="text-xs font-bold text-foreground">{tr("Hangul starter sheet · Klovers", "ورقة الهانغول · كلوفرز")}</p>
          <p className="text-[10px] text-muted-foreground" dir="ltr">kloversegy.com</p>
        </div>

        {/* Hero */}
        <section className="py-12 md:py-16 border-b border-border bg-ivory dark:bg-muted/30 print:hidden">
          <div className="container mx-auto px-4 max-w-3xl text-center">
            <KloverIcon name="hanok-cherry-tree" className="mx-auto mb-3 h-16 w-16" />
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-foreground/70 mb-2">
              {tr("Hangul Village · the first gate", "قرية الهانغول · البوابة الأولى")}
            </p>
            <h1 className="font-display text-3xl md:text-4xl font-black text-foreground mb-3">
              {tr("Free Hangul starter sheet", "ورقة الهانغول المجانية")}
            </h1>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto leading-relaxed">
              {tr(
                "Every sign in the village is written in these letters. Here they all are on one page, with the right sound for each. Print it, keep it, and read the first sign today.",
                "كل لافتة في القرية مكتوبة بهذه الحروف. وهنا تجتمع كلها في صفحة واحدة، مع النطق الصحيح لكل حرف. طباعتها أو حفظها، ثم قراءة أول لافتة اليوم.",
              )}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild variant="outline">
                <a href={isAr ? "/hangul-starter-ar.pdf" : "/hangul-starter-en.pdf"} download>
                  {tr("Download the free PDF", "تحميل الورقة المجانية للطباعة")}
                </a>
              </Button>
              <Button onClick={addBookToBag} disabled={adding}>
                {adding ? tr("Opening the bag…", "جارٍ فتح الحقيبة…") : tr("Add the free book to your bag", "إضافة الكتاب المجاني إلى الحقيبة")}
              </Button>
              <Button asChild variant="outline">
                <Link to="/free-trial">{tr("Book a free class", "حجز حصة مجانية")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Alphabet tables */}
        <section className="py-12 print:py-0">
          <div className="container mx-auto px-4 max-w-4xl">

            {/* Syllable block explainer */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-10 print:mb-4 print:p-3 print:border-foreground break-inside-avoid">
              <h2 className="font-black text-foreground mb-2">
                {tr("How Korean syllable blocks work", "كيف تُبنى المقاطع الكورية")}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {tr(
                  "Korean is written in syllable blocks: each block is one syllable, a consonant plus a vowel, sometimes with a final consonant.",
                  "تُكتب الكورية في مربعات، وكل مربع مقطع صوتي واحد: حرف ساكن وحرف مدّ، وأحيانًا حرف ساكن أخير.",
                )}
              </p>
              <div dir="ltr" className="flex flex-wrap gap-6 items-center">
                {[
                  { syl: "가", breakdown: "ㄱ + ㅏ", meaning: isAr ? "«غا»" : '"ga"' },
                  { syl: "한", breakdown: "ㅎ + ㅏ + ㄴ", meaning: isAr ? "«هان»" : '"han"' },
                  { syl: "국", breakdown: "ㄱ + ㅜ + ㄱ", meaning: isAr ? "«غوك»" : '"guk"' },
                ].map(({ syl, breakdown, meaning }) => (
                  <div key={syl} className="flex items-center gap-3 bg-ivory dark:bg-muted border border-border rounded-xl px-4 py-3">
                    <span lang="ko" className="text-4xl font-black text-foreground">{syl}</span>
                    <div>
                      <p lang="ko" className="text-sm font-semibold text-foreground">{breakdown}</p>
                      <p dir={isAr ? "rtl" : "ltr"} className="text-xs text-muted-foreground text-left">{meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <LetterGrid
              items={CONSONANTS}
              label={isAr ? "الحروف الساكنة الأساسية (١٤)" : "Basic Consonants (14)"}
              isAr={isAr}
            />
            <LetterGrid
              items={DOUBLE_CONSONANTS}
              label={isAr ? "الحروف الساكنة المضاعفة (٥)" : "Double Consonants (5)"}
              isAr={isAr}
            />
            <LetterGrid
              items={VOWELS}
              label={isAr ? "حروف المد الأساسية (١٠)" : "Basic Vowels (10)"}
              isAr={isAr}
            />
            <LetterGrid
              items={COMPOUND_VOWELS}
              label={isAr ? "حروف المد المركبة (١١)" : "Compound Vowels (11)"}
              isAr={isAr}
            />

            {/* Paper-only RULES page: how a Korean block is read and written. */}
            <div className="hidden print:block" style={{ pageBreakBefore: "always" }}>
              <div className="flex items-center justify-between mb-3 border-b border-foreground/30 pb-1">
                <img src={kloversLogo} alt="" aria-hidden="true" className="h-8 w-8 rounded-full object-cover" />
                <p className="text-xs font-bold text-foreground">{tr("Reading rules · Klovers", "قواعد القراءة · كلوفرز")}</p>
                <p className="text-[10px] text-muted-foreground" dir="ltr">kloversegy.com</p>
              </div>
              <h2 className="font-display text-2xl font-black text-foreground mb-4">
                {tr("Seven rules of Hangul Village", "سبع قواعد في قرية الهانغول")}
              </h2>
              <ol className="space-y-3 text-sm text-foreground">
                {RULES.map((r, i) => (
                  <li key={i} className="flex gap-3 break-inside-avoid border border-border rounded-xl p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-klovers-yellow font-black text-charcoal">{isAr ? toArabicDigits(i + 1) : i + 1}</span>
                    <div>
                      <p className="font-bold">{isAr ? r.ar : r.en}</p>
                      <p className="mt-1 font-ko text-lg" lang="ko" dir="ltr">{r.ex}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-center text-xs text-muted-foreground">
                {tr(
                  "The alphabet at Klovers is four live classes with the teacher. The first class is free: kloversegy.com/free-trial",
                  "الأبجدية في كلوفرز أربع حصص مباشرة مع المعلمة، والحصة الأولى مجانية: kloversegy.com/free-trial",
                )}
              </p>
            </div>

            {/* Quick tips */}
            <div className="bg-ivory dark:bg-muted/30 border border-border rounded-2xl p-6 print:hidden">
              <h2 className="font-black text-foreground mb-3">
                {tr("Three facts that make the village easy", "ثلاث حقائق تجعل القرية سهلة")}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>{tr("King Sejong had Hangul designed in 1443 so that anyone could learn to read quickly.", "صُمّم الهانغول بأمر الملك سيجونغ عام ١٤٤٣ م، ليتعلّم أي أحد القراءة بسرعة.")}</li>
                <li>{tr("Many consonants are drawn from the shape the mouth makes to say them.", "كثير من الحروف الساكنة مرسوم على شكل الفم عند نطقها.")}</li>
                <li>{tr("No need to memorize it all first: at Klovers the alphabet is four live classes with the teacher.", "لا حاجة إلى حفظ كل شيء أولًا: الأبجدية في كلوفرز أربع حصص مباشرة مع المعلمة.")}</li>
              </ul>
              <div className="mt-5">
                <Button asChild className="w-full sm:w-auto">
                  <Link to="/free-trial">{tr("Start with a real teacher, free", "البداية مع معلمة حقيقية، مجانًا")}</Link>
                </Button>
              </div>
            </div>

          </div>
        </section>
      </main>
      <div className="print:hidden"><Footer /></div>
    </div>
  );
};

export default HangulStarterPage;
