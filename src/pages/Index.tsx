import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyLearnKorean from "@/components/WhyLearnKorean";
import MeetTeacher from "@/components/MeetTeacher";
import HowItWorks from "@/components/HowItWorks";
import StudentJourney from "@/components/StudentJourney";
import LearningRoadmap from "@/components/LearningRoadmap";
import Testimonials from "@/components/Testimonials";
import HomeBlogSection from "@/components/HomeBlogSection";
import PlacementTestCTA from "@/components/PlacementTestCTA";
import FinalCTA from "@/components/FinalCTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <WhyLearnKorean />
        <MeetTeacher />
        <HowItWorks />
        <StudentJourney />
        <LearningRoadmap />
        <Testimonials />
        <HomeBlogSection />
        <PlacementTestCTA />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
