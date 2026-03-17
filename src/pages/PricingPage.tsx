import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";
import ScrollToTop from "@/components/ScrollToTop";

const PricingPage = () => {
  useSEO({ title: "Pricing & Plans", description: "Affordable Korean language learning plans at Klovers. Choose the right course for your budget and learning goals.", canonical: "https://kloversegy.com/pricing" });
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <PricingSection />
        <EnrollSection />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default PricingPage;
