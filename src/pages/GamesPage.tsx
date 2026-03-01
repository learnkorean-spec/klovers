import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KoreanMatchGame from "@/components/KoreanMatchGame";
import { Gamepad2 } from "lucide-react";

const GamesPage = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-20">
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-foreground border border-border px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Gamepad2 className="h-4 w-4" />
            Learn & Play
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            Korean Learning <span className="underline decoration-primary decoration-4 underline-offset-4">Games</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Practice your Korean skills with fun interactive games. More games coming soon!
          </p>
        </div>
        <KoreanMatchGame />
      </main>
      <Footer />
    </div>
  );
};

export default GamesPage;
