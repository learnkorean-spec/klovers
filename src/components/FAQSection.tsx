import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "Do I need prior knowledge of Korean?",
    answer:
      "No — we offer a Hangul course specifically designed for absolute beginners. You'll learn the Korean alphabet from scratch before moving on to vocabulary and grammar.",
  },
  {
    question: "Are classes online or offline?",
    answer:
      "All our classes are conducted online, making it convenient for you to learn from anywhere. You just need a stable internet connection and a device to join the sessions.",
  },
  {
    question: "Is there a placement test?",
    answer:
      "Yes, we offer a placement test to help you choose the right level. This ensures you're placed in a class that matches your current Korean proficiency.",
  },
  {
    question: "Do I get a certificate?",
    answer:
      "Yes, after successfully completing your course, you will receive a certificate of completion from K-Lovers that you can add to your portfolio or resume.",
  },
  {
    question: "What is the class schedule?",
    answer:
      "Classes are held once per week. The specific day and time will be coordinated with your group or instructor to find the most convenient schedule for everyone.",
  },
  {
    question: "Can I switch from group to private classes?",
    answer:
      "Yes! You can switch between class types. Simply contact our team and we'll help you make the transition smoothly.",
  },
];

const FAQSection = () => {
  return (
    <section id="faq" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            ❓ FAQ
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers!
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
