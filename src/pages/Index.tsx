import { lazy, Suspense } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyLearnKorean from "@/components/WhyLearnKorean";
import Footer from "@/components/Footer";

// Lazy-load below-fold sections for faster initial paint
const MeetTeacher = lazy(() => import("@/components/MeetTeacher"));
const HowItWorks = lazy(() => import("@/components/HowItWorks"));
const LearningRoadmap = lazy(() => import("@/components/LearningRoadmap"));
const Testimonials = lazy(() => import("@/components/Testimonials"));
const HomeBlogSection = lazy(() => import("@/components/HomeBlogSection"));
const PlacementTestCTA = lazy(() => import("@/components/PlacementTestCTA"));
const HomeGamesSection = lazy(() => import("@/components/HomeGamesSection"));
const FinalCTA = lazy(() => import("@/components/FinalCTA"));

const SectionFallback = () => (
  <div className="py-20 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  useSEO({ title: "Learn Korean Online", description: "Join Klovers Korean Language Academy. Interactive online Korean lessons, certified teachers, placement tests, and gamified learning for all levels.", canonical: "https://kloversegy.com/" });
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <WhyLearnKorean />
        <Suspense fallback={<SectionFallback />}>
          <MeetTeacher />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <HowItWorks />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <LearningRoadmap />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <Testimonials />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <PlacementTestCTA />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <HomeGamesSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <HomeBlogSection />
        </Suspense>
        <Suspense fallback={<SectionFallback />}>
          <FinalCTA />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
