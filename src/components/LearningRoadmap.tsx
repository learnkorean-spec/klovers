import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const LearningRoadmap = () => {
  const { t, tArray } = useLanguage();
  const stages = tArray("roadmap", "stages") as { title: string; description: string; level: string }[];
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => new Set(prev).add(i));
            obs.disconnect();
          }
        },
        { threshold: 0.15 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [stages.length]);

  const toggle = (index: number) =>
    setActiveStep((prev) => (prev === index ? null : index));

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("roadmap", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("roadmap", "subtitle")}
          </p>
        </div>

        <div className="max-w-3xl mx-auto relative">
          {/* Static timeline line */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-border hidden md:block" />

          <div className="space-y-8">
            {stages.map((stage, index) => {
              const isLeft = index % 2 === 0;
              const isActive = activeStep === index;
              const isVisible = visibleItems.has(index);

              return (
                <div
                  key={index}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  style={{ transitionDelay: `${index * 60}ms` }}
                  className={`relative flex flex-col md:flex-row items-center gap-4 transition-all duration-700 ease-out ${
                    isVisible
                      ? "opacity-100 translate-x-0"
                      : isLeft
                      ? "opacity-0 -translate-x-10"
                      : "opacity-0 translate-x-10"
                  }`}
                >
                  {/* Numbered badge — clickable */}
                  <button
                    onClick={() => toggle(index)}
                    aria-label={`Step ${index + 1}: ${stage.title}`}
                    className={`hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full items-center justify-center z-10 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      isActive
                        ? "bg-primary scale-125 shadow-lg shadow-primary/40 ring-4 ring-primary/20"
                        : "bg-primary hover:scale-110 hover:shadow-md hover:shadow-primary/30"
                    }`}
                  >
                    <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
                  </button>

                  {/* Card */}
                  <div className={`w-full md:w-5/12 ${isLeft ? "md:text-right md:pr-12" : "md:ml-auto md:pl-12"}`}>
                    <div
                      onClick={() => toggle(index)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && toggle(index)}
                      className={`bg-card rounded-lg p-6 cursor-pointer transition-all duration-300 border ${
                        isActive
                          ? "border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                          : "border-border hover:border-primary/40 hover:shadow-lg"
                      }`}
                    >
                      <div className={`flex items-start gap-2 ${isLeft ? "md:flex-row-reverse" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                            {stage.level}
                          </span>
                          <h3 className="text-lg font-bold text-foreground mt-1">{stage.title}</h3>
                          <div
                            className={`overflow-hidden transition-all duration-400 ease-in-out ${
                              isActive ? "max-h-40 mt-2 opacity-100" : "max-h-0 opacity-0"
                            }`}
                          >
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {stage.description}
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 flex-shrink-0 mt-1 transition-all duration-300 ${
                            isActive ? "rotate-180 text-primary" : "text-muted-foreground"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
