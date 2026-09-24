import { lazy, Suspense, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { logEngagementEvent } from "@/lib/leadTracking";
import { CONTACT_EMAIL } from "@/lib/siteConfig";
import { useSEO } from "@/hooks/useSEO";
import { useLanguage } from "@/contexts/LanguageContext";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyLearnKorean from "@/components/WhyLearnKorean";
import CommunityBand from "@/components/CommunityBand";
import Footer from "@/components/Footer";
import StickyEnrollBar from "@/components/StickyEnrollBar";
import ReturningStudentBanner from "@/components/ReturningStudentBanner";
import HomeExitNudge from "@/components/HomeExitNudge";

// Lazy-load below-fold sections for faster initial paint
const MeetTeacher = lazy(() => import("@/components/MeetTeacher"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const LearningRoadmap = lazy(() => import("@/components/LearningRoadmap"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const PlacementTestCTA = lazy(() => import("@/components/PlacementTestCTA"));
const MoreThanAClass = lazy(() => import("@/components/MoreThanAClass"));
const HomeFAQ = lazy(() => import("@/components/HomeFAQ"));
const EggTeaser = lazy(() => import("@/components/EggTeaser"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));

/**
 * THE HOMEPAGE TITLE AND DESCRIPTION.
 *
 * English: scripts/prerender-meta.mjs writes the SAME two strings into the raw
 * HTML for "/". The title already names Klovers, so neither useSEO nor the
 * prerender emit loop appends a suffix. Change both or neither -
 * scripts/lib/brand-identity.test.mjs guards the prerender side (brand first,
 * كلوفرز in the description).
 *
 * Arabic: since 24 Sep 2026 the Arabic homepage has its own URL, /ar, and
 * these are the SAME strings the prerender writes into dist/ar/index.html.
 * Both pages declare the same reciprocal hreflang pair (HOME_ALTERNATES), and
 * each is its own canonical. Change both or neither -
 * scripts/lib/arabic-home-route.test.mjs guards the pair.
 */
export const HOME_TITLE = "Klovers — Live Online Korean Classes in Small Groups";
export const HOME_DESCRIPTION =
  "Klovers (كلوفرز): live, interactive Korean classes with a real teacher, in small groups. Free trial class, free placement test and gamified practice.";
const HOME_TITLE_AR = "كلوفرز Klovers — حصص كوري أونلاين مباشرة في مجموعات صغيرة";
const HOME_DESCRIPTION_AR =
  "كلوفرز (Klovers): حصص كوري أونلاين مباشرة مع معلمة حقيقية، في مجموعات صغيرة، بالعربي أو بالإنجليزي. حصة تجريبية مجانية واختبار تحديد مستوى مجاني.";

/** The homepage translation pair. Same as HOME_ALTERNATES in prerender-meta.mjs. */
const HOME_URL_EN = "https://kloversegy.com/";
const HOME_URL_AR = "https://kloversegy.com/ar";
const HOME_ALTERNATES = { en: "https://kloversegy.com/", ar: "https://kloversegy.com/ar" };

const SectionFallback = () => (
  <div className="py-20 px-4">
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-1/3 mx-auto" />
      <div className="h-4 bg-muted rounded-lg w-1/2 mx-auto" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-2xl" />)}
      </div>
    </div>
  </div>
);

const Index = () => {
  const { language } = useLanguage();
  const { pathname } = useLocation();
  const onArabicUrl = pathname === "/ar";
  const isAr = language === "ar";
  useSEO({
    title: isAr ? HOME_TITLE_AR : HOME_TITLE,
    description: isAr ? HOME_DESCRIPTION_AR : HOME_DESCRIPTION,
    // Each language is its own canonical; neither points at the other.
    canonical: onArabicUrl ? HOME_URL_AR : HOME_URL_EN,
    alternates: HOME_ALTERNATES,
  });

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Korean Language Courses at Klovers",
      description: "Live online Korean classes for all levels, from Hangul to Level 6.",
      url: "https://kloversegy.com/pricing",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Course",
            name: "Group Korean Classes",
            description: "Live online group Korean classes in small groups, taught in English or Arabic.",
            provider: { "@type": "Organization", name: "Klovers Korean Academy", url: "https://kloversegy.com" },
            url: "https://kloversegy.com/enroll-now?classType=group",
            educationalLevel: "Beginner to Advanced",
            inLanguage: "ko",
            offers: { "@type": "Offer", price: "25", priceCurrency: "USD", availability: "https://schema.org/InStock" },
          },
        },
        {
          "@type": "ListItem",
          position: 2,
          item: {
            "@type": "Course",
            name: "Private Korean Classes",
            description: "One-on-one private Korean lessons tailored to your goals and schedule.",
            provider: { "@type": "Organization", name: "Klovers Korean Academy", url: "https://kloversegy.com" },
            url: "https://kloversegy.com/enroll-now?classType=private",
            educationalLevel: "Beginner to Advanced",
            inLanguage: "ko",
            offers: { "@type": "Offer", price: "50", priceCurrency: "USD", availability: "https://schema.org/InStock" },
          },
        },
      ],
    };
    const el = document.createElement("script");
    el.id = "home-course-jsonld";
    el.setAttribute("type", "application/ld+json");
    el.textContent = JSON.stringify(schema);
    document.head.appendChild(el);

    const bizSchema = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      name: "Klovers Korean Academy",
      url: "https://kloversegy.com",
      logo: "https://kloversegy.com/klovers-logo.jpg",
      description: "Online Korean language school. Live classes in English and Arabic, small groups or private, from Hangul to Level 6.",
      email: CONTACT_EMAIL,
      telephone: "+201010003084",
      sameAs: [
        "https://www.facebook.com/kloversegy",
        "https://www.tiktok.com/@kloversegy",
        "https://www.instagram.com/kloversegy/",
        "https://t.me/+Fu5T7d4wLMsxNDY9",
      ],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Korean Language Courses",
        itemListElement: [
          { "@type": "Offer", itemOffered: { "@type": "Course", name: "Group Korean Classes" } },
          { "@type": "Offer", itemOffered: { "@type": "Course", name: "Private Korean Classes" } },
        ],
      },
    };
    const bizEl = document.createElement("script");
    bizEl.id = "home-biz-jsonld";
    bizEl.setAttribute("type", "application/ld+json");
    bizEl.textContent = JSON.stringify(bizSchema);
    document.head.appendChild(bizEl);

    return () => { el.remove(); bizEl.remove(); };
  }, []);

  // ── Scroll depth + section visibility analytics ────────────────
  //
  // logEngagementEvent, NOT logLeadEvent. Both of these effects fire without
  // the visitor choosing anything, and logLeadEvent mirrors every call to the
  // Meta Pixel as a `Lead` and to GA4 as `generate_lead`. Routing them through
  // logLeadEvent meant one person scrolling to the bottom of this page counted
  // as nine conversions (GA4 Realtime, 18 Sep 2026).
  useEffect(() => {
    const milestones = new Set<number>();
    const onScroll = () => {
      const pct = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      [25, 50, 75, 90].forEach((m) => {
        if (pct >= m && !milestones.has(m)) {
          milestones.add(m);
          try { logEngagementEvent({ source_type: "homepage", cta_label: `scroll_depth_${m}` }); } catch {}
        }
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = [
      { id: "how-it-works", label: "section_how_it_works" },
      { id: "placement-cta", label: "section_placement_cta" },
      { id: "testimonials", label: "section_testimonials" },
      { id: "meet-teacher", label: "section_meet_teacher" },
      { id: "egg-teaser", label: "section_egg_teaser" },
      { id: "final-cta", label: "section_final_cta" },
    ];
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id, label }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          try { logEngagementEvent({ source_type: "homepage", cta_label: label }); } catch {}
          obs.disconnect();
        }
      }, { threshold: 0.3 });
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content">
        {/* Attention — what, why, one action */}
        <HeroSection />

        {/* Returning students promotional banner (signed-in returning students only) */}
        <ReturningStudentBanner />

        {/* Desire — the teacher, verified facts only */}
        <div id="meet-teacher" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <MeetTeacher />
          </Suspense>
        </div>
        {/* Interest — how the classes work, with the real starting price */}
        <div id="how-it-works" style={{ minHeight: 480 }}>
          <Suspense fallback={<SectionFallback />}>
            <HowItWorks />
          </Suspense>
        </div>
        {/* Desire — show the clear path forward */}
        <Suspense fallback={<SectionFallback />}>
          <LearningRoadmap />
        </Suspense>
        {/* Action — low-friction free placement test */}
        <div id="placement-cta" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <PlacementTestCTA />
          </Suspense>
        </div>
        {/* Why Klovers — the ecosystem, one compact section */}
        <Suspense fallback={<SectionFallback />}>
          <MoreThanAClass />
        </Suspense>
        {/* Desire — reinforces motivation after seeing proof */}
        <WhyLearnKorean />
        {/* Desire — real reviews, in the reader's language */}
        <div id="testimonials" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <TestimonialsSection />
          </Suspense>
        </div>
        {/* The community band — 2,000+ on social media (see CommunityBand.tsx). */}
        <CommunityBand />
        {/* Objections — the four questions asked before a first booking */}
        <Suspense fallback={<SectionFallback />}>
          <HomeFAQ />
        </Suspense>
        {/* Story — homepageNarrative slot 7, "egg-teaser" (origin mystery, no Cluby) */}
        <div id="egg-teaser">
          <Suspense fallback={<SectionFallback />}>
            <EggTeaser />
          </Suspense>
        </div>
        {/* Action — final, low-pressure invitation */}
        <div id="final-cta">
          <Suspense fallback={<SectionFallback />}>
            <FinalCTA />
          </Suspense>
        </div>
      </main>
      <Footer />
      <StickyEnrollBar />
      <HomeExitNudge />
    </div>
  );
};

export default Index;
