import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, BookOpen, Video } from "lucide-react";

const highlightIcons = [Users, BookOpen, Video];

const MeetTeacher = () => {
  const { t, tArray } = useLanguage();
  const highlights = tArray("teacher", "highlights") as { label: string; description: string }[];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("teacher", "title")}
          </h2>
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 rounded-full bg-primary mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">👩‍🏫</span>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-4">{t("teacher", "name")}</h3>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
            {t("teacher", "bio")}
          </p>

          <div className="grid grid-cols-3 gap-4">
            {highlights.map((item, index) => {
              const Icon = highlightIcons[index];
              return (
                <Card key={index} className="border-border">
                  <CardContent className="p-4 text-center">
                    <Icon className="h-6 w-6 text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetTeacher;
