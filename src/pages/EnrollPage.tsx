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
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { type ClassType, type Duration, getTierForCountry, normalizeCountry, getPriceFor, formatMoney, DURATION_CLASSES } from "@/lib/stripePrices";
import { track } from "@/lib/tracking";
import { useLanguage } from "@/contexts/LanguageContext";
import { trustCopy } from "@/lib/trustFigures";
import KloverIcon from "@/components/KloverIcon";
import rehamPhoto from "@/assets/reham-teacher.jpg";

const EnrollPage = () => {
  const { t, language } = useLanguage();
  // Page-language title and description; noindex because the page needs a
  // signed-in student (28 Sep 2026), like the other sign-in pages.
  useSEO({
    title: language === "ar" ? "التسجيل في دورة" : "Enroll Now",
    description: language === "ar"
      ? "التسجيل في دورة كورية من كلوفرز: اختيار الخطة والمدة وطريقة الدفع."
      : "Enroll in a Klovers Korean course: choose a plan, a duration and a payment method.",
    canonical: "https://kloversegy.com/enroll",
    noindex: true,
  });
  const [planType, setPlanType] = useState<ClassType | "">("");
  const [duration, setDuration] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("");
  const [txRef, setTxRef] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userCountry, setUserCountry] = useState<string>("");
  const [timezone, setTimezone] = useState<string>(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch { return ""; }
  });
  const navigate = useNavigate();

  useEffect(() => { track.pageView(); }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate(`/login?redirect=${encodeURIComponent("/enroll")}`);
        return;
      }
      setUserId(session.user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("country, timezone")
        .eq("user_id", session.user.id)
        .single();
      if (profile?.country) setUserCountry(profile.country);
      // The profile's timezone wins over the browser's when we have one.
      if ((profile as any)?.timezone) setTimezone((profile as any).timezone);
    };
    load();
  }, [navigate]);

  // Country first, timezone second. profiles.country is blank for most students --
  // the signup form never asked -- so a rule that reads it alone prices a student
  // in Cairo in dollars, or refuses to price her at all.
  const resolvedCountry = useMemo(() => normalizeCountry(userCountry, timezone), [userCountry, timezone]);
  const tier = useMemo(() => getTierForCountry(resolvedCountry), [resolvedCountry]);

  const priced = useMemo(() => {
    if (!planType || !duration) return null;
    return getPriceFor(userCountry, timezone, planType as ClassType, Number(duration) as Duration);
  }, [userCountry, timezone, planType, duration]);

  const price = priced?.amount ?? null;
  const currency = priced?.currency ?? "USD";

  const classesIncluded = duration ? DURATION_CLASSES[Number(duration) as Duration] : 0;
  const unitPrice = price && classesIncluded ? formatMoney(price / classesIncluded, currency) : formatMoney(0, currency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !userId || !planType || !duration || !paymentMethod || price === null) return;

    // Client-side file validation
    if (receiptFile.size > 5 * 1024 * 1024) {
      toast({ title: t("enrollForm.fileTooLarge"), description: t("enrollForm.fileTooLargeDesc"), variant: "destructive" });
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(receiptFile.type)) {
      toast({ title: t("enrollForm.invalidType"), description: t("enrollForm.invalidTypeDesc"), variant: "destructive" });
      return;
    }

    setLoading(true);
    track.initiateCheckout({ value: price, currency });

    try {
      // 1. Create enrollment FIRST (so we have an ID before uploading)
      const { data: enrollmentId, error: insertError } = await supabase.rpc("submit_manual_enrollment", {
        _plan_type: planType,
        _duration: Number(duration),
        _amount: price,
        _tx_ref: txRef,
        _receipt_url: "",
        _payment_method: paymentMethod,
        _currency: currency,
      } as any);

      if (insertError || !enrollmentId) {
        throw new Error(insertError?.message || t("enrollForm.submitFailed"));
      }

      // 2. Upload receipt using enrollment ID in path
      const ext = receiptFile.name.split(".").pop();
      const filePath = `${userId}/${enrollmentId}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);

      if (uploadError) {
        throw new Error(t("enrollForm.uploadFailed"));
      }

      // 3. Update enrollment with receipt path
      await supabase.from("enrollments").update({ receipt_url: filePath } as any).eq("id", enrollmentId);

      toast({ title: t("enrollForm.submitted"), description: t("enrollForm.submittedDesc") });
      navigate("/dashboard");
    } catch {
      // Never show the raw Supabase/network error text — it's untranslated
      // and technical. A page-language message covers every failure case.
      toast({ title: t("enrollForm.error"), description: t("enrollForm.submitFailed"), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-lg space-y-4">

          {/* Header. The rating and student count come from @/lib/trustFigures
              (they were "5.0 rated" with no source and a bare "200+ students"). */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">{t("enrollForm.completeEnrollment")}</h1>
            <p className="text-muted-foreground text-sm">{t("enrollForm.chooseSubmit")}</p>
            <div className="flex items-center justify-center gap-3 flex-wrap pt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><KloverIcon name="badge-blossom" className="h-3.5 w-3.5" /> {trustCopy(language).ratingShort}</span>
              <span className="text-border">·</span>
              <span className="inline-flex items-center gap-1"><KloverIcon name="student-girl-heart" className="h-3.5 w-3.5" /> {trustCopy(language).studentsShort}</span>
              <span className="text-border">·</span>
              <span>{t("enrollForm.levels")}</span>
            </div>
          </div>

          {/* Teacher card */}
          <div className="flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 shadow-sm">
            <img
              src={rehamPhoto}
              alt={language === "ar" ? "المعلّمة ريهام" : "Teacher Reham"}
              className="w-14 h-14 rounded-full object-cover object-top flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-foreground">
                  {language === "ar" ? "المعلّمة ريهام" : "Teacher Reham"} <span lang="ko">선생님</span>
                </p>
                <span className="text-xs bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full">{t("enrollForm.certifiedTeacher")}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{t("enrollForm.teacherExp")}</p>
              <p className="text-xs text-muted-foreground/80 italic mt-1 leading-relaxed">
                {t("enrollForm.teacherQuote")}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("enrollForm.orderDetails")}</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Not gated on the country being set: a blank one is the common
                  case, and gating it there left those students a disabled
                  button and no explanation. */}
              {!tier && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 text-sm text-destructive">
                  {t("enrollForm.countryUnknown").replace("{country}", resolvedCountry || "—")} <a href="/profile" className="underline font-medium">{t("enrollForm.updateProfile")}</a>.
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <Select value={planType} onValueChange={(v) => setPlanType(v as ClassType)} required>
                  <SelectTrigger aria-label={t("enrollForm.planType")}><SelectValue placeholder={t("enrollForm.planType")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">{t("enrollForm.groupClasses")}</SelectItem>
                    <SelectItem value="private">{t("enrollForm.privateClasses")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={duration} onValueChange={setDuration} required>
                  <SelectTrigger aria-label={t("enrollForm.duration")}><SelectValue placeholder={t("enrollForm.duration")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("enrollForm.month1")}</SelectItem>
                    <SelectItem value="3">{t("enrollForm.months3")}</SelectItem>
                    <SelectItem value="6">{t("enrollForm.months6")}</SelectItem>
                  </SelectContent>
                </Select>

                {price !== null && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t("enrollForm.classesIncluded").replace("{count}", String(classesIncluded))}</span>
                      {/* The English string is "${price}/class" — its dollar sign
                          is part of the placeholder, not of the sentence. */}
                      <span className="text-xs text-muted-foreground">{t("enrollForm.perClass").replace("${price}", unitPrice).replace("{price}", unitPrice)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">{t("enrollForm.total")}</span>
                      <span className="font-bold text-2xl text-foreground">{formatMoney(price, currency)}</span>
                    </div>
                  </div>
                )}

                <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                  <SelectTrigger aria-label={t("enrollForm.paymentMethod")}><SelectValue placeholder={t("enrollForm.paymentMethod")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vodafone_cash">{t("enrollForm.vodafoneCash")}</SelectItem>
                    <SelectItem value="instapay">{t("enrollForm.instapay")}</SelectItem>
                    <SelectItem value="bank_transfer">{t("enrollForm.bankTransfer")}</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder={t("enrollForm.txRefPlaceholder")}
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  required
                />

                <div>
                  <label htmlFor="enroll-receipt" className="text-sm font-medium text-foreground block mb-1">{t("enrollForm.paymentReceipt")}</label>
                  <Input
                    id="enroll-receipt"
                    aria-describedby="enroll-receipt-hint"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    required
                  />
                  <p id="enroll-receipt-hint" className="text-xs text-muted-foreground mt-1">{t("enrollForm.receiptHint")}</p>
                </div>

                <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading || !planType || !duration || !paymentMethod || price === null}>
                  {loading ? t("enrollForm.submitting") : t("enrollForm.submitEnrollment")}
                </Button>

                {/* Trust badges — text only, no time promise (review is
                    manual, not on a fixed clock) and nothing unverifiable. */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    t("enrollForm.secure"),
                    t("enrollForm.manualReview"),
                    t("enrollForm.whatsappSupport"),
                  ].map((label) => (
                    <div key={label} className="flex flex-col items-center gap-1 bg-muted/50 rounded-lg p-2">
                      <span className="text-[10px] text-muted-foreground font-medium text-center">{label}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-center text-muted-foreground">
                  {t("enrollForm.needHelp")}{" "}
                  <a
                    href={WHATSAPP_BASE}
                    onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WHATSAPP_BASE, { cta_label: "enroll_form_help" }); }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-foreground font-semibold underline underline-offset-2 hover:no-underline"
                  >
                    {t("enrollForm.whatsappUs")}
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
