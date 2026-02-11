import { useState } from "react";
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
import { Check, MapPin, Globe, Star, Crown, Sparkles } from "lucide-react";

type TierKey = "local" | "regional" | "global";

interface TierInfo {
  key: TierKey;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  description: string;
  prices: { duration: string; classes: string; usd: number; local?: string }[];
  countries: string[];
  discountCountry?: string;
  discountLabel?: string;
}

const tiers: TierInfo[] = [
  {
    key: "local",
    name: "Local Klovers",
    tagline: "Starter",
    icon: <Star className="h-6 w-6" />,
    description:
      "Perfect for beginners! Start your Korean journey at a special discounted price.",
    prices: [
      { duration: "1 Month", classes: "4 classes", usd: 25, local: "~1,170 EGP" },
      { duration: "3 Months", classes: "12 classes", usd: 70, local: "~3,276 EGP" },
      { duration: "6 Months", classes: "24 classes", usd: 130, local: "~6,110 EGP" },
    ],
    countries: [
      "Egypt",
      "Morocco",
      "Tunisia",
      "Algeria",
      "Libya",
      "Jordan",
      "Lebanon",
      "Iraq",
      "Syria",
      "Sudan",
      "Yemen",
    ],
    discountCountry: "Egypt",
    discountLabel: "Discounted for Egyptian Students 🇪🇬",
  },
  {
    key: "regional",
    name: "Regional Klovers",
    tagline: "Explorer",
    icon: <Globe className="h-6 w-6" />,
    description:
      "For learners ready to explore Korean language and culture. Special discount for Malaysia students!",
    prices: [
      { duration: "1 Month", classes: "4 classes", usd: 40 },
      { duration: "3 Months", classes: "12 classes", usd: 110 },
      { duration: "6 Months", classes: "24 classes", usd: 200 },
    ],
    countries: [
      "Malaysia",
      "Indonesia",
      "Thailand",
      "Vietnam",
      "Philippines",
      "India",
      "Pakistan",
      "Brazil",
      "Mexico",
      "Colombia",
      "Argentina",
      "Turkey",
    ],
    discountCountry: "Malaysia",
    discountLabel: "Discounted for Malaysian Students 🇲🇾",
  },
  {
    key: "global",
    name: "Global Klovers",
    tagline: "Master",
    icon: <Crown className="h-6 w-6" />,
    description:
      "Full premium experience for advanced learners and serious Korean enthusiasts.",
    prices: [
      { duration: "1 Month", classes: "4 classes", usd: 60 },
      { duration: "3 Months", classes: "12 classes", usd: 170 },
      { duration: "6 Months", classes: "24 classes", usd: 300 },
    ],
    countries: [
      "UAE",
      "Saudi Arabia",
      "Qatar",
      "Bahrain",
      "Oman",
      "Kuwait",
      "United States",
      "United Kingdom",
      "Germany",
      "France",
      "Canada",
      "Australia",
      "Japan",
      "South Korea",
      "China",
    ],
  },
];

const allCountries = tiers.flatMap((t) =>
  t.countries.map((c) => ({ country: c, tier: t.key }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

const PricingSection = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [activeTier, setActiveTier] = useState<TierKey | null>(null);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    const match = allCountries.find((c) => c.country === country);
    setActiveTier(match?.tier ?? null);
  };

  return (
    <section id="pricing" className="py-20 bg-card">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            💰 Pricing
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Flexible Plans for Every Klover
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            💡 Choose your country to see your exclusive Klovers tier and
            discounted price!
          </p>

          {/* Country Selector */}
          <div className="max-w-sm mx-auto">
            <Select value={selectedCountry} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full text-base">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select your country" />
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
        </div>

        {/* Tiers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {tiers.map((tier) => {
            const isActive = activeTier === tier.key;
            const isDiscountedCountry =
              selectedCountry === tier.discountCountry;

            return (
              <Card
                key={tier.key}
                className={`relative transition-all duration-500 ${
                  isActive
                    ? "border-2 border-primary scale-105 shadow-xl ring-2 ring-primary/20"
                    : activeTier
                    ? "opacity-60 border-border"
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {/* Tier Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <Badge
                    className={
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }
                  >
                    {tier.tagline}
                  </Badge>
                  {isDiscountedCountry && (
                    <Badge className="bg-destructive text-destructive-foreground animate-pulse">
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
                      {tier.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {tier.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {tier.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-4">
                  {/* Discount label */}
                  {tier.discountLabel && (
                    <div className="text-center mb-4">
                      <Badge variant="outline" className="text-xs">
                        {tier.discountLabel}
                      </Badge>
                    </div>
                  )}

                  {/* Pricing rows */}
                  <div className="space-y-3 mb-6">
                    {tier.prices.map((price) => (
                      <div
                        key={price.duration}
                        className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isActive ? "bg-accent" : "bg-muted/50"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground text-sm">
                            {price.duration}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {price.classes}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-foreground">
                            ${price.usd}
                          </p>
                          {price.local && isActive && (
                            <p className="text-xs text-muted-foreground">
                              {price.local}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground shrink-0" />
                      Once per week classes
                    </li>
                    <li className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-foreground shrink-0" />
                      Group & private options
                    </li>
                    {tier.key === "global" && (
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-foreground shrink-0" />
                        Priority scheduling
                      </li>
                    )}
                  </ul>

                  {/* Countries list */}
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Available in
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {tier.countries.map((c) => (
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

                  <Button
                    className="w-full"
                    variant={isActive ? "default" : "outline"}
                    size="lg"
                    asChild
                  >
                    <a href="#enroll">
                      {isActive ? "Get Started Now" : "Get Started"}
                    </a>
                  </Button>
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
