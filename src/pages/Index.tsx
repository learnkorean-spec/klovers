import { lazy, Suspense, useEffect } from "react";
import { logEngagementEvent } from "@/lib/leadTracking";
import { CONTACT_EMAIL } from "@/lib/siteConfig";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyLearnKorean from "@/components/WhyLearnKorean";
import CommunityBand from "@/components/CommunityBand";
import Footer from "@/components/Footer";
import StickyEnrollBar from "@/components/StickyEnrollBar";
import ReturningStudentBanner from "@/components/ReturningStudentBanner";
import InterviewBannerChip from "@/components/InterviewBannerChip";
import HomeExitNudge from "@/components/HomeExitNudge";

// Lazy-load below-fold sections for faster initial paint
const CultureHeritageSection = lazy(() => import("@/components/CultureHeritageSection"));
const KoreaTimeSection = lazy(() => import("@/components/KoreaTimeSection"));
const MeetTeacher = lazy(() => import("@/components/MeetTeacher"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const LearningRoadmap = lazy(() => import("@/components/LearningRoadmap"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const HomeBlogSection = lazy(() => import("@/components/HomeBlogSection"));
const PlacementTestCTA = lazy(() => import("@/components/PlacementTestCTA"));
const HomeGamesSection = lazy(() => import("@/components/HomeGamesSection"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));
const ReturningStudentOffer = lazy(() => import("@/components/ReturningStudentOffer"));

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
  useSEO({ title: "Korean Classes in Arabic | Klovers Academy", description: "Join Klovers Korean Lovers Academy. Interactive online Korean lessons, placement tests, and gamified learning for all levels.", canonical: "https://kloversegy.com/" });

  // No hreflang on the homepage: ?lang=ar is a query parameter on the same
  // document, not an Arabic URL, and it canonicalises back to / - which
  // invalidates the whole annotation cluster. Marketing pages get hreflang
  // once Arabic has real URLs of its own (Option B).
  // See docs/DECISIONS.md 2026-08-19 (hreflang).

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Korean Language Courses at Klovers",
      description: "Online Korean language courses for all levels — from A1 beginner to C2 advanced.",
      url: "https://kloversegy.com/pricing",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "Course",
            name: "Group Korean Classes",
            description: "Live online group Korean classes for A1–C2 levels. Small groups, expert teachers, flexible schedule.",
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
      description: "Online Korean language school teaching Arabic speakers. Live classes, small groups, A1–C2 levels.",
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
  // Meta Pixel as a `Lead` and to GA4 as `generate_lead`. Between them they
  // raise up to nine events per visit — 4 scroll milestones and 5 sections —
  // so routing them through logLeadEvent meant one person scrolling to the
  // bottom of this page counted as nine conversions. Measured in GA4 Realtime
  // on 18 Sep 2026: 11 generate_lead against 6 page_view, nothing clicked.
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
        {/* Attention — strong hook, CTA, social proof stats */}
        <HeroSection />

        {/* Returning students promotional banner */}
        <ReturningStudentBanner />
        {/* Interview training chip — non-intrusive floating, dismissible */}
        <InterviewBannerChip />

        {/* Interest — immediately answer "how does this work?" */}
        <div id="how-it-works" style={{ minHeight: 480 }}>
          <Suspense fallback={<SectionFallback />}>
            <HowItWorks />
          </Suspense>
        </div>
        {/* Action — low-friction free CTA (no payment). Placed high because
            placement-test takers convert 5x more than bounced visitors. */}
        <div id="placement-cta" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <PlacementTestCTA />
          </Suspense>
        </div>
        {/* Desire — social proof builds trust early */}
        <div id="testimonials" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <TestimonialsSection />
          </Suspense>
        </div>
        {/* The community band — see CommunityBand.tsx for why it no longer
            claims a member count. */}
        <CommunityBand />
        {/* Interest — the culture/history hook, real published content,
            placed right before WhyLearnKorean's "K-Culture" reason card */}
        <Suspense fallback={<SectionFallback />}>
          <CultureHeritageSection />
        </Suspense>
        {/* Interest — the concept board's "journey through Korea's time":
            four eras, a timeline, five places. Sits with the culture block
            because it is the same hook seen from a different angle. */}
        <Suspense fallback={<SectionFallback />}>
          <KoreaTimeSection />
        </Suspense>
        {/* Desire — reinforces motivation after seeing proof */}
        <WhyLearnKorean />
        {/* Desire — humanize the brand, build connection */}
        <div id="meet-teacher" style={{ minHeight: 400 }}>
          <Suspense fallback={<SectionFallback />}>
            <MeetTeacher />
          </Suspense>
        </div>
        {/* Desire — show the clear path forward */}
        <Suspense fallback={<SectionFallback />}>
          <LearningRoadmap />
        </Suspense>
        {/* Returning student offer — capitalize on roadmap motivation */}
        <Suspense fallback={<SectionFallback />}>
          <ReturningStudentOffer />
        </Suspense>
        {/* Interest — fun differentiator */}
        <Suspense fallback={<SectionFallback />}>
          <HomeGamesSection />
        </Suspense>
        {/* Interest — content authority */}
        <Suspense fallback={<SectionFallback />}>
          <HomeBlogSection />
        </Suspense>
        {/* Action — final conversion push */}
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
