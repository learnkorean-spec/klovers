import { Link } from "react-router-dom";
import { ArrowRight, ExternalLink } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ScholarshipCard from "@/components/ScholarshipCard";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { KOREA_SCHOLARSHIPS, VERIFIED_AT } from "@/constants/koreaScholarships";

/**
 * /scholarships and /ar/scholarships
 *
 * The full page behind homepage narrative slot 7. The homepage shows six
 * filterable cards; this page carries the same six cards unfiltered, the route
 * through them, and the list of official sources, because a scholarship page
 * that does not name its sources is an agency page.
 *
 * WHAT THIS PAGE REFUSES TO DO
 *
 * It does not print a monthly allowance for GKS or KOICA. Both publish their
 * amounts in an annual PDF guideline rather than in HTML, and the official
 * university pages disagree with each other on the GKS figure, so the page
 * sends the reader to the guideline instead of quoting a number that might not
 * be theirs. See src/constants/koreaScholarships.ts for the verification
 * record and the date it was taken.
 *
 * The Arabic twin is real, not a toggle: /ar/scholarships is in
 * scripts/lib/arabic-page-meta.mjs and scripts/lib/arabic-pages.mjs, is
 * prerendered, and is paired in the sitemap. One language per page, per Re's
 * 27 Sep 2026 rule.
 */

const ScholarshipsPage = () => {
  const { t, tArray, language } = useLanguage();
  const isAr = language === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const lang = isAr ? "ar" : "en";

  useSEO({
    title: isAr ? "منح كوريا: ستة برامج رسمية | كلوفرز" : "Korean Scholarships: Six Official Programmes | Klovers",
    description: isAr
      ? "ست منح كورية رسمية بالتفصيل: منحة الحكومة الكورية، وKAIST، ومؤسسة كوريا، وKOICA، والتبادل الطلابي — بما تغطيه كل منحة وشروطها ومواعيدها ومصادرها الرسمية."
      : "Six official Korean scholarships: GKS, KAIST, the Korea Foundation, KOICA and exchange. What each covers, who qualifies, when to apply and the official source.",
    canonical: isAr ? "https://kloversegy.com/ar/scholarships" : "https://kloversegy.com/scholarships",
    alternates: {
      en: "https://kloversegy.com/scholarships",
      ar: "https://kloversegy.com/ar/scholarships",
    },
  });

  const steps = tArray("scholarships", "steps") as { title: string; body: string }[];

  /** Every page the facts on this screen came from, provider by provider. */
  const sources: { label: string; url: string }[] = [
    {
      label: tr("NIIED / Study in Korea — GKS programmes", "NIIED / Study in Korea — برامج GKS"),
      url: "https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab1",
    },
    {
      label: tr("Korean Embassy in Cairo — Egypt quotas", "السفارة الكورية بالقاهرة — حصص مصر"),
      url: "https://overseas.mofa.go.kr/eg-ko/brd/m_11508/view.do?seq=1343892",
    },
    {
      label: tr("KAIST — scholarship page", "KAIST — صفحة المنحة"),
      url: "https://admission.kaist.ac.kr/intl-undergraduate/support/scholarships/kaist",
    },
    {
      label: tr("The Korea Foundation — language fellowship", "مؤسسة كوريا — زمالة اللغة"),
      url: "https://kf.or.kr/kfEng/cm/cntnts/cntntsView.do?cntntsId=1637&mi=2221",
    },
    {
      label: tr("KOICA — Scholarship Program", "KOICA — برنامج المنح"),
      url: "https://www.koica.go.kr/ciat/7806/subview.do",
    },
    {
      label: tr("GKS Exchange Students Program", "برنامج الطلاب المتبادلين GKS"),
      url: "https://www.studyinkorea.go.kr/en/plan/scholarship.do?tab=gks-tab3",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="bg-charcoal py-16 text-ivory md:py-24">
          <div className="container mx-auto max-w-5xl px-4">
            <span className="inline-block rounded-full bg-klovers-yellow px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-charcoal">
              {t("scholarships", "eyebrow")}
            </span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight md:text-5xl">
              {t("scholarships", "title")}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-ivory/80 md:text-lg">
              {t("scholarships", "pageIntro")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-full font-bold">
                {/* The match first, the class second. Someone reading a
                    scholarships page came for a scholarship, and the one thing
                    that decides which of these they can reach is their level —
                    so the level test leads and the free class follows. The
                    wording is the same string as the homepage teaser and the
                    locked box, so all three invitations read identically. */}
                <Link to={isAr ? "/ar/placement-test" : "/placement-test"}>
                  {t("scholarships", "teaserCta")}
                  <ArrowRight className={`h-5 w-5 ${isAr ? "rotate-180" : ""}`} aria-hidden="true" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-ivory/40 bg-transparent font-bold text-ivory hover:bg-ivory/10"
              >
                <Link to={isAr ? "/ar/free-trial" : "/free-trial"}>
                  {tr("Start with the language", "البداية باللغة")}
                </Link>
              </Button>
            </div>

            {/* The campus, not the learner (Re, 4 Oct 2026). A scholarships page
                is about where the money takes you; the portrait of Adam already
                lives on the "Why Korean" study card, so this page shows the
                place instead — the cherry-blossom walkway at a Korean
                university, with no foreground face competing with the six
                programmes underneath it. */}
            <img
              src="/assets/world/scholarships-campus.webp"
              alt={tr(
                "A Korean campus walkway in spring, cherry blossom overhead, students walking toward the university building",
                "ممر جامعي كوري في الربيع، أشجار الكرز فوق الممر، وطلاب يسيرون نحو مبنى الجامعة",
              )}
              width={1024}
              height={576}
              decoding="async"
              className="mt-10 aspect-[16/7] w-full rounded-3xl border border-ivory/15 object-cover"
            />

            <p className="mt-4 text-xs text-ivory/60">
              {t("scholarships", "verified")}: {VERIFIED_AT[lang]} · {t("scholarships", "disclaimer")}
            </p>
          </div>
        </section>

        <section className="py-14 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">
              {t("scholarships", "stepsTitle")}
            </h2>
            <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, i) => (
                <li key={step.title} className="rounded-2xl border border-charcoal/10 bg-card p-5">
                  <span
                    aria-hidden="true"
                    className="inline-grid h-9 w-9 place-items-center rounded-full bg-klovers-yellow text-sm font-extrabold text-charcoal"
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-3 font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="pb-14 md:pb-20">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-extrabold text-foreground md:text-3xl">
              {tr("The six programmes", "البرامج الستة")}
            </h2>
            <div className="mt-6 grid gap-4 sm:gap-5 lg:grid-cols-2">
              {KOREA_SCHOLARSHIPS.map((item) => (
                <ScholarshipCard key={item.id} item={item} t={t} />
              ))}
            </div>
          </div>
        </section>

        {/* The point of maximum intent: someone who has just read all six.
            Until this band existed the page offered them a free class or the
            course levels, and never the one question they are holding — which
            of these is mine. The facts stay public here; only the match waits
            for a level. */}
        <section className="pb-14 md:pb-20">
          <div className="container mx-auto max-w-5xl px-4">
            <div className="rounded-3xl border border-charcoal/15 bg-ivory p-6 text-center md:p-8">
              <p className="text-lg font-extrabold text-charcoal md:text-xl">
                {tr("Which of these can your level reach?", "أي من هذه المنح يستطيع مستواك الوصول إليها؟")}
              </p>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-charcoal/75">
                {tr(
                  "All six programmes are listed here for everyone. The match — which ones are yours, and how many months stand between you and each — is worked out from your real level once you have taken the free placement test.",
                  "البرامج الستة معروضة هنا للجميع. أما المطابقة — أيها يناسبك، وكم شهرًا يفصلك عن كل واحدة — فتُحسب من مستواك الحقيقي بعد اختبار تحديد المستوى المجاني.",
                )}
              </p>
              <Button size="lg" asChild className="mt-5 h-12 rounded-full px-8 font-bold">
                <Link to={isAr ? "/ar/placement-test" : "/placement-test"}>
                  {t("scholarships", "teaserCta")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-ivory py-14 md:py-20">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 className="text-2xl font-extrabold text-charcoal md:text-3xl">
              {t("scholarships", "sourcesTitle")}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-charcoal/75 md:text-base">
              {t("scholarships", "sourcesBody")}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-11 items-center justify-between gap-3 rounded-2xl border border-charcoal/15 bg-background px-4 py-3 text-sm font-semibold text-charcoal transition-colors hover:border-charcoal/40"
                  >
                    {s.label}
                    <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-relaxed text-charcoal/60">
              {t("scholarships", "verified")}: {VERIFIED_AT[lang]} · {t("scholarships", "disclaimer")}
            </p>
          </div>
        </section>

        <section className="bg-charcoal py-14 text-ivory md:py-20">
          <div className="container mx-auto flex max-w-4xl flex-col items-center gap-5 px-4 text-center">
            <p className="text-xl font-extrabold md:text-2xl">
              {tr(
                "Every scholarship above asks for Korean, or for English and a language year.",
                "كل منحة أعلاه تطلب الكورية، أو الإنجليزية مع سنة لغة.",
              )}
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-ivory/75 md:text-base">
              {tr(
                "That is the part Klovers does: live classes in a small group, a free placement test, and a path from Hangul to Level 6 with a teacher who explains in Arabic.",
                "وهذا هو الجزء الذي تتولاه كلوفرز: حصص مباشرة في مجموعة صغيرة، واختبار تحديد مستوى مجاني، ومسار من الهانغول إلى المستوى السادس مع معلمة تشرح بالعربية.",
              )}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="h-12 rounded-full font-bold">
                <Link to={isAr ? "/ar/free-trial" : "/free-trial"}>
                  {tr("Book a free class", "حجز حصة مجانية")}
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-full border-ivory/40 bg-transparent font-bold text-ivory hover:bg-ivory/10"
              >
                <Link to={isAr ? "/ar/courses" : "/courses"}>{tr("See the levels", "عرض المستويات")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ScholarshipsPage;
