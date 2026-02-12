import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type TierKey = "local" | "regional" | "global";
type ClassType = "group" | "private";
type Duration = 1 | 3 | 6;

const DURATION_MAP: Record<Duration, number> = { 1: 4, 3: 12, 6: 24 };

const tierCountries: Record<TierKey, string[]> = {
  local: ["Egypt", "Morocco", "Tunisia", "Algeria", "Libya", "Jordan", "Lebanon", "Iraq", "Syria", "Sudan", "Yemen"],
  regional: ["Malaysia", "Indonesia", "Thailand", "Vietnam", "Philippines", "India", "Pakistan", "Brazil", "Mexico", "Colombia", "Argentina", "Turkey"],
  global: ["UAE", "Saudi Arabia", "Qatar", "Bahrain", "Oman", "Kuwait", "United States", "United Kingdom", "Germany", "France", "Canada", "Australia", "Japan", "South Korea", "China"],
};

const tierPrices: Record<TierKey, Record<ClassType, Record<Duration, number>>> = {
  local: { group: { 1: 25, 3: 70, 6: 130 }, private: { 1: 50, 3: 140, 6: 250 } },
  regional: { group: { 1: 40, 3: 110, 6: 200 }, private: { 1: 80, 3: 220, 6: 380 } },
  global: { group: { 1: 60, 3: 170, 6: 300 }, private: { 1: 120, 3: 330, 6: 580 } },
};

function getTierForCountry(country: string): TierKey | null {
  for (const [tier, countries] of Object.entries(tierCountries)) {
    if (countries.includes(country)) return tier as TierKey;
  }
  return null;
}

const EnrollPage = () => {
  const [planType, setPlanType] = useState<ClassType | "">("");
  const [duration, setDuration] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("country")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.country) setUserCountry(profile.country);
    };
    load();
  }, [navigate]);

  const tier = useMemo(() => getTierForCountry(userCountry), [userCountry]);

  const price = useMemo(() => {
    if (!tier || !planType || !duration) return null;
    return tierPrices[tier]?.[planType as ClassType]?.[Number(duration) as Duration] ?? null;
  }, [tier, planType, duration]);

  const classesIncluded = duration ? DURATION_MAP[Number(duration) as Duration] : 0;
  const unitPrice = price && classesIncluded ? (price / classesIncluded).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !userId || !planType || !duration || !paymentMethod || price === null) return;
    setLoading(true);

    const filePath = `${userId}/${Date.now()}-${receiptFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(filePath, receiptFile);

    if (uploadError) {
      toast({ title: "Upload failed", description: "Could not upload receipt.", variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: enrollmentId, error: insertError } = await supabase.rpc("submit_manual_enrollment", {
      _plan_type: planType,
      _duration: Number(duration),
      _amount: price,
      _tx_ref: txRef,
      _receipt_url: filePath,
      _payment_method: paymentMethod,
    } as any);

    if (insertError || !enrollmentId) {
      toast({ title: "Error", description: "Failed to submit enrollment.", variant: "destructive" });
      setLoading(false);
      return;
    }

    toast({ title: "Enrollment submitted!", description: "We'll review your payment shortly." });
    setLoading(false);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Enroll Now (Manual Payment)</CardTitle>
          </CardHeader>
          <CardContent>
            {!tier && userCountry && (
              <p className="text-sm text-destructive mb-4">
                Your country "{userCountry}" is not recognized. Please update your profile.
              </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={planType} onValueChange={(v) => setPlanType(v as ClassType)}>
                <SelectTrigger><SelectValue placeholder="Plan type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group Classes</SelectItem>
                  <SelectItem value="private">Private Classes</SelectItem>
                </SelectContent>
              </Select>

              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month (4 classes)</SelectItem>
                  <SelectItem value="3">3 Months (12 classes)</SelectItem>
                  <SelectItem value="6">6 Months (24 classes)</SelectItem>
                </SelectContent>
              </Select>

              {price !== null && (
                <div className="bg-muted rounded-lg p-4 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-foreground text-lg">${price}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{classesIncluded} classes included</span>
                    <span>${unitPrice}/class</span>
                  </div>
                </div>
              )}

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vodafone_cash">Vodafone Cash</SelectItem>
                  <SelectItem value="instapay">InstaPay</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Transaction reference"
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
                required
              />

              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Payment receipt *</label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !planType || !duration || !paymentMethod || price === null}>
                {loading ? "Submitting..." : "Submit Enrollment"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default EnrollPage;
