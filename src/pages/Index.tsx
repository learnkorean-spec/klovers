import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import WhyKLovers from "@/components/WhyKLovers";
import CoursesSection from "@/components/CoursesSection";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <HeroSection />
        <WhyKLovers />
        <CoursesSection />
        <PricingSection />
        <EnrollSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
