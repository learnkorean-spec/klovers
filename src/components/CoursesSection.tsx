import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CoursesSection = () => {
  const { t } = useLanguage();

  const courses = [
    {
      level: "Level 0",
      title: t("course.hangul.title"),
      color: "bg-green-500",
      description: t("course.hangul.desc"),
      features: [t("course.hangul.f1"), t("course.hangul.f2"), t("course.hangul.f3"), t("course.hangul.f4")],
    },
    {
      level: "Level 1-2",
      title: t("course.beginner.title"),
      color: "bg-blue-500",
      description: t("course.beginner.desc"),
      features: [t("course.beginner.f1"), t("course.beginner.f2"), t("course.beginner.f3"), t("course.beginner.f4")],
    },
    {
      level: "Level 3-4",
      title: t("course.intermediate.title"),
      color: "bg-orange-500",
      description: t("course.intermediate.desc"),
      features: [t("course.intermediate.f1"), t("course.intermediate.f2"), t("course.intermediate.f3"), t("course.intermediate.f4")],
    },
    {
      level: "Level 5-6",
      title: t("course.advanced.title"),
      color: "bg-red-500",
      description: t("course.advanced.desc"),
      features: [t("course.advanced.f1"), t("course.advanced.f2"), t("course.advanced.f3"), t("course.advanced.f4")],
    },
    {
      level: "Special",
      title: t("course.reading.title"),
      color: "bg-purple-500",
      description: t("course.reading.desc"),
      features: [t("course.reading.f1"), t("course.reading.f2"), t("course.reading.f3")],
    },
    {
      level: "TOPIK",
      title: t("course.topik.title"),
      color: "bg-primary",
      description: t("course.topik.desc"),
      features: [t("course.topik.f1"), t("course.topik.f2"), t("course.topik.f3"), t("course.topik.f4")],
    },
  ];

  return (
    <section id="courses" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("courses.badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("courses.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("courses.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 overflow-hidden border-border hover:border-primary/50"
            >
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-3 h-3 rounded-full ${course.color}`} />
                  <span className="text-sm font-medium text-muted-foreground">
                    {course.level}
                  </span>
                </div>
                <CardTitle className="text-xl text-foreground">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {course.description}
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
