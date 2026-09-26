import { MessageCircle, Facebook, Phone, Mail } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "@/lib/siteConfig";

const TiktokIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const Footer = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const learnLinks = isAr
    ? [{ to: "/hangul-starter", label: "ورقة هانغول المجانية 🆓" }, { to: "/textbook", label: "الكتاب المدرسي" }, { to: "/games", label: "الألعاب" }, { to: "/review", label: "مراجعة المفردات" }, { to: "/placement-test", label: "اختبار تحديد المستوى" }]
    : [{ to: "/hangul-starter", label: "Free Hangul Sheet 🆓" }, { to: "/textbook", label: "Textbook" }, { to: "/games", label: "Games" }, { to: "/review", label: "Vocabulary Review" }, { to: "/placement-test", label: "Placement Test" }];

  const companyLinks = isAr
    ? [{ to: "/courses", label: "الدورات" }, { to: "/pricing", label: "الأسعار" }, { to: "/about", label: "من نحن" }, { to: "/blog", label: "المدونة" }, { to: "/contact", label: "تواصل معنا" }, { to: "/faq", label: "الأسئلة الشائعة" }]
    : [{ to: "/courses", label: "Courses" }, { to: "/pricing", label: "Pricing" }, { to: "/about", label: "About" }, { to: "/blog", label: "Blog" }, { to: "/contact", label: "Contact" }, { to: "/faq", label: "FAQ" }];

  /**
   * One hover for all three, and it is the brand's.
   *
   * These used to light up in Telegram blue, pure black and Facebook blue —
   * three colours Klovers does not own, on the one surface where the brand
   * signs its name. The ICON already says which platform each button is.
   */
  const social = [
    { href: "https://t.me/+Fu5T7d4wLMsxNDY9", Icon: MessageCircle, label: "Telegram" },
    { href: "https://www.tiktok.com/@kloversegy", Icon: TiktokIcon, label: "TikTok" },
    { href: "https://www.facebook.com/kloversegy", Icon: Facebook, label: "Facebook" },
  ];

  return (
    <footer className="bg-foreground text-background">
      {/* Main footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <span className="font-bold text-xl">{isAr ? "كلوفرز" : "Klovers"}</span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed mb-4">
              {t("footer", "tagline")}
            </p>
            <div className="space-y-1.5 text-background/70 text-sm">
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 py-1 hover:text-primary transition-colors">
                <Mail className="h-3.5 w-3.5 shrink-0" /> {CONTACT_EMAIL}
              </a>
              <a href="tel:+201010003084" className="flex items-center gap-2 py-1 hover:text-primary transition-colors">
                <Phone className="h-3.5 w-3.5 shrink-0" /> +201010003084
              </a>
            </div>
          </div>

          {/* Learn */}
          <div>
            <h4 className="font-semibold mb-4 text-background">{isAr ? "تعلم" : "Learn"}</h4>
            <ul className="space-y-1">
              {learnLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="inline-block py-1 text-background/65 hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4 text-background">{isAr ? "الشركة" : "Company"}</h4>
            <ul className="space-y-1">
              {companyLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="inline-block py-1 text-background/65 hover:text-primary text-sm transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4 text-background">{t("footer", "joinCommunity")}</h4>
            <p className="text-background/60 text-xs mb-4 leading-relaxed">
              {isAr ? "انضم لمجتمعنا وتواصل مع متعلمي اللغة الكورية حول العالم." : "Join our community and connect with Korean learners worldwide."}
            </p>
            <div className="flex gap-2 flex-wrap">
              {social.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="h-9 w-9 rounded-lg border border-background/25 flex items-center justify-center text-background/70 transition-all hover:bg-klovers-yellow hover:border-klovers-yellow hover:text-charcoal"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar.
          The name is written here rather than read from translations'
          footer.copyright, which still says "Klovers Korean Courses": the
          23 Sep review found the brand named "Academy" everywhere else and
          "Korean Courses" only here. */}
      <div className="border-t border-background/15">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-background/45 text-xs">
            © {new Date().getFullYear()}{" "}
            {isAr ? "كلوفرز — أكاديمية محبي الكورية. جميع الحقوق محفوظة." : "Klovers Korean Academy. All rights reserved."}
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy-policy" className="inline-block py-1 text-background/75 hover:text-background text-xs transition-colors">
              {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
            </Link>
            <Link to="/terms" className="inline-block py-1 text-background/75 hover:text-background text-xs transition-colors">
              {isAr ? "الشروط والأحكام" : "Terms of Service"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
