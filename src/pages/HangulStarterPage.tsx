import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import KloverIcon from "@/components/KloverIcon";
import { Link } from "react-router-dom";

const CONSONANTS = [
  { char: "ㄱ", rom: "g / k",  ex: "가 (ga)" },
  { char: "ㄴ", rom: "n",      ex: "나 (na)" },
  { char: "ㄷ", rom: "d / t",  ex: "다 (da)" },
  { char: "ㄹ", rom: "r / l",  ex: "라 (ra)" },
  { char: "ㅁ", rom: "m",      ex: "마 (ma)" },
  { char: "ㅂ", rom: "b / p",  ex: "바 (ba)" },
  { char: "ㅅ", rom: "s",      ex: "사 (sa)" },
  { char: "ㅇ", rom: "– / ng", ex: "아 (a)" },
  { char: "ㅈ", rom: "j",      ex: "자 (ja)" },
  { char: "ㅊ", rom: "ch",     ex: "차 (cha)" },
  { char: "ㅋ", rom: "k",      ex: "카 (ka)" },
  { char: "ㅌ", rom: "t",      ex: "타 (ta)" },
  { char: "ㅍ", rom: "p",      ex: "파 (pa)" },
  { char: "ㅎ", rom: "h",      ex: "하 (ha)" },
];

const DOUBLE_CONSONANTS = [
  { char: "ㄲ", rom: "kk",  ex: "까 (kka)" },
  { char: "ㄸ", rom: "tt",  ex: "따 (tta)" },
  { char: "ㅃ", rom: "pp",  ex: "빠 (ppa)" },
  { char: "ㅆ", rom: "ss",  ex: "싸 (ssa)" },
  { char: "ㅉ", rom: "jj",  ex: "짜 (jja)" },
];

const VOWELS = [
  { char: "ㅏ", rom: "a",   ex: "아 (a)" },
  { char: "ㅑ", rom: "ya",  ex: "야 (ya)" },
  { char: "ㅓ", rom: "eo",  ex: "어 (eo)" },
  { char: "ㅕ", rom: "yeo", ex: "여 (yeo)" },
  { char: "ㅗ", rom: "o",   ex: "오 (o)" },
  { char: "ㅛ", rom: "yo",  ex: "요 (yo)" },
  { char: "ㅜ", rom: "u",   ex: "우 (u)" },
  { char: "ㅠ", rom: "yu",  ex: "유 (yu)" },
  { char: "ㅡ", rom: "eu",  ex: "으 (eu)" },
  { char: "ㅣ", rom: "i",   ex: "이 (i)" },
];

const COMPOUND_VOWELS = [
  { char: "ㅐ", rom: "ae",  ex: "애 (ae)" },
  { char: "ㅒ", rom: "yae", ex: "얘 (yae)" },
  { char: "ㅔ", rom: "e",   ex: "에 (e)" },
  { char: "ㅖ", rom: "ye",  ex: "예 (ye)" },
  { char: "ㅘ", rom: "wa",  ex: "와 (wa)" },
  { char: "ㅙ", rom: "wae", ex: "왜 (wae)" },
  { char: "ㅚ", rom: "oe",  ex: "외 (oe)" },
  { char: "ㅝ", rom: "wo",  ex: "워 (wo)" },
  { char: "ㅞ", rom: "we",  ex: "웨 (we)" },
  { char: "ㅟ", rom: "wi",  ex: "위 (wi)" },
  { char: "ㅢ", rom: "ui",  ex: "의 (ui)" },
];

type LetterRow = { char: string; rom: string; ex: string };

const LetterGrid = ({ items, label }: { items: LetterRow[]; label: string }) => (
  <div className="mb-10 print:mb-6">
    <h2 className="text-lg font-black text-foreground mb-3 border-b border-border pb-1">{label}</h2>
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
      {items.map((item) => (
        <div
          key={item.char}
          className="flex flex-col items-center bg-card border border-border rounded-xl p-3 hover:border-primary/50 transition-colors"
        >
          <span className="text-3xl font-black text-foreground leading-none mb-1">{item.char}</span>
          <span className="text-xs font-bold text-primary">{item.rom}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">{item.ex}</span>
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

  useSEO({
    title: "Free Hangul Starter Sheet — Korean Alphabet | Klovers",
    description: "Learn the Korean alphabet (Hangul) for free. Complete consonants, vowels, and pronunciation guide — explained simply. Printable.",
    canonical: "https://kloversegy.com/hangul-starter",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16 print:pt-4">

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
              <Button onClick={() => window.print()} variant="outline">
                {tr("Print the sheet", "طباعة الورقة")}
              </Button>
              <Button asChild>
                <Link to="/free-trial">{tr("Book a free class", "حجز حصة مجانية")}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Alphabet tables */}
        <section className="py-12 print:py-4">
          <div className="container mx-auto px-4 max-w-4xl">

            {/* Syllable block explainer */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-10 print:mb-6 print:border-foreground">
              <h2 className="font-black text-foreground mb-2">
                {tr("How Korean syllable blocks work", "كيف تُبنى المقاطع الكورية")}
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                {tr(
                  "Korean is written in syllable blocks: each block is one syllable, a consonant plus a vowel, sometimes with a final consonant.",
                  "تُكتب الكورية في مربعات، وكل مربع مقطع صوتي واحد: حرف ساكن وحرف مدّ، وأحيانًا حرف ساكن أخير.",
                )}
              </p>
              <div className="flex flex-wrap gap-6 items-center">
                {[
                  { syl: "가", breakdown: "ㄱ + ㅏ", meaning: isAr ? "«غا»" : '"ga"' },
                  { syl: "한", breakdown: "ㅎ + ㅏ + ㄴ", meaning: isAr ? "«هان»" : '"han"' },
                  { syl: "국", breakdown: "ㄱ + ㅜ + ㄱ", meaning: isAr ? "«غوك»" : '"guk"' },
                ].map(({ syl, breakdown, meaning }) => (
                  <div key={syl} className="flex items-center gap-3 bg-ivory dark:bg-muted border border-border rounded-xl px-4 py-3">
                    <span className="text-4xl font-black text-foreground">{syl}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{breakdown}</p>
                      <p className="text-xs text-muted-foreground">{meaning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <LetterGrid
              items={CONSONANTS}
              label={isAr ? "الحروف الساكنة الأساسية (١٤)" : "Basic Consonants (14)"}
            />
            <LetterGrid
              items={DOUBLE_CONSONANTS}
              label={isAr ? "الحروف الساكنة المضاعفة (٥)" : "Double Consonants (5)"}
            />
            <LetterGrid
              items={VOWELS}
              label={isAr ? "حروف المد الأساسية (١٠)" : "Basic Vowels (10)"}
            />
            <LetterGrid
              items={COMPOUND_VOWELS}
              label={isAr ? "حروف المد المركبة (١١)" : "Compound Vowels (11)"}
            />

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
      <Footer />
    </div>
  );
};

export default HangulStarterPage;
