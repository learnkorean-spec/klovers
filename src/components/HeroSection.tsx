import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import heroImage from "@/assets/hero-korean.jpg";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-foreground/70" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary-foreground text-sm font-medium mb-6 border border-primary/30">
            🎓 Learn Korean. Connect with Culture. Speak with Confidence.
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-accent mb-6 leading-tight">
            Learn Korean Your Way —{" "}
            <span className="bg-primary text-primary-foreground px-2">From Hangul to Advanced Fluency</span>
          </h1>

          <p className="text-lg md:text-xl text-accent/80 mb-8 max-w-2xl mx-auto">
            Join K-Lovers and start your Korean language journey with structured
            courses, expert guidance, and a supportive learning community.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2">
              <a href="#courses">
                <BookOpen className="h-5 w-5" />
                View Courses
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 bg-accent/10 border-accent/30 text-accent hover:bg-accent/20">
              <a href="#enroll">
                <FileText className="h-5 w-5" />
                Enroll Now
              </a>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-accent/50 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-accent/50 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
