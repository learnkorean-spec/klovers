import Header from "@/components/Header";
import KoreanOrchestrator from "@/components/admin/KoreanOrchestrator";

const KoreanOrchestratorPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-4 pt-28 pb-16 max-w-6xl">
      <KoreanOrchestrator />
    </main>
  </div>
);

export default KoreanOrchestratorPage;
