import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";

const ContactPage = () => {
  useSEO({ title: "Contact Us", description: "Get in touch with Klovers Korean Language Academy. We would love to hear from you about courses, enrollment, or any questions.", canonical: "https://kloversegy.com/contact" });
  const { t } = useLanguage();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Thank you!", description: "Please continue in our Telegram group." });
    setForm({ name: "", email: "", subject: "", message: "" });
    setTimeout(() => {
      window.open("https://t.me/+Fu5T7d4wLMsxNDY9", "_blank");
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t("contactPage", "title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("contactPage", "subtitle")}
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">
              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {t("contactPage", "form.name")}
                      </label>
                      <Input
                        placeholder={t("contactPage", "form.namePlaceholder")}
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {t("contactPage", "form.email")}
                      </label>
                      <Input
                        type="email"
                        placeholder={t("contactPage", "form.emailPlaceholder")}
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {t("contactPage", "form.subject")}
                      </label>
                      <Input
                        placeholder={t("contactPage", "form.subjectPlaceholder")}
                        value={form.subject}
                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">
                        {t("contactPage", "form.message")}
                      </label>
                      <Textarea
                        placeholder={t("contactPage", "form.messagePlaceholder")}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        required
                        rows={5}
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2">
                      <Send className="h-4 w-4" />
                      {t("contactPage", "form.send")}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="text-center">
                <p className="text-muted-foreground mb-3">{t("contactPage", "or")}</p>
                <Button
                  size="lg"
                  asChild
                  className="gap-2 rounded-full bg-[#25D366] text-white hover:bg-[#1ebe5d]"
                >
                  <a href="https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq?mode=gi_t" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-5 w-5" />
                    {t("contactPage", "whatsapp")}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
