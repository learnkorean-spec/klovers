import { Link } from "react-router-dom";
import { ArrowRight, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { SCHOLARSHIP_KINDS, VERIFIED_AT } from "@/constants/koreaScholarships";

/**
 * "Scholarships in Korea" — homepage narrative slot 7 (canon:
 * src/config/klovers-world.ts, homepageNarrative). Story lead is the male
 * learner: Adam owns structure, strategy and paperwork, which is what a
 * scholarship application is. Cluby appears once, small, reading — the 3D
 * plush from /assets/cluby/, never the 2D cartoon set in /assets/characters/,
 * which is off-model (KLOVERS-STORY-BIBLE §7).
 *
 * A TEASER, NOT THE ANSWER (Re, 4 Oct 2026)
 *
 * The homepage used to render the six programmes in full, filterable. Re's
 * call: the front page TEASES. The visitor is asked to take the free placement
 * test, and the matched programmes, the gap in months and the plan are shown
 * once there is a real level to match against — which is the canon rule that
 * story and product progress are driven by real learning data, never invented
 * (KLOVERS-STORY-BIBLE §8, §11).
 *
 * WHAT STAYS PUBLIC: every fact. /scholarships carries the six programmes, the
 * amounts that one official page states, the sources and the verification
 * date, and it is prerendered in both languages. Gating the MATCH is a product
 * decision; gating the FACTS about other people's money would not be honest,
 * and the page is also what search engines index for "منح كوريا".
 *
 * VISUAL: charcoal ground, ivory surfaces, yellow only as a chip or a mark. No
 * text is set over a photograph, so no scrim is needed. Every control is 44px.
 */

const COPY = {
  ar: {
    imageAlt: "ممر جامعي كوري في الربيع، أشجار الكرز فوق الممر، وطلاب يسيرون نحو مبنى الجامعة",
    clubyAlt: "كلوبي، رفيق المذاكرة، يقرأ كتابًا",
    clubyNote: "المنحة تبدأ بورقة واحدة: اقرأ الدليل الرسمي قبل أي شيء آخر.",
    covers: "تغطي المنح",
  },
  en: {
    imageAlt: "A Korean campus walkway in spring, cherry blossom overhead, students walking toward the university building",
    clubyAlt: "Cluby, the study companion, reading a book",
    clubyNote: "A scholarship starts with one page: read the official guideline first.",
    covers: "The six programmes cover",
  },
};

const ScholarshipsSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const copy = COPY[isAr ? "ar" : "en"];

  return (
    <section id="scholarships" className="relative overflow-hidden bg-charcoal py-16 md:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 end-0 h-[26rem] w-[26rem] rounded-full"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--klovers-yellow) / 0.14), transparent 70%)",
        }}
      />

      <div className="container relative mx-auto px-4">
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold text-charcoal md:text-sm">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-charcoal" />
              {t("scholarships", "eyebrow")}
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-ivory sm:text-4xl md:text-5xl">
              {t("scholarships", "title")}
            </h2>

            <span aria-hidden="true" className="mt-4 block h-2 w-28 rounded-full bg-klovers-yellow" />

            <p className="mt-5 max-w-xl text-base leading-relaxed text-ivory/75 md:text-lg">
              {t("scholarships", "teaser")}
            </p>

            {/* What the six cover — the invitation, not the detail. */}
            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wide text-ivory/55">
                {copy.covers}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {SCHOLARSHIP_KINDS.map((k) => (
                  <span
                    key={k.id}
                    className="rounded-full border border-ivory/25 px-4 py-1.5 text-sm font-semibold text-ivory"
                  >
                    {k.label[isAr ? "ar" : "en"]}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 gap-2 rounded-full px-8 text-base font-bold">
                <Link to={isAr ? "/ar/placement-test" : "/placement-test"}>
                  {t("scholarships", "teaserCta")}
                  <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 gap-2 rounded-full border-ivory/40 bg-transparent font-bold text-ivory hover:bg-ivory/10"
              >
                <Link to={isAr ? "/ar/scholarships" : "/scholarships"}>
                  {t("scholarships", "more")}
                </Link>
              </Button>
            </div>

            {/* The gate, said plainly — no fake urgency, no countdown. */}
            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-ivory/60">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("scholarships", "teaserLocked")}
            </p>
          </div>

          {/* The campus, not the learner. Re, 4 Oct 2026: the shot of Adam in
              the yellow blazer was the same face the "Why Korean" study card
              already carries, and a scholarships section is about the place
              the money takes you. This is the cherry-blossom walkway at a
              Korean university, no foreground face, so it reads as the
              destination rather than as one more portrait. The old file is
              still the study card's — this is a second asset, not a swap. */}
          <img
            src="/assets/world/scholarships-campus.webp"
            alt={copy.imageAlt}
            width={1024}
            height={576}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-3xl object-cover"
          />
        </div>

        {/* Cluby, once, small, reading — the 3D canon plush. */}
        <div className="mt-10 flex flex-col items-center gap-4 rounded-3xl border border-ivory/10 bg-ivory/[0.06] p-5 sm:flex-row sm:items-center sm:gap-6">
          <img
            src="/assets/cluby/cluby-reading.webp"
            alt={copy.clubyAlt}
            width={96}
            height={96}
            loading="lazy"
            decoding="async"
            className="h-20 w-20 shrink-0 rounded-2xl object-contain sm:h-24 sm:w-24"
          />
          <div className="text-center sm:text-start">
            <p className="cluby-note text-lg text-ivory sm:text-xl">{copy.clubyNote}</p>
            <p className="mt-2 text-xs text-ivory/60">
              {t("scholarships", "verified")}: {VERIFIED_AT[isAr ? "ar" : "en"]} · {t("scholarships", "disclaimer")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ScholarshipsSection;
