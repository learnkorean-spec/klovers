import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, FileText, CheckCircle2 } from "lucide-react";

const steps = [
  {
    number: "1",
    icon: MessageCircle,
    title: "Join Our Telegram Group",
    description: "Stay updated with announcements and course news.",
    link: "https://t.me/+Fu5T7d4wLMsxNDY9",
    buttonText: "Join Telegram",
  },
  {
    number: "2",
    icon: FileText,
    title: "Complete the Registration Form",
    description: "Fill in your details so we can reserve your spot.",
    link: "https://tally.so/r/nr4eal",
    buttonText: "Fill Form",
  },
  {
    number: "3",
    icon: CheckCircle2,
    title: "Confirm Your Enrollment",
    description:
      "After joining and submitting the form, our team will contact you with the next steps.",
    link: null,
    buttonText: null,
  },
];

const EnrollSection = () => {
  return (
    <section id="enroll" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            📝 How to Enroll
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Join K-Lovers Korean Courses Today
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            At K-Lovers, enrolling is simple and fast. Follow these 3 steps to
            secure your spot!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <Card
              key={index}
              className="relative group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 overflow-hidden"
            >
              {/* Step Number */}
              <div className="absolute -top-2 -left-2 w-12 h-12 bg-primary rounded-br-2xl flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  {step.number}
                </span>
              </div>

              <CardContent className="pt-12 pb-6 px-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <step.icon className="h-8 w-8 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                  {step.description}
                </p>

                {step.link && step.buttonText && (
                  <Button asChild className="w-full">
                    <a
                      href={step.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {step.buttonText}
                    </a>
                  </Button>
                )}

                {!step.link && (
                  <div className="flex items-center justify-center gap-2 text-sm text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    We'll reach out to you!
                  </div>
                )}
              </CardContent>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EnrollSection;
