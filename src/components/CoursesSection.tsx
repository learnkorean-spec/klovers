import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const courses = [
  {
    level: "Level 0",
    title: "Hangul Course",
    color: "bg-green-500",
    description: "Learn the Korean alphabet",
    features: [
      "Hangul reading & writing",
      "Sound and pronunciation practice",
      "Basic words",
      "Writing guides, audio & worksheets",
    ],
  },
  {
    level: "Level 1-2",
    title: "Beginner Course",
    color: "bg-blue-500",
    description: "Build your basics",
    features: [
      "Self-introduction & daily conversations",
      "Essential grammar and vocabulary",
      "Beginner learning materials",
      "Speaking practice",
    ],
  },
  {
    level: "Level 3-4",
    title: "Intermediate Course",
    color: "bg-orange-500",
    description: "Use Korean with confidence",
    features: [
      "Grammar in real conversations",
      "Reading texts & comprehension",
      "Practice tests",
      "TOPIK-style questions",
    ],
  },
  {
    level: "Level 5-6",
    title: "Advanced Course",
    color: "bg-red-500",
    description: "Master fluency & cultural depth",
    features: [
      "Advanced grammar structures",
      "Reading articles",
      "Cultural discussions",
      "Idiomatic expressions",
    ],
  },
  {
    level: "Special",
    title: "Reading & Speaking",
    color: "bg-purple-500",
    description: "Improve fluency and pronunciation",
    features: [
      "Speaking & pronunciation practice",
      "Reading Korean texts",
      "Building confidence in conversation",
    ],
  },
  {
    level: "TOPIK",
    title: "TOPIK Preparation",
    color: "bg-primary",
    description: "Prepare for the official exam",
    features: [
      "Listening, Reading & Writing practice",
      "Exam strategies & tips",
      "Full mock tests",
      "Complete preparation materials",
    ],
  },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            📚 Courses & Levels
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Choose the Level That Matches Your Journey
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From complete beginners to advanced learners, we have the perfect
            course for you
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
                  <span
                    className={`w-3 h-3 rounded-full ${course.color}`}
                  />
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
