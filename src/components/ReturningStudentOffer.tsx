import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Copy,
  Check,
  UserPlus,
  Share2,
  Shield,
  ClipboardCheck,
  Route,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { RETURNING_STUDENT_CODE } from "@/lib/siteConfig";
import { CHARACTER_GIRL, CHARACTER_BOY } from "@/assets/characters";

/**
 * 2026-09-20 (a): this section was painted in Tailwind `green-*` - ground,
 * blobs, badge, hero card, referral tiles, tick marks. A different green from
 * the brand's, one screen away from the brand's. It is on brand tokens now.
 *
 * 2026-09-20 (b): it asked people to invite a friend and showed them three
 * icons. It shows two friends now.
 *
 * 2026-09-20 (c): THE SECTION WAS UNREADABLE IN DARK MODE. Every surface and
 * every line of type here was pinned to a literal brand token - `text-charcoal`
 * for the heading, `bg-white` for the cards, `border-charcoal/10` for their
 * edges. Charcoal is `0 0% 18%` in BOTH themes by design: it is the palette's
 * dark surface, not a text colour that flips. So on the dark ground the
 * heading was 18% grey on 10% grey - the screenshot Re sent shows "Welcome
 * Back to Klovers" as a shadow with a yellow underline floating beneath it.
 *
 * The fix is not new colours, it is the right layer: type and surfaces now use
 * the semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-card`,
 * `border-border`), which are Charcoal-on-Ivory in light mode - byte for byte
 * what this section rendered before - and Ivory-on-near-black in dark mode.
 *
 * 2026-09-20 (d): the brand is three colours (Yellow, Charcoal, Ivory), so the
 * neon pair that used to live here is gone. In dark mode the tick marks, the
 * step icons and the edge that separates the hero card from the page are now
 * Klovers Yellow; the reward tiles are Yellow and Ivory. On the white cards
 * light mode keeps the Charcoal.
 *
 * WHAT MOVED, AND WHY IT MATTERS MORE THAN THE PAINT
 *
 * The promo code used to sit in the second column, beneath the offer list,
 * two scrolls below the sentence explaining what it is for. A returning
 * student comes to this section for that code. It is now inside the card
 * that sells it, on a dashed outline, beside the characters.
 *
 * The three reward tiles moved from a row under the heading into the card's
 * text column, so the card reads as one argument - here is the offer, here
 * are the three ways it stacks, here is the code - instead of a headline
 * followed by a separate grid.
 *
 * WHY THE CHARACTERS AND NOT A PHOTOGRAPH. The first build of this card used
 * korean-streetwear.jpg: three young Korean women in Seoul, properly
 * published, no fake Hangul, and wrong. Klovers teaches Arabic speakers, so
 * a card that says "bring a friend" over three Korean women is picturing
 * somebody else's friends. Re said so immediately.
 *
 * There is no photograph of international learners in this repo - every
 * candidate was rendered and checked. kpop-global-learning.jpg is a crowd
 * from behind under a flag map and is not a published hero;
 * multilingual-brain.jpg is an illustration whose Arabic labels are garbled;
 * the rest are Korean students or cartoons. So the card uses the two Klovers
 * characters, which are the school's own faces rather than stock anyone.
 *
 * A real photograph of Klovers students, with consent, beats both. Ask for
 * that before running another stock search.
 */

const STEP_ICONS = [ClipboardCheck, Route, GraduationCap];

/** Reward tiles: icon plus its tint. Literal class strings for the scanner.
 *  These sit on the Charcoal card in both themes; the icon on each is Charcoal
 *  (12.6:1 on Yellow, 14:1 on Ivory). */
const REFERRAL_META = [
  { Icon: UserPlus, tint: "bg-klovers-yellow" },
  { Icon: Share2, tint: "bg-klovers-yellow" },
  { Icon: Shield, tint: "bg-ivory" },
];

const ReturningStudentOffer = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const sectionRef = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (sectionRef.current) obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(RETURNING_STUDENT_CODE);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = RETURNING_STUDENT_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const offerItems = tArray("returningStudents.section.offerItems");
  const steps = tArray("returningStudents.section.steps") as { title: string; description: string }[];
  const referralItems = tArray("returningStudents.section.referralItems") as { label: string; description: string }[];
  const faqs = tArray("returningStudents.section.faqs") as { question: string; answer: string }[];

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-background px-4 py-16 md:py-24"
    >
      {/* Decorative blobs. Soft Yellow reads on Ivory; on the dark ground the
          same blobs drop to low alpha - a glow rather than a cloud. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -start-20 -top-20 h-72 w-72 rounded-full bg-klovers-yellow/50 blur-3xl dark:bg-klovers-yellow/15" />
        <div className="absolute -bottom-20 -end-20 h-64 w-64 rounded-full bg-klovers-yellow/15 blur-3xl dark:bg-klovers-yellow/10" />
      </div>

      <div className="container relative z-10 mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge
            variant="outline"
            className={`mb-4 border-border bg-card text-foreground transition-all duration-700 ${
              visible ? "scale-100 opacity-100" : "scale-90 opacity-0"
            }`}
          >
            <GraduationCap className="me-1.5 h-3.5 w-3.5" />
            {t("returningStudents.section.badge")}
          </Badge>
          <h2
            className={`text-3xl font-extrabold text-foreground transition-all delay-100 duration-700 md:text-4xl lg:text-5xl ${
              visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            {t("returningStudents.section.title")}
          </h2>
          {/* Yellow as a mark under the heading, never as the heading. */}
          <svg aria-hidden="true" viewBox="0 0 240 18" fill="none" className="mx-auto mb-4 mt-2 h-4 w-48 text-klovers-yellow md:w-60">
            <path d="M7 12C60 4 134 3 197 8c14 1 27 3 36 2" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
          </svg>
          <p
            className={`mx-auto max-w-2xl text-base text-muted-foreground transition-all delay-200 duration-700 md:text-lg ${
              visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {t("returningStudents.section.subtitle")}
          </p>
        </div>

        {/* HERO: the referral offer, with faces and the code in one card.
            Charcoal is the card here on purpose - it is the palette's strong
            surface. In dark mode that surface and the page behind it are both
            near-black, so the card gets a neon-green edge to keep its shape. */}
        <div
          className={`mb-12 overflow-hidden rounded-3xl border border-transparent bg-charcoal shadow-lg transition-all delay-200 duration-700 dark:border-klovers-yellow/35 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <div className="grid md:grid-cols-2">
            {/* Two friends: the Klovers characters, overlapping. */}
            <div className="relative flex min-h-[15rem] items-center justify-center overflow-hidden bg-klovers-yellow p-8 sm:min-h-[19rem]">
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 50% 42%, hsl(var(--klovers-yellow) / 0.45), transparent 62%)",
                }}
              />
              <div className="relative flex items-center">
                <img
                  src={CHARACTER_GIRL}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-ivory sm:h-36 sm:w-36"
                />
                <img
                  src={CHARACTER_BOY}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="-ms-8 h-28 w-28 rounded-full object-cover shadow-lg ring-4 ring-ivory sm:h-36 sm:w-36"
                />
              </div>
            </div>

            <div className="p-6 md:p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-klovers-yellow text-charcoal">
                <Share2 className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-2xl font-extrabold text-ivory md:text-3xl">
                {t("returningStudents.section.referralTitle")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ivory/70 md:text-base">
                {t("returningStudents.section.referralSubtitle")}
              </p>

              <ul className="mt-6 space-y-3">
                {referralItems.map((item, i) => {
                  const meta = REFERRAL_META[i] ?? REFERRAL_META[0];
                  const { Icon } = meta;
                  return (
                    <li key={i} className="flex items-start gap-3">
                      <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.tint}`}>
                        <Icon className="h-4 w-4 text-charcoal" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-ivory">{item.label}</span>
                        <span className="block text-xs leading-relaxed text-ivory/60">{item.description}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>

              {/* The code, in the card that sells it. */}
              <div className="mt-6 rounded-2xl border-2 border-dashed border-ivory/25 p-4">
                <p className="text-xs font-medium text-ivory/60">
                  {t("returningStudents.section.promoLabel")}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <span className="select-all font-mono text-lg font-bold tracking-wider text-klovers-yellow sm:text-xl">
                    {RETURNING_STUDENT_CODE}
                  </span>
                  <Button size="sm" onClick={handleCopy} className="gap-1.5 rounded-full">
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        {t("returningStudents.section.promoCopied")}
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        {t("returningStudents.section.promoCopy")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Offer + Steps */}
        <div
          className={`mb-12 grid gap-8 transition-all delay-300 duration-700 md:grid-cols-2 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <Card className="border-border bg-card">
            <CardContent className="pt-6">
              <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-klovers-yellow text-charcoal">
                  <GraduationCap className="h-4 w-4" />
                </span>
                {t("returningStudents.section.offerTitle")}
              </h3>
              <ul className="space-y-3">
                {offerItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    {/* Neon green is a dark-ground accent: on the white card it
                        would wash out, so light mode keeps the charcoal tick. */}
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-charcoal/45 dark:text-klovers-yellow" />
                    <span className="text-sm text-muted-foreground">{item as string}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Steps — same round node and dashed rail as the roadmap. */}
          <div>
            <h3 className="mb-5 text-lg font-bold text-foreground">{t("returningStudents.section.stepsTitle")}</h3>
            <ol className="space-y-1">
              {steps.map((step, i) => {
                const Icon = STEP_ICONS[i] ?? ClipboardCheck;
                const isLast = i === steps.length - 1;
                return (
                  <li key={i} className="flex gap-4">
                    <div className="relative flex w-11 shrink-0 flex-col items-center">
                      {!isLast && (
                        <span aria-hidden="true" className="absolute bottom-0 top-11 w-0 border-s-2 border-dashed border-klovers-yellow/60" />
                      )}
                      <span className="relative z-10 grid h-11 w-11 place-items-center rounded-full bg-klovers-yellow text-sm font-bold text-charcoal ring-4 ring-background">
                        {i + 1}
                      </span>
                    </div>
                    <div className="pb-6 pt-2">
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Icon className="h-4 w-4 text-charcoal dark:text-klovers-yellow" aria-hidden="true" />
                        {step.title}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        {/* Mini FAQ */}
        {faqs.length > 0 && (
          <div
            className={`mx-auto mb-12 max-w-3xl transition-all delay-[400ms] duration-700 ${
              visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <h3 className="mb-4 text-center text-lg font-bold text-foreground">{t("returningStudents.section.faqTitle")}</h3>
            <div className="space-y-2">
              {faqs.map((faq, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-border bg-card">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between px-4 py-3 text-start text-sm font-medium text-foreground transition-colors hover:bg-klovers-yellow/40 dark:hover:bg-klovers-yellow/10"
                  >
                    {faq.question}
                    <ChevronDown
                      className={`ms-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                        openFaq === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden px-4 text-sm text-muted-foreground transition-all duration-200 ${
                      openFaq === i ? "border-t border-border py-3" : "max-h-0 py-0"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div
          className={`text-center transition-all delay-500 duration-700 ${
            visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <Button size="lg" asChild className="h-13 gap-2 rounded-full px-8 text-base font-bold shadow-lg">
            <Link to="/placement-test">
              {t("returningStudents.section.cta")}
              <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ReturningStudentOffer;
