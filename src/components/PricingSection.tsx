import { useEffect, useRef, useState } from "react";
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
import { Check, MapPin, Star, Crown, Globe, Sparkles, MessageCircle } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "@/hooks/use-toast";
import { logLeadEvent, trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { buildCountryLocalPrices, normalizeCountry, tierCountries } from "@/lib/stripePrices";
import { RATING, toArabicDigits } from "@/lib/trustFigures";
import { supabase } from "@/integrations/supabase/client";

type TierKey = "local" | "regional" | "global";

const tierIcons: Record<TierKey, React.ReactNode> = {
  local: <Star className="h-6 w-6" />,
  regional: <Globe className="h-6 w-6" />,
  global: <Crown className="h-6 w-6" />,
};

const tierPrices: Record<TierKey, { duration: string; classes: string; usd: number }[]> = {
  local: [
    { duration: "1 Month", classes: "4 classes", usd: 25 },
    { duration: "3 Months", classes: "12 classes", usd: 70 },
    { duration: "6 Months", classes: "24 classes", usd: 130 },
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

// Country prices, currencies and the tier-to-country map all live in
// @/lib/stripePrices so this page and the admin bundle picker read one table.
const countryLocalPrices = buildCountryLocalPrices();

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


const discountCountries: Partial<Record<TierKey, string>> = {
  local: "Egypt",
  regional: "Malaysia",
};

/**
 * The sentence in the Regional tier's translated description that promises a
 * Malaysia discount, in both languages. It is removed for every other country:
 * a visitor from Vietnam was being told about a discount that is not theirs.
 */
const MALAYSIA_DISCOUNT_SENTENCE = /\s*(Special discount for Malaysia students!|خصم خاص لطلاب ماليزيا!)\s*$/;

/** Flat, squared tags. The shared Badge is a puffy pill with a border and a
 *  shadow; three of them in a row read as a string of bubbles. */
const TAG =
  "whitespace-nowrap rounded-md border-0 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-none";

const tierKeys: TierKey[] = ["local", "regional", "global"];

const allCountries = tierKeys.flatMap((key) =>
  tierCountries[key].map((c) => ({ country: c, tier: key }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

type ClassType = "group" | "private";

const tierForCountry = (country: string): TierKey | null =>
  allCountries.find((c) => c.country === country)?.tier ?? null;

/** The visitor's timezone, or "" where the browser will not say. */
const browserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};

// The country the page prices in should be the visitor's, not the market we
// happen to sell most in. The timezone is all we have on the first paint, and
// a signed-in student's profiles.country replaces it when the profile lands.
// Egypt stays the last resort only because the page must never render with no
// country selected at all.
const seedCountry = (country?: string | null): string =>
  normalizeCountry(country ?? "", browserTimezone()) || "Egypt";

const PricingSection = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState<string>(() => seedCountry());
  const [activeTier, setActiveTier] = useState<TierKey | null>(() => tierForCountry(seedCountry()));
  const [classType, setClassType] = useState<ClassType>("group");
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  // The badge and trust-strip strings below were English-only on a site whose
  // main script is Arabic. They live here rather than in translations.ts for
  // the same reason WhyLearnKorean's copy does: that file is too large to edit
  // in place with the tooling available. Move them when there is git access.
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  // Once she has picked a country herself, a late-arriving profile must not
  // yank the page out from under her.
  const pickedByVisitor = useRef(false);

  const handleCountryChange = (country: string) => {
    pickedByVisitor.current = true;
    setSelectedCountry(country);
    setActiveTier(tierForCountry(country));
  };

  // Seeded, not awaited: the page has already rendered on the timezone's
  // country by the time this resolves.
  //
  // Both reads check `error`, and neither changes the page when one fails. A
  // rejected request returns a null `data`, which the optional chain below
  // would read as "no country on file" -- indistinguishable from a profile
  // that really has none, and the page would silently keep pricing in whatever
  // it had. The timezone seed is already on screen by this point and is the
  // better answer than a wrong one.
  useEffect(() => {
    let cancelled = false;

    const seedFromProfile = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) return;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("pricing: could not read profile country:", profileError.message);
        return;
      }

      const country = seedCountry((profile as any)?.country);
      if (cancelled || pickedByVisitor.current) return;
      setSelectedCountry(country);
      setActiveTier(tierForCountry(country));
    };

    seedFromProfile();
    return () => { cancelled = true; };
  }, []);

  // Anchors cost per month. Reframes "$70 for 3 months" as "$23/mo" which
  // reads closer to a streaming sub than an upfront fee.
  const derivePerMonth = (price: { duration: string; usd?: number; local?: number; currency?: string }): string => {
    const months = /^(\d+)/.exec(price.duration)?.[1];
    const n = months ? parseInt(months, 10) : 1;
    if (n <= 1) return "";
    if (price.local && price.currency) return `${Math.round(price.local / n).toLocaleString()} ${price.currency}/mo`;
    if (price.usd) return `$${Math.round(price.usd / n)}/mo`;
    return "";
  };

  const openFlexPaymentChat = (tierKey: TierKey, ct: ClassType) => {
    const msg = `Hi! I'm interested in the ${ct === "group" ? "Group" : "Private"} plan (${tierKey} tier). Can we arrange flexible/installment payment?`;
    logLeadEvent({ source_type: "pricing", cta_label: "flex_payment_whatsapp", metadata: { tier: tierKey, classType: ct } });
    trackAndOpenWhatsApp(`${WHATSAPP_BASE}?text=${encodeURIComponent(msg)}`, { cta_label: "pricing_flex_payment" });
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
              <SelectTrigger className="w-full text-base" aria-label={t("pricing", "selectCountry")}>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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
            // The Regional copy promises a Malaysia discount; only Malaysia
            // should read it.
            const description =
              tierKey === "regional" && selectedCountry !== discountCountries.regional
                ? tierT("description").replace(MALAYSIA_DISCOUNT_SENTENCE, "")
                : tierT("description");
            // Local currency belongs to the visitor's own tier only. Before
            // 23 Sep 2026 every card read the selected country's row, so a
            // visitor from Vietnam saw 1,016,000 VND on Local, Regional and
            // Global alike. The other two cards show their own USD price.
            const localRows =
              tierForCountry(selectedCountry) === tierKey ? countryLocalPrices[selectedCountry] : undefined;

            return (
              <Card
                key={tierKey}
                className={`relative transition-all duration-500 ${
                  isActive
                    ? "border-2 border-primary scale-105 shadow-xl ring-2 ring-primary/20"
                    : activeTier
                    ? "opacity-90 border-border"
                    : "border-border hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                <CardHeader className="text-center pt-6 pb-2">
                  {/* Badges live IN the header flow, not floated over the card's
                      top edge: three of them are wider than a card, so the old
                      absolute row wrapped "Most Popular" onto two lines and
                      spilled it over the tier icon. Here they wrap onto a second
                      centred row and push the icon down instead. Every badge is
                      whitespace-nowrap so no label ever breaks mid-phrase.
                      Text colours are checked: charcoal on yellow 15:1, white on
                      the --correct green 5.6:1 (the old green-500 was 2.3:1). */}
                  <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                    <Badge
                      className={`${TAG} ${
                        isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tierT("tagline") || tierKey}
                    </Badge>
                    {/* Most Popular: on local for discounted countries, on regional globally */}
                    {isDiscountedCountry && (
                      <Badge className={`${TAG} bg-foreground text-background`}>
                        <Star className="h-3 w-3 mr-1 fill-current" aria-hidden="true" /> {tr("Most Popular", "الأكثر طلباً")}
                      </Badge>
                    )}
                    {isDiscountedCountry && (
                      <Badge className={`${TAG} bg-correct text-correct-foreground`}>
                        <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" /> {tr("Discount!", "خصم!")}
                      </Badge>
                    )}
                    {tierKey === "regional" && !isDiscountedCountry && isActive && (
                      <Badge className={`${TAG} bg-foreground text-background`}>
                        <Star className="h-3 w-3 mr-1 fill-current" aria-hidden="true" /> {tr("Most Popular", "الأكثر طلباً")}
                      </Badge>
                    )}
                  </div>

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
                    {description}
                  </p>
                </CardHeader>

                <CardContent className="pt-4">
                  {tierT("discountLabel") && isDiscountedCountry && (
                    <div className="text-center mb-4">
                      <Badge variant="outline" className="text-xs">
                        {tierT("discountLabel")}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-3 mb-6">
                    {classType === "group" ? (
                      (localRows?.group ?? tierPrices[tierKey]).map((price: any) => {
                        const isBestValue = price.duration === "3 Months";
                        return (
                        <div
                          key={price.duration}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isActive && isBestValue
                              ? "bg-primary/15 border border-primary/40 ring-1 ring-primary/20"
                              : isActive ? "bg-correct/10 border border-correct/25" : "bg-muted/50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm">
                                {t("pricing", `durations.${price.duration}`) !== `durations.${price.duration}` ? t("pricing", `durations.${price.duration}`) : price.duration}
                              </p>
                              {isActive && isBestValue && (
                                <span className="text-[10px] font-bold text-primary-foreground bg-primary border border-charcoal/40 px-1.5 py-0.5 rounded-full leading-none">{tr("Best Value", "أفضل قيمة")}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("pricing", `classes.${price.classes}`) !== `classes.${price.classes}` ? t("pricing", `classes.${price.classes}`) : price.classes}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">
                              {price.local ? `${price.local.toLocaleString()} ${price.currency}` : `$${price.usd}`}
                            </p>
                            {derivePerMonth(price) && (
                              <p className="text-[11px] text-correct font-semibold">
                                {derivePerMonth(price)}
                              </p>
                            )}
                          </div>
                        </div>
                        );
                      })
                    ) : (
                      (localRows?.private ?? privatePrices[tierKey]).map((price: any) => {
                        const isBestValue = price.duration === "3 Months";
                        return (
                        <div
                          key={`private-${price.duration}`}
                          className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                            isActive && isBestValue
                              ? "bg-primary/15 border border-primary/40 ring-1 ring-primary/20"
                              : isActive ? "bg-correct/10 border border-correct/25" : "bg-muted/50"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground text-sm">
                                {t("pricing", `durations.${price.duration}`) !== `durations.${price.duration}` ? t("pricing", `durations.${price.duration}`) : price.duration}
                              </p>
                              {isActive && isBestValue && (
                                <span className="text-[10px] font-bold text-primary-foreground bg-primary border border-charcoal/40 px-1.5 py-0.5 rounded-full leading-none">{tr("Best Value", "أفضل قيمة")}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {t("pricing", `classes.${price.classes}`) !== `classes.${price.classes}` ? t("pricing", `classes.${price.classes}`) : price.classes}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">
                              {price.local ? `${price.local.toLocaleString()} ${price.currency}` : `$${price.usd}`}
                            </p>
                            {derivePerMonth(price) && (
                              <p className="text-[11px] text-correct font-semibold">
                                {derivePerMonth(price)}
                              </p>
                            )}
                          </div>
                        </div>
                        );
                      })
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
                    {/* 24 Sep 2026: the "Limited spots this intake — enroll to
                        reserve yours" banner that sat here on the active tier is
                        gone. Nothing counts spots per intake, so it was urgency
                        with no fact under it. */}
                    <Button
                      className="w-full"
                      variant={isActive ? "default" : "outline"}
                      size="lg"
                      onClick={() => {
                        logLeadEvent({
                          source_type: "pricing",
                          cta_label: "tier_get_started",
                          metadata: { classType, country: selectedCountry || null },
                        });
                        const params = new URLSearchParams({
                          classType,
                          country: selectedCountry || "",
                        });
                        navigate(`/enroll-now?${params.toString()}`);
                      }}
                    >
                      {isActive ? t("pricing", "getStartedNow") : t("pricing", "getStarted")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => openFlexPaymentChat(tierKey, classType)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1 transition-colors"
                    >
                      <MessageCircle className="h-3 w-3" />
                      {tr("Flexible / installment payment? Chat with us", "عايز تدفع بالتقسيط أو بمرونة؟ كلّمنا")}
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Trust strip */}
        <div className="mt-12 flex flex-wrap justify-center gap-6 text-center">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🛡️</span>
            <p className="text-sm font-semibold text-foreground">{tr("First Class Guarantee", "ضمان الحصة الأولى")}</p>
            <p className="text-xs text-muted-foreground">{tr("Not happy? Refund or rebook.", "لو ما عجبتكش، هنرجّعلك فلوسك أو نعيد الحجز.")}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">⭐</span>
            <p className="text-sm font-semibold text-foreground">{tr(`${RATING.value} ★ Google rating`, `${RATING.value} ★ تقييم جوجل`)}</p>
            <p className="text-xs text-muted-foreground">{tr(`From ${RATING.count} Google reviews`, `من ${toArabicDigits(RATING.count)} مراجعات جوجل`)}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🇰🇷</span>
            {/* Verified facts only, the same ones MeetTeacher states. The old
                line claimed "TOPIK-certified", which is not one of them. */}
            <p className="text-sm font-semibold text-foreground">{tr("Taught in English & Arabic", "بندرّس بالإنجليزي والعربي")}</p>
            <p className="text-xs text-muted-foreground">{tr("Al-Alsun Korean graduate · 13 years teaching", "خريجة ألسن قسم كوري · ١٣ سنة تدريس")}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🔒</span>
            <p className="text-sm font-semibold text-foreground">{tr("Secure Checkout", "دفع آمن")}</p>
            <p className="text-xs text-muted-foreground">{tr("Manual review · No auto-charge", "مراجعة يدوية · من غير خصم تلقائي")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
