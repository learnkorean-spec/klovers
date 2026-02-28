import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ClipboardCheck } from "lucide-react";

const PlacementTestCTA = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 bg-muted/50">
      <div className="max-w-3xl mx-auto text-center space-y-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <ClipboardCheck className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Not sure about your level?
        </h2>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Take our free TOPIK-based placement test — 40 questions, 10 minutes — and get a personalized level recommendation instantly.
        </p>
        <Button size="lg" onClick={() => navigate("/placement-test")}>
          Take the Free Placement Test
        </Button>
      </div>
    </section>
  );
};

export default PlacementTestCTA;
