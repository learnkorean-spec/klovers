import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, User, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const PricingSection = () => {
  const { t } = useLanguage();

  const groupPricing = [
    {
      duration: t("pricing.1month"),
      classes: t("pricing.4classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "1000",
      popular: false,
    },
    {
      duration: t("pricing.3months"),
      classes: t("pricing.12classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "2900",
      popular: true,
    },
    {
      duration: t("pricing.6months"),
      classes: t("pricing.24classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "5400",
      popular: false,
    },
  ];

  const privatePricing = [
    {
      duration: t("pricing.1month"),
      classes: t("pricing.4classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "1300",
    },
    {
      duration: t("pricing.3months"),
      classes: t("pricing.12classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "3700",
    },
    {
      duration: t("pricing.6months"),
      classes: t("pricing.24classes"),
      frequency: t("pricing.oncePerWeek"),
      price: "5400",
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("pricing.badge")}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("pricing.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Group Classes */}
        <div className="mb-16">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Users className="h-6 w-6 text-foreground" />
            <h3 className="text-2xl font-bold text-foreground">
              {t("pricing.group")}
            </h3>
            <Badge className="bg-primary text-primary-foreground">
              {t("pricing.groupBadge")}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {groupPricing.map((plan, index) => (
              <Card
                key={index}
                className={`relative transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-2 border-primary scale-105"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      {t("pricing.mostPopular")}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl text-foreground">
                    {plan.duration}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ms-1">
                      {t("pricing.currency")}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground" />
                      {plan.classes}
                    </li>
                    <li className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground" />
                      {plan.frequency}
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                  >
                    <a href="#enroll">{t("pricing.getStarted")}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Private Classes */}
        <div>
          <div className="flex items-center justify-center gap-3 mb-8">
            <User className="h-6 w-6 text-foreground" />
            <h3 className="text-2xl font-bold text-foreground">
              {t("pricing.private")}
            </h3>
            <Badge variant="secondary">{t("pricing.individual")}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {privatePricing.map((plan, index) => (
              <Card
                key={index}
                className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl"
              >
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl text-foreground">
                    {plan.duration}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-4xl font-bold text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground ms-1">
                      {t("pricing.currency")}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground" />
                      {plan.classes}
                    </li>
                    <li className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground" />
                      {plan.frequency}
                    </li>
                  </ul>
                  <Button className="w-full" variant="outline" asChild>
                    <a href="#enroll">{t("pricing.getStarted")}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
