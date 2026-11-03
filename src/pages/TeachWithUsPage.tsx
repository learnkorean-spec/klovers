import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Send, MessageCircle, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LEVELS } from "@/constants/levels";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

/**
 * Public "Teach with Klovers" application page — linked from the homepage's
 * JoinOurTeam section. Writes to `teacher_applications`
 * (supabase/migrations/20261021113000_teacher_applications.sql), a public
 * anon-insertable intake table, separate from the admin-only `teachers`
 * roster. An admin reviews submissions and creates a `teachers` row from
 * TeacherOnboardingManager.tsx on acceptance — nothing here touches that
 * table directly.
 *
 * Follows ContactPage.tsx's established failure discipline: a failed submit
 * never clears the form or claims success, and always leaves a WhatsApp
 * fallback with everything the applicant already typed, so nothing is lost
 * if the database write fails.
 */
const MESSAGE_MAX = 500;

const TeachWithUsPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  useSEO({
    title: isAr ? "التدريس مع كلوفرز" : "Teach With Klovers",
    description: isAr
      ? "انضم أو انضمي لفريق تدريس اللغة الكورية في كلوفرز. قدّم طلبك الآن عبر كل المستويات من الهانغول حتى المستوى السادس."
      : "Join the Korean teaching team at Klovers. Apply to teach any level, from Hangul through Level 6.",
    canonical: "https://kloversegy.com/teach-with-us",
  });

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    years_experience: "",
    message: "",
  });
  const [levels, setLevels] = useState<string[]>([]);
  // Honeypot — real visitors never see or fill this field; a bot filling
  // every input on the page will. Caught silently: we just skip the insert
  // and show the same success state, so a bot learns nothing.
  const [website, setWebsite] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggleLevel = (key: string) => {
    setLevels((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const buildFallbackMessage = () => {
    const lines = [
      `${isAr ? "طلب تدريس" : "Teaching application"}`,
      `${isAr ? "الاسم" : "Name"}: ${form.full_name}`,
      `${isAr ? "البريد الإلكتروني" : "Email"}: ${form.email}`,
    ];
    if (form.phone) lines.push(`${isAr ? "الهاتف" : "Phone"}: ${form.phone}`);
    if (levels.length) lines.push(`${isAr ? "المستويات" : "Levels"}: ${levels.join(", ")}`);
    if (form.years_experience) lines.push(`${isAr ? "سنوات الخبرة" : "Experience"}: ${form.years_experience}`);
    if (form.message) lines.push("", form.message);
    return lines.join("\n");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setFailed(false);

    // Honeypot tripped — pretend success, insert nothing.
    if (website.trim().length > 0) {
      setSent(true);
      setSending(false);
      return;
    }

    try {
      const { error } = await supabase.from("teacher_applications").insert({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        course_levels: levels,
        years_experience: form.years_experience.trim() || null,
        message: form.message.trim() || null,
      });
      if (error) throw error;

      setSent(true);
      toast({
        title: isAr ? "تم استلام طلبك" : "Application received",
        description: isAr ? "سنراجع طلبك ونتواصل معك قريبًا." : "We'll review it and get back to you soon.",
      });
    } catch (err) {
      setFailed(true);
      console.error("[teach-with-us] insert failed:", err);
      toast({
        title: isAr ? "تعذّر إرسال الطلب" : "Could not send your application",
        description: isAr
          ? "طلبك محفوظ ولم يُفقد. يمكنك إرساله عبر واتساب من الزر بالأسفل."
          : "Nothing was lost — send it on WhatsApp using the button below.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-16">
          <section className="py-24 bg-background">
            <div className="container mx-auto px-4 max-w-lg text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3">
                {isAr ? "تم استلام طلبك" : "Application received"}
              </h1>
              <p className="text-muted-foreground">
                {isAr
                  ? "شكرًا لاهتمامك بالتدريس مع كلوفرز. سنراجع طلبك ونتواصل معك قريبًا."
                  : "Thanks for your interest in teaching with Klovers. We'll review your application and reach out soon."}
              </p>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10 max-w-2xl mx-auto">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                {isAr ? "التدريس مع كلوفرز" : "Teach With Klovers"}
              </h1>
              <p className="text-muted-foreground">
                {isAr
                  ? "نتوسّع عبر كل المستويات من الهانغول حتى المستوى السادس، ونرحّب بمعلمين ومعلمات جدد. أخبرنا عن نفسك أدناه."
                  : "We're expanding across every level, from Hangul through Level 6, and welcome new teachers. Tell us about yourself below."}
              </p>
            </div>

            <div className="max-w-lg mx-auto">
              <Card className="border-border">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Honeypot field — visually hidden, never tabbable. */}
                    <div className="absolute w-px h-px overflow-hidden" aria-hidden="true" style={{ clip: "rect(0,0,0,0)" }}>
                      <label htmlFor="teach-website">Website</label>
                      <input
                        id="teach-website"
                        name="website"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="teach-name" className="text-sm font-medium text-foreground mb-1 block">
                        {isAr ? "الاسم الكامل" : "Full name"}
                      </label>
                      <Input
                        id="teach-name"
                        autoComplete="name"
                        value={form.full_name}
                        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="teach-email" className="text-sm font-medium text-foreground mb-1 block">
                        {isAr ? "البريد الإلكتروني" : "Email"}
                      </label>
                      <Input
                        id="teach-email"
                        type="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="teach-phone" className="text-sm font-medium text-foreground mb-1 block">
                        {isAr ? "رقم الهاتف (اختياري)" : "Phone (optional)"}
                      </label>
                      <Input
                        id="teach-phone"
                        type="tel"
                        autoComplete="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <span className="text-sm font-medium text-foreground mb-2 block">
                        {isAr ? "أي المستويات يمكنك تدريسها؟" : "Which levels can you teach?"}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {LEVELS.map((l) => (
                          <label
                            key={l.key}
                            className="flex items-center gap-2 text-sm text-foreground rounded-lg border border-border px-3 py-2 cursor-pointer hover:border-primary/50"
                          >
                            <Checkbox
                              checked={levels.includes(l.key)}
                              onCheckedChange={() => toggleLevel(l.key)}
                            />
                            {isAr ? l.shortLabel_ar : l.shortLabel}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="teach-experience" className="text-sm font-medium text-foreground mb-1 block">
                        {isAr ? "سنوات الخبرة في التدريس" : "Years of teaching experience"}
                      </label>
                      <Input
                        id="teach-experience"
                        autoComplete="off"
                        placeholder={isAr ? "مثال: ٣ سنوات" : "e.g. 3 years"}
                        value={form.years_experience}
                        onChange={(e) => setForm({ ...form, years_experience: e.target.value })}
                      />
                    </div>

                    <div>
                      <label htmlFor="teach-message" className="text-sm font-medium text-foreground mb-1 block">
                        {isAr ? "نبذة عنك (اختياري)" : "Tell us about yourself (optional)"}
                      </label>
                      <Textarea
                        id="teach-message"
                        rows={5}
                        maxLength={MESSAGE_MAX}
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                      />
                    </div>

                    <Button type="submit" className="w-full gap-2" disabled={sending}>
                      <Send className="h-4 w-4" />
                      {sending ? (isAr ? "جارٍ الإرسال…" : "Sending…") : isAr ? "إرسال الطلب" : "Submit Application"}
                    </Button>

                    {failed && (
                      <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 space-y-3">
                        <p className="text-sm text-foreground">
                          {isAr
                            ? "تعذّر الإرسال عبر الموقع، وطلبك لم يُفقد. يمكنك إرساله الآن عبر واتساب."
                            : "Sending through the site didn't work. Nothing was lost — send it on WhatsApp now."}
                        </p>
                        <button
                          type="button"
                          onClick={() => trackAndOpenWhatsApp(`${WHATSAPP_BASE}?text=${encodeURIComponent(buildFallbackMessage())}`, { cta_label: "teach_with_us_fallback" })}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {isAr ? "إرسال عبر واتساب" : "Send on WhatsApp"}
                        </button>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default TeachWithUsPage;
