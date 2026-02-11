import { useLanguage } from "@/contexts/LanguageContext";

const LearningRoadmap = () => {
  const { t, tArray } = useLanguage();
  const stages = tArray("roadmap", "stages") as { title: string; description: string; level: string }[];

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
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-border hidden md:block" />
          <div className="space-y-8">
            {stages.map((stage, index) => (
              <div key={index} className="relative flex flex-col md:flex-row items-center gap-4">
                <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary items-center justify-center z-10">
                  <span className="text-primary-foreground font-bold text-sm">{index + 1}</span>
                </div>
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? "md:text-right md:pr-12" : "md:ml-auto md:pl-12"}`}>
                  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wide">{stage.level}</span>
                    <h3 className="text-lg font-bold text-foreground mt-1">{stage.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{stage.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearningRoadmap;
