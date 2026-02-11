import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Testimonials = () => {
  const { t, tArray } = useLanguage();
  const items = tArray("testimonials", "items") as { name: string; quote: string; location: string }[];

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("testimonials", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("testimonials", "subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {items.map((item, index) => (
            <Card key={index} className="border-border hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6">
                <Quote className="h-8 w-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4 italic leading-relaxed">
                  "{item.quote}"
                </p>
                <div className="border-t border-border pt-4">
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
