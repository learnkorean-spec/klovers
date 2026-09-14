import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
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
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { tierCountries } from "@/lib/stripePrices";

/**
 * This page links from the "Complete your profile" reminder email, and it
 * did not complete a profile: it called submit-lead, which writes to `leads`
 * and never touches `profiles`. So the fields stayed missing, and the email
 * arrived again the next morning. Full write-up in PR.
 *
 * `phone` and `timezone` were never asked for here - NULL on 102 of 102
 * profiles on 2026-09-08.
 *
 * AUTHORISATION (Re's call, 2026-09-08): this route is deliberately
 * unguarded so the ?email= link works for someone who has never signed in,
 * which means the URL cannot be trusted to say who the visitor is. The
 * profile write is therefore keyed on the SESSION, never on ?email=. Signed
 * in -> own row only, enforced by RLS. Not signed in -> lead only, as
 * before, and the page says so instead of implying otherwise.
 *
 * Which makes the "Sign in first" link the actual flow for a signed-out
 * reader, not a footnote: it is the only path by which what they type
 * reaches their profile. It pointed at /auth, a route that does not exist
 * (App.tsx has /login and /signup), so it fell through to NotFound. It now
 * carries ?redirect=/complete-profile so they return to this form.
 */

/**
 * Taken from the pricing tiers rather than typed out here, so this page cannot
 * save a country the pricing code has no tier for. The hand-written list
 * offered Palestine and Other, both of which `getTierForCountry` returns null
 * for - the `Other` sitting in production profiles.country came from here.
 * "Other" stays on the end for anyone the list genuinely misses; it resolves
 * to no tier, which is the honest answer rather than a wrong one.
 */
const COUNTRIES = [
  ...Object.values(tierCountries).flat().sort((a, b) => a.localeCompare(b)),
  "Other",
];

/**
 * Local ON PURPOSE. These belong in src/i18n/translations.ts and should be
 * moved there by a pass with a real working copy. They are here because that
 * file can only be edited through this tooling by rewriting it whole, which
 * took three attempts on a smaller file in #300 - risking the whole site's
 * copy to add seven strings is the wrong trade. `t()` returns the key itself
 * when a key is missing, so the alternative is a form labelled
 * "completeProfile.phoneLabel" in production.
 */
const COPY = {
  en: {
    phoneLabel: "Phone number",
    phonePlaceholder: "+20 100 123 4567",
    timezoneLabel: "Your timezone",
    timezoneHint: "Detected from your device. Change it if it looks wrong - we use it to tell you the right class time.",
    signInPrompt: "You are not signed in, so this will be saved as an enquiry rather than to your account.",
    signInLink: "Sign in first",
    notSignedInNote: "Saved as an enquiry. Sign in and fill this in again to save it to your account.",
  },
  ar: {
    phoneLabel: "رقم الهاتف",
    phonePlaceholder: "+20 100 123 4567",
    timezoneLabel: "المنطقة الزمنية",
    timezoneHint: "تم تحديدها من جهازك. غيّرها إذا كانت غير صحيحة — نستخدمها لنخبرك بموعد الحصة بتوقيتك.",
    signInPrompt: "لم تسجّل دخولك، لذلك ستُحفظ بياناتك كطلب استفسار لا في حسابك.",
    signInLink: "سجّل دخولك أولاً",
    notSignedInNote: "حُفظت بياناتك كطلب استفسار. سجّل دخولك ثم أعد ملء النموذج لحفظها في حسابك.",
  },
} as const;

const CompleteProfilePage = () => {
  // Transactional page: real content for the signed-in user, nothing a
  // search result should land on. Mirrors the Disallow in robots.txt.
  useSEO({ title: "Complete Your Profile", description: "Finish setting up your Klovers account.", noindex: true });

  const { t, language } = useLanguage();
  const tx = (k: keyof typeof COPY["en"]) => COPY[language === "ar" ? "ar" : "en"][k];
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const LEVELS = [
    { value: "absolute_beginner", label: t("completeProfile.levelAbsoluteBeginner") },
    { value: "beginner", label: t("completeProfile.levelKnowsHangul") },
    ...LEVEL_SELECT_OPTIONS,
  ];

  const GOALS = [
    { value: "Travel to Korea", label: t("completeProfile.goal1") },
    { value: "Watch K-dramas / K-pop without subtitles", label: t("completeProfile.goal2") },
    { value: "Study or work in Korea", label: t("completeProfile.goal3") },
    { value: "Make Korean friends", label: t("completeProfile.goal4") },
    { value: "Pass TOPIK exam", label: t("completeProfile.goal5") },
    { value: "General interest", label: t("completeProfile.goal6") },
    { value: "Other", label: t("completeProfile.goal7") },
  ];

  // Read from the browser rather than asking. A visitor should not have to
  // find themselves in a list of 400 IANA zones, and a wrong zone here is
  // what puts a student in a class five hours after it ended.
  const detectedTimezone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  })();

  const [form, setForm] = useState({
    name: "",
    email: emailFromUrl,
    country: "",
    level: "",
    goal: "",
    phone: "",
    timezone: detectedTimezone,
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  // null while the session is still being read, so the page does not flash
  // the signed-out notice at someone who is in fact signed in.
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [savedToProfile, setSavedToProfile] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setSignedIn(!!session?.user);
      // The session is the identity, so prefill from it and let the address
      // in the URL lose the argument.
      if (session?.user?.email) {
        setForm((f) => ({ ...f, email: session.user!.email as string }));
      }
    });
    return () => { cancelled = true; };
  }, []);

  const set = (key: keyof typeof form) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.name.trim()) {
      toast({ title: t("completeProfile.fillNameEmail"), variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const { error } = await supabase.functions.invoke("submit-lead", {
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          country: form.country,
          level: form.level,
          goal: form.goal,
          timezone: form.timezone,
          source: "complete-profile",
          user_id: session?.user?.id,
        },
      });

      if (error) throw new Error(error.message || t("completeProfile.saveFailedGeneric"));

      // The part that was missing. Only for a signed-in user, and only ever
      // their own row - RLS enforces that regardless of what is in the URL.
      if (session?.user?.id) {
        const patch: Record<string, string> = { name: form.name.trim() };
        if (form.country) patch.country = form.country;
        if (form.level) patch.level = form.level;
        if (form.phone.trim()) patch.phone = form.phone.trim();
        if (form.timezone) patch.timezone = form.timezone;

        const { error: profileError } = await supabase
          .from("profiles")
          .update(patch)
          .eq("user_id", session.user.id);

        if (profileError) {
          // The lead was saved, so this is not a total failure - but the
          // reminder email keys off `profiles`, so staying quiet here would
          // send them round the same loop again. Say it.
          console.error("complete-profile: profile update failed:", profileError.message);
          toast({
            title: t("common.error"),
            description: profileError.message,
            variant: "destructive",
          });
        } else {
          setSavedToProfile(true);
        }
      }

      setDone(true);
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-28 pb-20 px-4 flex flex-col items-center text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">{t("completeProfile.doneTitle")}</h1>
            <p className="text-muted-foreground leading-relaxed">
              {t("completeProfile.doneDesc")}
            </p>
            {!savedToProfile && (
              // Do not let someone walk away believing their account is
              // updated when only a lead row was written.
              <p className="text-sm text-muted-foreground border border-border rounded-xl p-3">
                {tx("notSignedInNote")}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild>
                <Link to="/enroll">
                  {t("completeProfile.browseCourses")} <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">{t("completeProfile.goHome")}</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-full px-4 py-1.5 mb-4">
              <span className="text-primary text-outlined text-sm font-semibold">{t("completeProfile.badge")}</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{t("completeProfile.pageTitle")}</h1>
            <p className="text-muted-foreground">
              {t("completeProfile.pageSubtitle")}
            </p>
          </div>

          {signedIn === false && (
            <div className="mb-5 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              {tx("signInPrompt")}{" "}
              <Link to="/login?redirect=/complete-profile" className="underline font-medium text-foreground">
                {tx("signInLink")}
              </Link>
            </div>
          )}

          {/* Form card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">{t("completeProfile.nameLabel")}</Label>
                <Input
                  id="name"
                  placeholder={t("completeProfile.namePlaceholder")}
                  value={form.name}
                  onChange={(e) => set("name")(e.target.value)}
                  required
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email">{t("completeProfile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("completeProfile.emailPlaceholder")}
                  value={form.email}
                  onChange={(e) => set("email")(e.target.value)}
                  readOnly={!!emailFromUrl || signedIn === true}
                  className={emailFromUrl || signedIn ? "bg-muted text-muted-foreground" : ""}
                  required
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">{tx("phoneLabel")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={tx("phonePlaceholder")}
                  value={form.phone}
                  onChange={(e) => set("phone")(e.target.value)}
                />
              </div>

              {/* Country */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.countryLabel")}</Label>
                <Select value={form.country} onValueChange={set("country")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.countryPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timezone - detected, editable, never silently guessed */}
              <div className="space-y-1.5">
                <Label htmlFor="timezone">{tx("timezoneLabel")}</Label>
                <Input
                  id="timezone"
                  value={form.timezone}
                  onChange={(e) => set("timezone")(e.target.value)}
                  placeholder="Africa/Cairo"
                />
                <p className="text-xs text-muted-foreground">
                  {tx("timezoneHint")}
                </p>
              </div>

              {/* Level */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.levelLabel")}</Label>
                <Select value={form.level} onValueChange={set("level")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.levelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Goal */}
              <div className="space-y-1.5">
                <Label>{t("completeProfile.goalLabel")}</Label>
                <Select value={form.goal} onValueChange={set("goal")}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("completeProfile.goalPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {GOALS.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? t("completeProfile.savingButton") : t("completeProfile.saveButton")}
                {!submitting && <ArrowRight className="h-4 w-4 ml-2" />}
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              {t("completeProfile.privacyNote")}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CompleteProfilePage;
