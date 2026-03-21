import { BookOpen, Briefcase, Plane, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const iconMap: Record<string, React.ReactNode> = {
  study:   <BookOpen className="h-9 w-9" />,
  career:  <Briefcase className="h-9 w-9" />,
  travel:  <Plane className="h-9 w-9" />,
  culture: <Music className="h-9 w-9" />,
};

const WhyLearnKorean = () => {
  const { tArray, t } = useLanguage();
  const items = tArray("whyLearn", "items") as { title: string; description: string; icon: string }[];

  return (
    <section className="py-20 md:py-32 bg-card">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight">
            {t("whyLearn", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            {t("whyLearn", "subtitle")}
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <div
              key={index}
              className="group rounded-3xl border border-border bg-background hover:border-primary/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 text-center"
            >
              <div className="p-4 md:p-8 flex flex-col items-center gap-3 md:gap-5">
                {/* Icon bubble */}
                <div className="w-18 h-18 rounded-2xl bg-primary flex items-center justify-center group-hover:scale-110 transition-all duration-300"
                  style={{ width: "4.5rem", height: "4.5rem" }}
                >
                  <span className="text-black">
                    {iconMap[item.icon] || <BookOpen className="h-9 w-9" />}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-bold text-foreground text-base md:text-lg leading-tight">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WhyLearnKorean;
