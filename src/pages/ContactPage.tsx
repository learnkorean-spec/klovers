import { useState } from "react";
import { useSEO } from "@/hooks/useSEO";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FinalCTA from "@/components/FinalCTA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Send, } from "lucide-react";
import KloverIcon from "@/components/KloverIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { WHATSAPP_BASE } from "@/lib/siteConfig";
import { toArabicDigits } from "@/lib/trustFigures";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { supabase } from "@/integrations/supabase/client";
import { getAttribution } from "@/lib/leadSession";

const WA_DIRECT = `${WHATSAPP_BASE}?text=${encodeURIComponent("Hi! I'm interested in learning Korean with Klovers. Can you tell me more?")}`;
const WA_DIRECT_AR = `${WHATSAPP_BASE}?text=${encodeURIComponent("مرحبًا، أرغب في تعلّم الكورية مع كلوفرز. ما التفاصيل؟")}`;
const WA_GROUP = "https://chat.whatsapp.com/BOg8xaXYnl00gjj6gnB9dq";

/**
 * How the message is actually delivered.
 *
 * This form used to fake it: on submit it showed a "Thank you!" toast, cleared
 * every field, and opened a Telegram link 1.5s later. Nothing was ever sent
 * anywhere. A visitor who wrote a real question - the one thing this page
 * exists for - was told it had been received when it had not, and the text was
 * destroyed before they could copy it. Silent data loss presented as success.
 *
 * Two channels, so one failing does not lose the message:
 *
 *  1. `submit-lead`, the same edge function every other lead form on the site
 *     uses. It runs with the service role, so it is not subject to the anon
 *     INSERT policy on public.leads (which only admits source =
 *     'placement_test'), and it rate-limits per IP. The message travels in
 *     `goal`, the field the sales team already reads.
 *
 *  2. WhatsApp, pre-filled with the whole message. The text is IN the link, so
 *     if WhatsApp does not open they can still copy it from the fallback.
 *
 * If both fail, every field is kept and the page says so in its own language.
 * Losing the visitor's message is never the failure mode.
 */
const buildMessage = (
  f: { name: string; email: string; subject: string; message: string },
  isAr: boolean,
) => {
  const from = isAr ? "الاسم" : "Name";
  const email = isAr ? "البريد الإلكتروني" : "Email";
  const subject = isAr ? "الموضوع" : "Subject";
  return [`${from}: ${f.name}`, `${email}: ${f.email}`, `${subject}: ${f.subject}`, "", f.message].join("\n");
};

/** submit-lead caps `goal` at 500 characters. Name and email travel in their
 *  own fields, so `goal` carries only the subject and the message; these two
 *  visible limits keep it inside 500, so nothing is cut without the visitor
 *  seeing it (scan 27 Sep 2026). */
const SUBJECT_MAX = 80;
const MESSAGE_MAX = 400;

const ContactPage = () => {
  // 27 Sep 2026: restored - be8bc67 dropped these two lines, so the page threw
  // "isAr is not defined" on load.
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "التواصل" : "Contact Us",
    description: isAr
      ? "التواصل مع كلوفرز للاستفسار عن الدورات والتسجيل وأي سؤال آخر."
      : "Get in touch with Klovers. We would love to hear from you about courses, enrollment, or any questions.",
    canonical: "https://kloversegy.com/contact",
  });
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  /** Set only when delivery failed, so the form is never a dead end. */
  const [failed, setFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;

    setSending(true);
    setFailed(false);

    const text = buildMessage(form, isAr);
    // Computed up front and kept regardless of outcome, so the fallback always
    // carries exactly what the visitor typed.
    const waLink = `${WHATSAPP_BASE}?text=${encodeURIComponent(text)}`;

    try {
      const attribution = getAttribution();
      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          // `goal` is capped at 500 chars server-side. Trimmed to fit rather
          // than rejected: a 400 would fall through to WhatsApp with nothing
          // lost, but a silent reject would not.
          goal: [`${isAr ? "الموضوع" : "Subject"}: ${form.subject.trim()}`, "", form.message.trim()].join("\n").slice(0, 500),
          // `source` is named explicitly and the attribution fields are mapped
          // one by one, following EnrollNowPage. A `...attribution` spread here
          // would clobber `source` with whatever the stored attribution held,
          // and the lead would be filed as the wrong kind of enquiry.
          source: "contact",
          utm_source: attribution.utm_source,
          utm_medium: attribution.utm_medium,
          utm_campaign: attribution.campaign,
          utm_content: attribution.utm_content,
          gclid: attribution.gclid,
        },
      });
      if (error) throw error;

      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
      toast({
        title: isAr ? "تم استلام الرسالة" : "Message received",
        description: isAr ? "سيصل الرد في أقرب وقت." : "We'll get back to you shortly.",
      });
    } catch (err) {
      // Nothing cleared, no success claimed. The visitor keeps their text and
      // gets a one-click way to send it themselves.
      setFailed(true);
      console.error("[contact] submit-lead failed:", err);
      toast({
        title: isAr ? "تعذّر الإرسال" : "Could not send",
        description: isAr
          ? "تعذّر الإرسال، والرسالة محفوظة. الإرسال متاح عبر واتساب من الزر بالأسفل."
          : "Your message was not sent, and has not been lost. Send it on WhatsApp using the button below.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-16">
        <section className="py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
                {t("contactPage", "title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("contactPage", "subtitle")}
              </p>
            </div>

            <div className="max-w-lg mx-auto space-y-6">

              {/* ── Primary: Direct WhatsApp DM ── */}
              <a
                href={isAr ? WA_DIRECT_AR : WA_DIRECT}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(isAr ? WA_DIRECT_AR : WA_DIRECT, { cta_label: "contact_direct" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl px-6 py-5 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-background/20 flex items-center justify-center">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg leading-tight">{isAr ? "التواصل عبر واتساب" : "Contact on WhatsApp"}</p>
                  <p className="text-primary-foreground/80 text-sm">{isAr ? "أسرع طريقة للتواصل" : "The fastest way to reach us"}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-5 w-5 opacity-70 rtl:rotate-180" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </a>

              {/* ── Secondary: Join WhatsApp group ── */}
              <a
                href={WA_GROUP}
                onClick={(e) => { e.preventDefault(); trackAndOpenWhatsApp(WA_GROUP, { cta_label: "contact_group" }); }}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 bg-card border border-border hover:border-primary/50 rounded-2xl px-6 py-4 transition-all hover:shadow-md"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <KloverIcon name="student-girl-heart" className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground text-sm">{isAr ? "مجتمع واتساب" : "WhatsApp Community"}</p>
                  <p className="text-muted-foreground text-xs">{isAr ? "التواصل عبر المجموعة والحصول على التحديثات" : "Community chat and updates"}</p>
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
              </a>

              {/* ── Tertiary: Contact form ── */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground text-center mb-4">{isAr ? "أو كتابة رسالة" : "Or send us a message"}</p>
                <Card className="border-border">
                  <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="contact-name" className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.name")}
                        </label>
                        <Input
                          id="contact-name"
                          name="name"
                          autoComplete="name"
                          placeholder={t("contactPage", "form.namePlaceholder")}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.email")}
                        </label>
                        <Input
                          id="contact-email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          placeholder={t("contactPage", "form.emailPlaceholder")}
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-subject" className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.subject")}
                        </label>
                        <Input
                          id="contact-subject"
                          name="subject"
                          autoComplete="off"
                          placeholder={t("contactPage", "form.subjectPlaceholder")}
                          value={form.subject}
                          onChange={(e) => setForm({ ...form, subject: e.target.value })}
                          maxLength={SUBJECT_MAX}
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="contact-message" className="text-sm font-medium text-foreground mb-1 block">
                          {t("contactPage", "form.message")}
                        </label>
                        <Textarea
                          id="contact-message"
                          name="message"
                          placeholder={t("contactPage", "form.messagePlaceholder")}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          maxLength={MESSAGE_MAX}
                          aria-describedby="contact-message-count"
                          required
                          rows={5}
                        />
                        <p id="contact-message-count" className="mt-1 text-xs text-muted-foreground text-end">
                          {isAr
                            ? `${toArabicDigits(form.message.length)} / ${toArabicDigits(MESSAGE_MAX)} حرف`
                            : `${form.message.length} / ${MESSAGE_MAX} characters`}
                        </p>
                      </div>
                      <Button type="submit" className="w-full gap-2" disabled={sending}>
                        <Send className="h-4 w-4" />
                        {sending
                          ? isAr ? "جارٍ الإرسال…" : "Sending…"
                          : t("contactPage", "form.send")}
                      </Button>

                      {/*
                        Shown only when delivery failed. The message is still in
                        the form above - it is never cleared on failure - and this
                        carries the same text into WhatsApp, so the visitor always
                        has a way through that does not depend on our API being up.
                      */}
                      {failed && (
                        <div
                          role="alert"
                          className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 space-y-3"
                        >
                          <p className="text-sm text-foreground">
                            {isAr
                              ? "تعذّر الإرسال عبر الموقع، والرسالة محفوظة في النموذج. الإرسال متاح الآن عبر واتساب."
                              : "Sending through the site did not work. Nothing was lost — send it on WhatsApp now."}
                          </p>
                          <a
                            href={`${WHATSAPP_BASE}?text=${encodeURIComponent(buildMessage(form, isAr))}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {isAr ? "إرسال عبر واتساب" : "Send on WhatsApp"}
                          </a>
                        </div>
                      )}

                      {sent && !failed && (
                        <p className="text-sm text-muted-foreground text-center">
                          {isAr
                            ? "تم استلام الرسالة. سنرد قريبًا."
                            : "Message received. We'll reply soon."}
                        </p>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default ContactPage;
