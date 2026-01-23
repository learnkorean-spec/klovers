import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Users,
  MessageCircle,
  Award,
  Heart,
  Percent,
} from "lucide-react";

const features = [
  {
    icon: GraduationCap,
    title: "Structured Levels",
    description: "From Hangul to Advanced fluency",
  },
  {
    icon: Users,
    title: "Flexible Classes",
    description: "Group & private options available",
  },
  {
    icon: MessageCircle,
    title: "Speaking-Focused",
    description: "Practical conversation lessons",
  },
  {
    icon: Award,
    title: "TOPIK Prep",
    description: "Exam preparation courses",
  },
  {
    icon: Heart,
    title: "Supportive Community",
    description: "Learn with fellow K-Lovers",
  },
  {
    icon: Percent,
    title: "Special Discounts",
    description: "For Egyptian students 🇪🇬",
  },
];

const WhyKLovers = () => {
  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why K-Lovers?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to master Korean in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50"
            >
              <CardContent className="p-6 flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="h-6 w-6 text-primary-foreground transition-colors" />
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
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyKLovers;
