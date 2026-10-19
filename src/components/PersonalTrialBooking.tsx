import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

/**
 * Trial-booking widget for Reham's own personal 1:1 lessons (Hungarian,
 * Arabic-for-foreigners, English). Deliberately generic across all three —
 * `language` is the only thing that varies per landing page — because it's
 * the same teacher and one shared slot calendar (book-personal-trial /
 * personal_trial_slots), not three separate systems.
 *
 * Distinct from the Korean /free-trial flow (book-trial, trial_slots), which
 * is built for weekly group cohorts across multiple teachers. This is
 * intentionally lighter: a short list of open slots, a short form, and a
 * WhatsApp fallback that's always visible — not just shown when slots run
 * out — since "neither time works" is a real, expected outcome for a solo
 * teacher's calendar, not an edge case.
 */

type Slot = {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  start_time_12h: string;
  duration_min: number;
  timezone: string;
};

export type PersonalTrialLanguage = "hungarian" | "arabic" | "english";

interface PersonalTrialBookingProps {
  language: PersonalTrialLanguage;
  /** Hex color for the primary accent (selected slot, submit button). */
  accentColor?: string;
  accentHoverColor?: string;
  whatsappMessage?: { en: string; ar: string };
}

function formatSlotDate(dateStr: string, isAr: boolean): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

const PersonalTrialBooking = ({
  language,
  accentColor = "#a9502f",
  accentHoverColor = "#8f4227",
  whatsappMessage,
}: PersonalTrialBookingProps) => {
  const { language: siteLanguage } = useLanguage();
  const isAr = siteLanguage === "ar";
  const tr = (en: string, ar: string) => (isAr ? ar : en);
  const { toast } = useToast();

  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [booked, setBooked] = useState<Slot | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSlots(true);
      const { data, error } = await supabase.functions.invoke("book-personal-trial", {
        body: { action: "list" },
      });
      if (cancelled) return;
      if (error || !data?.slots) {
        setSlots([]);
      } else {
        setSlots(data.slots as Slot[]);
      }
      setLoadingSlots(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const defaultWaText = tr(
    "Hi! I'd like to book a trial lesson but none of the available times work for me — can we find another time?",
    "مرحبًا، أرغب في حجز حصة تجريبية لكن المواعيد المتاحة لا تناسبني — هل يمكننا الاتفاق على موعد آخر؟",
  );
  const waText = whatsappMessage ? tr(whatsappMessage.en, whatsappMessage.ar) : defaultWaText;
  const waHref = `${WHATSAPP_BASE}?text=${encodeURIComponent(waText)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlotId) return;
    if (!name.trim()) {
      toast({ title: tr("Please enter your name", "من فضلك أدخل اسمك"), variant: "destructive" });
      return;
    }
    if (!email.trim() && !whatsapp.trim()) {
      toast({
        title: tr("Please add an email or WhatsApp number", "من فضلك أضف بريدًا إلكترونيًا أو رقم واتساب"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("book-personal-trial", {
      body: {
        action: "book",
        slot_id: selectedSlotId,
        language,
        name: name.trim(),
        email: email.trim() || undefined,
        whatsapp: whatsapp.trim() || undefined,
      },
    });
    setSubmitting(false);

    if (error || !data?.success) {
      const message =
        (error as { context?: { body?: { error?: string } } } | undefined)?.context?.body?.error ||
        (data as { error?: string } | undefined)?.error ||
        tr("Something went wrong. Please try again or message us on WhatsApp.", "حدث خطأ ما. من فضلك حاول مرة أخرى أو راسلنا على واتساب.");
      toast({ title: message, variant: "destructive" });
      // The slot may have just been taken — drop it from the list so the
      // student isn't stuck looking at an option that no longer exists.
      setSlots((prev) => (prev ? prev.filter((s) => s.id !== selectedSlotId) : prev));
      setSelectedSlotId(null);
      return;
    }

    setBooked(slots?.find((s) => s.id === selectedSlotId) ?? null);
  };

  if (booked) {
    return (
      <Card className="border-2" style={{ borderColor: accentColor }}>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 mb-4" style={{ color: accentColor }} aria-hidden="true" />
          <h3 className="text-xl font-bold text-foreground mb-2">
            {tr("Your trial lesson is booked!", "تم حجز حصتك التجريبية!")}
          </h3>
          <p className="text-foreground/70">
            {tr(
              `${formatSlotDate(booked.date, false)} at ${booked.start_time_12h} (${booked.timezone})`,
              `${formatSlotDate(booked.date, true)} الساعة ${booked.start_time_12h} (${booked.timezone})`,
            )}
          </p>
          <p className="mt-3 text-sm text-foreground/60">
            {tr(
              "We'll reach out by email or WhatsApp to confirm and send the class link.",
              "سنتواصل معك عبر البريد الإلكتروني أو واتساب للتأكيد وإرسال رابط الحصة.",
            )}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 md:p-8">
        <h3 className="flex items-center gap-2 text-xl font-bold text-foreground mb-5">
          <CalendarDays className="h-5 w-5" style={{ color: accentColor }} aria-hidden="true" />
          {tr("Book a free trial lesson", "احجز حصة تجريبية مجانية")}
        </h3>

        {loadingSlots ? (
          <div className="flex items-center gap-2 text-foreground/60 py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            {tr("Loading available times…", "جارٍ تحميل المواعيد المتاحة…")}
          </div>
        ) : slots && slots.length > 0 ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="mb-2 block">{tr("Pick a time", "اختر موعدًا")}</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setSelectedSlotId(slot.id)}
                      className="rounded-xl border px-4 py-3 text-start transition-colors"
                      style={
                        isSelected
                          ? { borderColor: accentColor, backgroundColor: `${accentColor}1a` }
                          : undefined
                      }
                    >
                      <div className="font-semibold text-foreground">{formatSlotDate(slot.date, isAr)}</div>
                      <div className="text-sm text-foreground/70">{slot.start_time_12h}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedSlotId && (
              <div className="space-y-4 pt-1">
                <div>
                  <Label htmlFor="pt-name">{tr("Your name", "اسمك")}</Label>
                  <Input id="pt-name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pt-email">{tr("Email", "البريد الإلكتروني")}</Label>
                    <Input id="pt-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="pt-whatsapp">{tr("WhatsApp number", "رقم واتساب")}</Label>
                    <Input id="pt-whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-foreground/60">
                  {tr("Email or WhatsApp — just one is enough.", "البريد الإلكتروني أو واتساب — يكفي أحدهما.")}
                </p>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submitting}
                  className="w-full rounded-full font-bold text-white"
                  style={{ backgroundColor: accentColor }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentHoverColor)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    tr("Confirm trial lesson", "تأكيد الحصة التجريبية")
                  )}
                </Button>
              </div>
            )}
          </form>
        ) : (
          <p className="text-foreground/70">
            {tr(
              "No open times right now — message us on WhatsApp and we'll find one together.",
              "لا توجد مواعيد متاحة حاليًا — راسلنا على واتساب ولنتفق على موعد معًا.",
            )}
          </p>
        )}

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-foreground/60 mb-3">
            {tr("None of these times work for you?", "لا يناسبك أي من هذه المواعيد؟")}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-full gap-2"
            onClick={(e) => {
              e.preventDefault();
              void trackAndOpenWhatsApp(waHref, { cta_label: `personal_trial_${language}` });
            }}
          >
            <MessageCircle className="h-4 w-4" />
            {tr("Message us on WhatsApp instead", "راسلنا على واتساب بدلًا من ذلك")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalTrialBooking;
