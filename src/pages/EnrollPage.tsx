import { useState, useEffect, useMemo } from "react";
import { useSEO } from "@/hooks/useSEO";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { type TierKey, type ClassType, type Duration, tierPrices, getTierForCountry, DURATION_CLASSES } from "@/lib/stripePrices";

const EnrollPage = () => {
  useSEO({ title: "Enroll Now", description: "Start learning Korean today. Enroll in a Klovers course — choose your level, schedule, and teacher.", canonical: "https://kloversegy.com/enroll" });
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

  const classesIncluded = duration ? DURATION_CLASSES[Number(duration) as Duration] : 0;
  const unitPrice = price && classesIncluded ? (price / classesIncluded).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !userId || !planType || !duration || !paymentMethod || price === null) return;
    setLoading(true);

    try {
      // 1. Create enrollment FIRST (so we have an ID before uploading)
      const { data: enrollmentId, error: insertError } = await supabase.rpc("submit_manual_enrollment", {
        _plan_type: planType,
        _duration: Number(duration),
        _amount: price,
        _tx_ref: txRef,
        _receipt_url: "",
        _payment_method: paymentMethod,
      } as any);

      if (insertError || !enrollmentId) {
        throw new Error(insertError?.message || "Failed to submit enrollment.");
      }

      // 2. Upload receipt using enrollment ID in path
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${userId}/${enrollmentId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error("Could not upload receipt. Your enrollment was created — please contact support.");
      }

      // 3. Update enrollment with receipt path
      await supabase.from("enrollments").update({ receipt_url: filePath } as any).eq("id", enrollmentId);

      toast({ title: "Enrollment submitted!", description: "We'll review your payment shortly." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-4">

          {/* Header */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">Complete Your Enrollment</h1>
            <p className="text-muted-foreground text-sm">Choose your plan and submit your payment to get started</p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-1 text-xs text-muted-foreground">
              <span>⭐ 4.9 rated</span>
              <span className="text-border">·</span>
              <span>👥 1,000+ students</span>
              <span className="text-border">·</span>
              <span>🇰🇷 A1–C2 levels</span>
            </div>
          </div>

          {/* Teacher card */}
          <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
            <div className="relative flex-shrink-0">
              <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-xl font-bold text-primary select-none">
                ريم
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 text-base leading-none">🇰🇷</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-foreground">Reham — 선생님</p>
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">Certified Teacher</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">5+ years · 300+ students · A1–C2 all levels</p>
              <p className="text-xs text-muted-foreground/80 italic mt-1 leading-relaxed">
                "She simplifies everything — you'll notice the difference from day one."
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent>
              {!tier && userCountry && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 text-sm text-destructive">
                  ⚠️ Your country "{userCountry}" is not recognized. Please <a href="/profile" className="underline font-medium">update your profile</a>.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={planType} onValueChange={(v) => setPlanType(v as ClassType)}>
                  <SelectTrigger><SelectValue placeholder="Plan type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">👥 Group Classes</SelectItem>
                    <SelectItem value="private">👤 Private Classes</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue placeholder="Duration" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month — 4 classes</SelectItem>
                    <SelectItem value="3">3 Months — 12 classes</SelectItem>
                    <SelectItem value="6">6 Months — 24 classes 🔥 Best Value</SelectItem>
                  </SelectContent>
                </Select>

                {price !== null && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{classesIncluded} classes included</span>
                      <span className="text-xs text-muted-foreground">${unitPrice}/class</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-2xl text-foreground">${price}</span>
                    </div>
                  </div>
                )}

                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger><SelectValue placeholder="Payment method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vodafone_cash">📱 Vodafone Cash</SelectItem>
                    <SelectItem value="instapay">💳 InstaPay</SelectItem>
                    <SelectItem value="bank_transfer">🏦 Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Transaction reference (from your payment)"
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
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or PDF · max 5MB</p>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !planType || !duration || !paymentMethod || price === null}>
                  {loading ? "Submitting..." : "🔒 Submit Enrollment"}
                </Button>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: "🔒", label: "Secure" },
                    { icon: "⚡", label: "24h Review" },
                    { icon: "✅", label: "Verified" },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2">
                      <span className="text-base">{icon}</span>
                      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  Need help?{" "}
                  <a href={WHATSAPP_BASE} target="_blank" rel="noopener noreferrer" className="text-green-600 font-semibold hover:underline">
                    💬 WhatsApp us
                  </a>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EnrollPage;
