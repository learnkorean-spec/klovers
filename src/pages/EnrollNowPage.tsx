import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CreditCard, MapPin, Users, User } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { type TierKey, type ClassType, type Duration } from "@/lib/stripePrices";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Step = 1 | 2;

const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

const allCountries = (Object.keys(tierCountries) as TierKey[]).flatMap((tier) =>
  tierCountries[tier].map((c) => ({ country: c, tier }))
);
allCountries.sort((a, b) => a.country.localeCompare(b.country));

const tierPrices: Record<TierKey, Record<ClassType, Record<Duration, number>>> = {
  local: { group: { 1: 25, 3: 70, 6: 130 }, private: { 1: 50, 3: 140, 6: 250 } },
  regional: { group: { 1: 40, 3: 110, 6: 200 }, private: { 1: 80, 3: 220, 6: 380 } },
  global: { group: { 1: 60, 3: 170, 6: 300 }, private: { 1: 120, 3: 330, 6: 580 } },
};

const durationClasses: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

const EnrollNowPage = () => {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const [step, setStep] = useState<Step>(1);
  const [classType, setClassType] = useState<ClassType>(
    (searchParams.get("classType") as ClassType) || "group"
  );
  const [selectedCountry, setSelectedCountry] = useState(searchParams.get("country") || "");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const tier = useMemo(() => {
    const match = allCountries.find((c) => c.country === selectedCountry);
    return match?.tier ?? null;
  }, [selectedCountry]);

  const price = useMemo(() => {
    if (!tier || !duration) return null;
    return tierPrices[tier][classType][duration];
  }, [tier, classType, duration]);

  const canProceedStep1 = !!selectedCountry && !!tier;

  const handlePay = async () => {
    if (!tier || !duration || !name.trim() || !email.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Send only tier/classType/duration — server maps to price
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          tier,
          classType,
          duration,
          name: name.trim(),
          email: email.trim().toLowerCase(),
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Checkout error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        {/* Progress */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step >= 1 ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>1</div>
            <span className="text-sm font-medium hidden sm:inline">Choose Plan</span>
          </div>
          <div className={`w-12 h-0.5 ${step >= 2 ? "bg-primary" : "bg-border"}`} />
          <div className={`flex items-center gap-2 ${step >= 2 ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>2</div>
            <span className="text-sm font-medium hidden sm:inline">Pay & Enroll</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
              <p className="text-muted-foreground">Select your class type and country to see pricing.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Class Type */}
              <div className="space-y-2">
                <Label>Class Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setClassType("group")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "group"
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Users className="h-6 w-6" />
                    <span className="font-semibold text-foreground">Group Classes</span>
                    <span className="text-xs text-muted-foreground">Learn with others</span>
                  </button>
                  <button
                    onClick={() => setClassType("private")}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      classType === "private"
                        ? "border-primary bg-accent"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <User className="h-6 w-6" />
                    <span className="font-semibold text-foreground">Private Classes</span>
                    <span className="text-xs text-muted-foreground">1-on-1 sessions</span>
                  </button>
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label>Your Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select your country" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {allCountries.map(({ country }) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary */}
              {tier && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Your pricing tier</p>
                  <Badge>{tier.charAt(0).toUpperCase() + tier.slice(1)} Tier</Badge>
                  <p className="text-xs text-muted-foreground mt-2">
                    {classType === "group" ? "Group" : "Private"} classes · Starting from ${tierPrices[tier][classType][1]}/mo
                  </p>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className="text-2xl">Choose Duration & Pay</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    {classType === "group" ? "Group" : "Private"} classes · {selectedCountry}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration */}
              <div className="space-y-2">
                <Label>Duration</Label>
                <div className="grid grid-cols-3 gap-3">
                  {([1, 3, 6] as Duration[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        duration === d
                          ? "border-primary bg-accent"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="font-bold text-foreground">{d} {d === 1 ? "Month" : "Months"}</p>
                      <p className="text-xs text-muted-foreground">{durationClasses[d]} classes</p>
                      {tier && (
                        <p className="text-sm font-bold text-foreground mt-1">${tierPrices[tier][classType][d]}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name & Email */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                  />
                </div>
              </div>

              {/* Price Summary */}
              {duration && price !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{classType === "group" ? "Group" : "Private"} · {duration} {duration === 1 ? "month" : "months"}</span>
                    <span className="font-bold text-foreground">${price}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{durationClasses[duration]} classes included</span>
                    <span>${(price / durationClasses[duration]).toFixed(2)}/class</span>
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!duration || !name.trim() || !email.trim() || loading}
                onClick={handlePay}
              >
                {loading ? "Redirecting to payment..." : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Pay ${price ?? "—"} Now
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure payment via Stripe. Your account will be created automatically after payment.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default EnrollNowPage;
