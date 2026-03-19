import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, MapPin, Star, Crown, Globe, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";

type TierKey = "local" | "regional" | "global";

const tierIcons: Record<TierKey, React.ReactNode> = {
  local: <Star className="h-6 w-6" />,
  regional: <Globe className="h-6 w-6" />,
  global: <Crown className="h-6 w-6" />,
};

const tierPrices: Record<TierKey, { duration: string; classes: string; usd: number; local?: string }[]> = {
  local: [
    { duration: "1 Month", classes: "4 classes", usd: 25, local: "~1,170 EGP" },
    { duration: "3 Months", classes: "12 classes", usd: 70, local: "~3,276 EGP" },
    { duration: "6 Months", classes: "24 classes", usd: 130, local: "~6,110 EGP" },
  ],
  regional: [
    { duration: "1 Month", classes: "4 classes", usd: 40 },
    { duration: "3 Months", classes: "12 classes", usd: 110 },
    { duration: "6 Months", classes: "24 classes", usd: 200 },
  ],
  global: [
    { duration: "1 Month", classes: "4 classes", usd: 60 },
    { duration: "3 Months", classes: "12 classes", usd: 170 },
    { duration: "6 Months", classes: "24 classes", usd: 300 },
  ],
};

const egpGroupPrices = [
  { duration: "1 Month", classes: "4 classes", egp: 1200 },
  { duration: "3 Months", classes: "12 classes", egp: 3300 },
  { duration: "6 Months", classes: "24 classes", egp: 6100 },
];

const egpPrivatePrices = [
  { duration: "1 Month", classes: "4 classes", egp: 2350 },
  { duration: "3 Months", classes: "12 classes", egp: 6600 },
  { duration: "6 Months", classes: "24 classes", egp: 11750 },
];

const privatePrices: Record<TierKey, { duration: string; classes: string; usd: number }[]> = {
  local: [
    { duration: "1 Month", classes: "4 classes", usd: 50 },
    { duration: "3 Months", classes: "12 classes", usd: 140 },
    { duration: "6 Months", classes: "24 classes", usd: 250 },
  ],
  regional: [
    { duration: "1 Month", classes: "4 classes", usd: 80 },
    { duration: "3 Months", classes: "12 classes", usd: 220 },
    { duration: "6 Months", classes: "24 classes", usd: 380 },
  ],
  global: [
    { duration: "1 Month", classes: "4 classes", usd: 120 },
    { duration: "3 Months", classes: "12 classes", usd: 330 },
    { duration: "6 Months", classes: "24 classes", usd: 580 },
  ],
};

const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

const discountCountries: Partial<Record<TierKey, string>> = {
  local: "Egypt",
  regional: "Malaysia",
};

const tierKeys: TierKey[] = ["local", "regional", "global"];

const allCountries = tierKeys.flatMap((key) =>
  tierCountries[key].map((c) => ({ country: c, tier: key }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

type ClassType = "group" | "private";

const PricingSection = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [activeTier, setActiveTier] = useState<TierKey | null>(null);
  const [classType, setClassType] = useState<ClassType>("group");
  const { t } = useLanguage();

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    const match = allCountries.find((c) => c.country === country);
    setActiveTier(match?.tier ?? null);
  };

  return (
    <section id="pricing" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {t("pricing", "badge")}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t("pricing", "title")}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            {t("pricing", "subtitle")}
          </p>

          <div className="max-w-sm mx-auto">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder={t("pricing", "selectCountry")} />
                </div>
              </SelectTrigger>
              <SelectContent>
                {allCountries.map(({ country }) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center mt-6">
            <div className="inline-flex rounded-lg bg-muted p-1">
              <button
                onClick={() => setClassType("group")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  classType === "group"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("pricing", "groupClasses")}
              </button>
              <button
                onClick={() => setClassType("private")}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-colors ${
                  classType === "private"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("pricing", "privateClasses")}
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tierKeys.map((tierKey) => {
            const isActive = activeTier === tierKey;
            const isDiscountedCountry = selectedCountry === discountCountries[tierKey];
            const tierT = (key: string) => {
              const val = t("pricing", `tiers.${tierKey}.${key}`);
              return val !== `tiers.${tierKey}.${key}` ? val : "";
            };

            return (
              <Card
                key={tierKey}
                className={`relative transition-all duration-500 ${
                  isActive
                    ? "border-2 border-primary scale-105 shadow-xl ring-2 ring-primary/20"
                    : activeTier
                    ? "opacity-60 border-border"
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <Badge
                    className={
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }
                  >
                    {tierT("tagline") || tierKey}
                  </Badge>
                  {tierKey === "regional" && !isDiscountedCountry && (
                    <Badge className="bg-amber-500 text-white">⭐ Most Popular</Badge>
                  )}
                  {isDiscountedCountry && (
                    <Badge className="bg-emerald-500 text-white animate-pulse">
                      <Sparkles className="h-3 w-3 mr-1" /> Discount!
                    </Badge>
                  )}
                </div>

                <CardHeader className="text-center pt-8 pb-2">
                  <div className="flex justify-center mb-3">
                    <div
                      className={`p-3 rounded-full ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      } transition-colors`}
                    >
                      {tierIcons[tierKey]}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {tierT("name") || tierKey}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tierT("description")}
                  </p>
                </CardHeader>

                <CardContent className="pt-4">
                  {tierT("discountLabel") && (
                    <div className="text-center mb-4">
                      <Badge variant="outline" className="text-xs">
                        {tierT("discountLabel")}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {classType === "group" ? (
                      (selectedCountry === "Egypt" && tierKey === "local" ? egpGroupPrices : tierPrices[tierKey]).map((price: any) => (
                        <div
                          key={price.duration}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isActive ? "bg-accent" : "bg-muted/50"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {t("pricing", `durations.${price.duration}`) !== `durations.${price.duration}` ? t("pricing", `durations.${price.duration}`) : price.duration}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("pricing", `classes.${price.classes}`) !== `classes.${price.classes}` ? t("pricing", `classes.${price.classes}`) : price.classes}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">
                              {price.egp ? `${price.egp.toLocaleString()} EGP` : `$${price.usd}`}
                            </p>
                            {price.local && isActive && !price.egp && (
                              <p className="text-xs text-muted-foreground">
                                {price.local}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      (selectedCountry === "Egypt" && tierKey === "local" ? egpPrivatePrices : privatePrices[tierKey]).map((price: any) => (
                        <div
                          key={`private-${price.duration}`}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isActive ? "bg-accent" : "bg-muted/50"
                          }`}
                        >
                          <div>
                            <p className="font-semibold text-foreground text-sm">
                              {t("pricing", `durations.${price.duration}`) !== `durations.${price.duration}` ? t("pricing", `durations.${price.duration}`) : price.duration}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t("pricing", `classes.${price.classes}`) !== `classes.${price.classes}` ? t("pricing", `classes.${price.classes}`) : price.classes}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">
                              {price.egp ? `${price.egp.toLocaleString()} EGP` : `$${price.usd}`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {classType === "group" ? (
                      <>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "groupBenefits.oncePerWeek")}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "groupBenefits.groupEnvironment")}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "groupBenefits.structuredCurriculum")}
                        </li>
                      </>
                    ) : (
                      <>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "privateBenefits.privateSessions")}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "privateBenefits.flexibleScheduling")}
                        </li>
                        <li className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-foreground shrink-0" />
                          {t("pricing", "privateBenefits.personalFeedback")}
                        </li>
                      </>
                    )}
                  </ul>

                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      {t("pricing", "availableIn")}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tierCountries[tierKey].map((c) => (
                        <span
                          key={c}
                          className={`text-xs px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                            selectedCountry === c
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-accent"
                          }`}
                          onClick={() => handleCountryChange(c)}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        const params = new URLSearchParams({
                          classType,
                          country: selectedCountry || "",
                        });
                        navigate(`/enroll-now?${params.toString()}`);
                      }}
                    >
                      {isActive ? t("pricing", "getStartedNow") : t("pricing", "getStarted")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
