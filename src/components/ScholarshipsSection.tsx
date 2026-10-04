import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import ScholarshipCard from "@/components/ScholarshipCard";
import {
  KOREA_SCHOLARSHIPS,
  SCHOLARSHIP_KINDS,
  VERIFIED_AT,
  type ScholarshipKind,
} from "@/constants/koreaScholarships";

/**
 * "Scholarships in Korea" — homepage narrative slot 7 (canon:
 * src/config/klovers-world.ts, homepageNarrative). Story lead is the male
 * learner: Adam owns structure, strategy and paperwork, which is what a
 * scholarship application is. Cluby appears once, small, reading — the 3D
 * plush from /assets/cluby/, never the 2D cartoon set in /assets/characters/,
 * which is off-model for the homepage (KLOVERS-STORY-BIBLE §7).
 *
 * THE RULE THIS SECTION IS BUILT AROUND
 *
 * A scholarship card is a claim about someone else's money. So:
 *   - no amount is printed unless ONE official page states it
 *     (`figures` in src/constants/koreaScholarships.ts); where the funding
 *     body publishes its amounts only in an annual PDF, the card says so and
 *     links to it instead of quoting a number;
 *   - every card carries its official URL and the verification date, so a
 *     stale list is visible to the reader rather than silently wrong.
 *
 * VISUAL: charcoal ground, ivory cards, yellow only as a chip or a mark. No
 * text is set over a photograph, so no scrim is needed. Filter buttons are
 * 44px tall on every breakpoint (a11y pass, 3 Oct 2026).
 */

type Filter = "all" | ScholarshipKind;

const COPY = {
  ar: {
    imageAlt: "آدم، أحد متعلّمي كلوفرز، يسير في حرم جامعي كوري في الخريف",
    clubyAlt: "كلوبي، رفيق المذاكرة، يقرأ كتابًا",
    clubyNote: "المنحة تبدأ بورقة واحدة: اقرأ الدليل الرسمي قبل أي شيء آخر.",
    results: (n: number) => `${n} برامج ظاهرة`,
  },
  en: {
    imageAlt: "Adam, one of the Klovers learners, walking through a Korean campus in autumn",
    clubyAlt: "Cluby, the study companion, reading a book",
    clubyNote: "A scholarship starts with one page: read the official guideline first.",
    results: (n: number) => `${n} programmes shown`,
  },
};

const ScholarshipsSection = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const copy = COPY[isAr ? "ar" : "en"];
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(
    () => (filter === "all" ? KOREA_SCHOLARSHIPS : KOREA_SCHOLARSHIPS.filter((s) => s.kinds.includes(filter))),
    [filter]
  );

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t("scholarships", "filterAll") },
    ...SCHOLARSHIP_KINDS.map((k) => ({ id: k.id as Filter, label: k.label[isAr ? "ar" : "en"] })),
  ];

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
              {t("scholarships", "subtitle")}
            </p>
          </div>

          {/* Adam, on a Korean campus. No text is set over the photograph. */}
          <img
            src="/assets/world/why-study.webp"
            alt={copy.imageAlt}
            width={1200}
            height={800}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full rounded-3xl object-cover"
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label={t("scholarships", "title")}>
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={`h-11 rounded-full px-5 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-klovers-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal ${
                  active
                    ? "bg-klovers-yellow text-charcoal"
                    : "border border-ivory/25 text-ivory hover:border-klovers-yellow/70"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <p aria-live="polite" className="sr-only">
          {copy.results(visible.length)}
        </p>

        <div className="mt-6 grid gap-4 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <ScholarshipCard key={item.id} item={item} t={t} />
          ))}
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

        <div className="mt-8 flex justify-center">
          <Button size="lg" asChild className="h-12 gap-2 rounded-full px-8 text-base font-bold">
            <Link to={isAr ? "/ar/scholarships" : "/scholarships"}>
              {t("scholarships", "more")}
              <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ScholarshipsSection;
