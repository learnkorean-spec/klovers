import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, Facebook } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-foreground text-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🇰🇷</span>
              <span className="font-bold text-xl">K-Lovers</span>
            </div>
            <p className="text-background/70 text-sm">
              {t("footer", "tagline")}
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer", "quickLinks")}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#courses" className="text-background/70 hover:text-primary text-sm transition-colors">
                  {t("header", "courses")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-background/70 hover:text-primary text-sm transition-colors">
                  {t("header", "pricing")}
                </a>
              </li>
              <li>
                <a href="#enroll" className="text-background/70 hover:text-primary text-sm transition-colors">
                  {t("header", "enroll")}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-background/70 hover:text-primary text-sm transition-colors">
                  {t("header", "faq")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t("footer", "joinCommunity")}</h4>
            <div className="flex gap-3">
              <Button
                size="icon"
                variant="outline"
                className="bg-transparent border-background/30 hover:bg-primary hover:border-primary"
                asChild
              >
                <a href="https://t.me/+Fu5T7d4wLMsxNDY9" target="_blank" rel="noopener noreferrer" aria-label="Telegram">
                  <MessageCircle className="h-5 w-5" />
                </a>
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-transparent border-background/30 hover:bg-primary hover:border-primary"
                asChild
              >
                <a href="#" aria-label="Instagram">
                  <Instagram className="h-5 w-5" />
                </a>
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="bg-transparent border-background/30 hover:bg-primary hover:border-primary"
                asChild
              >
                <a href="#" aria-label="Facebook">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center">
          <p className="text-background/50 text-sm">
            © {new Date().getFullYear()} {t("footer", "copyright")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
