import { Button } from "@/components/ui/button";
import { BookOpen, FileText } from "lucide-react";
import heroVideo from "@/assets/hero-korea-video.mp4";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background Video */}
      <div className="absolute inset-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/75" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-5 py-2.5 rounded-full bg-primary/30 text-white text-sm font-semibold mb-6 border border-primary/40 backdrop-blur-sm shadow-lg">
            🎓 Learn Korean. Connect with Culture. Speak with Confidence.
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            Learn Korean Your Way —{" "}
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-md shadow-lg">From Hangul to Advanced Fluency</span>
          </h1>

          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md font-medium">
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
            <Button size="lg" variant="outline" asChild className="gap-2 bg-white/10 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm">
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
