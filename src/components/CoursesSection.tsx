import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const courseColors = [
  "bg-green-500",
  "bg-blue-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-primary",
];

const CoursesSection = () => {
  const { t, tArray } = useLanguage();
  const courses = tArray("courses", "items") as {
    level: string; title: string; description: string; features: string[];
  }[];

  return (
    <section id="courses" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("courses", "badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("courses", "title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("courses", "subtitle")}
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
                  <span className={`w-3 h-3 rounded-full ${courseColors[index]}`} />
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
