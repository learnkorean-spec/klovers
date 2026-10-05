import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { ERAS } from "@/constants/eras";

/**
 * /journey — the hub for "a journey through Korea's time" (5 Oct 2026).
 *
 * The five era pages (/journey/:eraId, EraPage.tsx) existed, but /journey
 * itself answered 404, so the journey had stops and no map. This page is that
 * map: the five stations in order, each linking to its own page. All copy
 * comes from ERAS in src/constants/eras.ts, so a sixth era appears here with
 * no edit. The static HTML for crawlers is JOURNEY_BODY_HTML in
 * scripts/prerender-meta.mjs; keep the two in step.
 *
 * Palette only (ivory, charcoal, yellow). No emoji, no generic icons.
 */
export default function JourneyHubPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useSEO({
    title: isAr ? "رحلة عبر زمن كوريا" : "A Journey Through Korea's Time",
    description: isAr
      ? "خمس محطات من تاريخ كوريا: من أسطورة دانغون ومملكة سيلا وعصر جوسون والهانغول، إلى بيت الهانوك والموجة الكورية اليوم."
      : "Five stations of Korean history: the Dangun legend, Silla, the Joseon era and Hangul, the hanok house, and today's Korean wave.",
    canonical: isAr ? "https://kloversegy.com/ar/journey" : "https://kloversegy.com/journey",
    alternates: { en: "https://kloversegy.com/journey", ar: "https://kloversegy.com/ar/journey" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-background" dir={isAr ? "rtl" : "ltr"}>
      <Header />
      <main id="main-content" className="flex-1 pt-20">
        <section className="bg-charcoal text-ivory px-4 py-14 md:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-klovers-yellow text-charcoal text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
              {isAr ? "شارع الثقافة" : "Culture Street"}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight">
              {isAr ? "رحلة عبر زمن كوريا" : "A journey through Korea's time"}
            </h1>
            <p className="mt-4 text-ivory/85 text-base md:text-lg leading-relaxed">
              {isAr
                ? "كل كلمة كورية جاءت من مكان وزمن حقيقيين. خمس محطات، من أول أسطورة إلى اليوم، ولكل محطة كلماتها."
                : "Every Korean word comes from a real place and a real time. Five stations, from the first legend to today, each with its own words."}
            </p>
          </div>
        </section>

        <section className="px-4 py-12 md:py-16">
          <ol className="max-w-5xl mx-auto grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {ERAS.map((era, i) => (
              <li key={era.id}>
                <Link
                  to={`/journey/${era.id}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-charcoal bg-card transition-shadow hover:shadow-[4px_4px_0_hsl(var(--charcoal))] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {era.image ? (
                      <img
                        src={era.image}
                        alt={isAr ? era.altAr : era.altEn}
                        loading={i < 3 ? "eager" : "lazy"}
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-charcoal text-ivory">
                        <span lang="ko" className="font-ko text-3xl font-bold">{era.glyph}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-bold text-muted-foreground">
                      {isAr ? `المحطة ${(i + 1).toLocaleString("ar-EG")}` : `Station ${i + 1}`} · {isAr ? era.datesAr : era.datesEn}
                    </span>
                    <h2 className="mt-1 font-display text-lg font-bold text-foreground">
                      {isAr ? era.titleAr : era.titleEn}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {isAr ? era.introAr : era.introEn}
                    </p>
                    <span className="mt-auto pt-4 inline-flex w-fit rounded-full border-2 border-charcoal bg-klovers-yellow px-3 py-1 text-xs font-bold text-charcoal">
                      {isAr ? "دخول المحطة" : "Enter the station"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-3xl mx-auto rounded-2xl bg-accent p-6 text-center text-charcoal">
            <h2 className="font-display text-xl font-bold">
              {isAr ? "من التاريخ إلى أول جملة كورية" : "From the history to your first Korean sentence"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed">
              {isAr
                ? "أول حصة مباشرة مجانية، بالعربية أو بالإنجليزية."
                : "The first live class is free, in English or Arabic."}
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                to={isAr ? "/ar/free-trial" : "/free-trial"}
                className="rounded-xl border-2 border-charcoal bg-klovers-yellow px-5 py-2.5 text-sm font-bold text-charcoal"
              >
                {isAr ? "حجز حصة مجانية" : "Book a free class"}
              </Link>
              <Link
                to={isAr ? "/ar/blog" : "/blog"}
                className="rounded-xl border-2 border-charcoal bg-ivory px-5 py-2.5 text-sm font-bold text-charcoal"
              >
                {isAr ? "مجلة كلوفرز" : "The Klovers journal"}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
