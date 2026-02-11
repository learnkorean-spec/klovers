import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, BookOpen, Award } from "lucide-react";

const highlightIcons = [Users, BookOpen, Award];

const MeetTeacher = () => {
  const { t, tArray } = useLanguage();
  const highlights = tArray("teacher", "highlights") as { label: string; description: string }[];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Column */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              {t("teacher", "title")}
            </h2>

            <div className="space-y-4 text-muted-foreground leading-relaxed mb-8">
              <p>{t("teacher", "bio1")}</p>
              <p>{t("teacher", "bio2")}</p>
              <p>{t("teacher", "bio3")}</p>
              <p>{t("teacher", "bio4")}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {highlights.map((item, index) => {
                const Icon = highlightIcons[index];
                return (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-4 py-2 text-sm gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label} {item.description}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Avatar / Visual Column */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-primary/10 blur-2xl" />
              <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-primary/20 border-4 border-primary/30 flex items-center justify-center">
                <span className="text-7xl md:text-8xl">👩‍🏫</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MeetTeacher;
