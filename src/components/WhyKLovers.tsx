import { Card, CardContent } from "@/components/ui/card";
import KloverIcon, { type KloverIconName } from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";

// Same order as `why.features` in translations.ts:
// Structured Levels, Flexible Classes, Speaking-Focused, TOPIK Prep,
// Supportive Community, Special Discounts.
const icons: KloverIconName[] = [
  "books-stack",
  "calendar-check",
  "chat-annyeonghaseyo",
  "badge-blossom",
  "klobi-headphones",
  "lightbulb-sprout",
];

const WhyKLovers = () => {
  const { t, tArray } = useLanguage();
  const features = tArray("why", "features") as { title: string; description: string }[];

  return (
    <section className="py-20 md:py-28 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block bg-primary text-black text-xs font-bold uppercase tracking-widest px-5 py-2 rounded-full border border-black/25 shadow-sm mb-5">
            {t("why", "badge") || "Why Klovers"}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {t("why", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("why", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const icon = icons[index];
            return (
              <Card
                key={index}
                className="group hover:shadow-md transition-all duration-200 border-border hover:border-primary/50"
              >
                <CardContent className="p-6 flex items-start gap-4">
                  {/* Ivory dome, not the yellow tile: the drawings need a light
                      surface to keep their outline. On dark they stand directly
                      on the card (palette rule, 2026-09-20). */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-ivory dark:bg-transparent flex items-center justify-center group-hover:scale-110 transition-all duration-300 border border-charcoal/15 dark:border-transparent">
                    {icon && <KloverIcon name={icon} className="h-10 w-10" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyKLovers;
