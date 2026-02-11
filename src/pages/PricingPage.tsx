import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";
import EnrollSection from "@/components/EnrollSection";

const PricingPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-16">
        <PricingSection />
        <EnrollSection />
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
