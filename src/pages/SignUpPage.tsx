import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { track } from "@/lib/tracking";
import { LEVEL_SELECT_OPTIONS } from "@/constants/levels";
import { rememberRedirect, withRedirect } from "@/lib/authRedirect";
import { countryFromTimezone } from "@/lib/stripePrices";

const SignUpPage = () => {
  useSEO({ title: "Sign Up | Klovers Korean Academy", description: "Create your free Klovers account and start learning Korean with live interactive classes today.", noindex: true });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  // Capture referrer ID from URL param or localStorage (set by free-trial page)
  const referrerId = searchParams.get("ref") ?? localStorage.getItem("referrer_id");
  if (searchParams.get("ref")) {
    localStorage.setItem("referrer_id", searchParams.get("ref")!);
    // Track the referral link click (fire-and-forget, for +2% sharing bonus)
    supabase.functions.invoke("track-referral-click", {
      body: { referrerId: searchParams.get("ref") },
    }).catch(() => {});
  }
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // Remember where this signup was heading as soon as the page opens, not only
  // after a successful signup. A student who arrived from the trial email and
  // then clicks "Forgot password?" leaves without ever submitting this form -
  // without this she would come back to the dashboard instead of the booking
  // page she was sent here for.
  useEffect(() => {
    rememberRedirect(redirectTo);
  }, [redirectTo]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t("auth.passwordTooShort") || "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    // Treat "not_sure" as no level — we'll prompt again on the trial booking page.
    const persistedLevel = level && level !== "not_sure" ? level : "";

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: name.trim(),
          // Stored in user_metadata so it survives email-confirmation flows
          // where there's no immediate session to update profiles directly.
          ...(persistedLevel ? { level: persistedLevel } : {}),
          // Which language they are reading Klovers in, right now, on this page.
          // Until this line existed nothing ever wrote profiles.language and all
          // 107 rows sat on the 'ar' default, so every language-aware letter went
          // out in Arabic — including to students on the English track.
          // handle_new_user accepts 'ar' and 'en' only.
          language,
        },
        emailRedirectTo: redirectTo
          ? `${window.location.origin}${redirectTo}`
          : `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      let description = t("auth.signUpFailed") || "Sign up failed";
      if (error.message?.includes("already registered")) {
        description = t("auth.accountExists") || "An account with this email already exists. Try logging in.";
      } else if (error.message?.includes("rate limit")) {
        description = t("auth.rateLimited") || "Too many attempts. Please try again later.";
      }
      toast({ title: t("auth.signUpFailed") || "Sign up failed", description, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Save redirect for after login
    if (redirectTo) {
      localStorage.setItem("enroll_redirect", redirectTo);
    }

    // Persist Korean level to profile when we have a session (auto-confirm path).
    // For email-confirmation flows the level is preserved in user_metadata and
    // synced on first authenticated load.
    if (persistedLevel && data.session && data.user) {
      await supabase
        .from("profiles")
        .update({ level: persistedLevel })
        .eq("user_id", data.user.id);
    }

    // Store where this student is, on the same auto-confirm path the level
    // write uses. The timezone is a fact the browser already knows, so it is
    // always written; the country only when the timezone names one, because a
    // stored country outranks the live timezone everywhere it is read.
    //
    // Fire-and-forget on purpose: profiles.country and profiles.timezone being
    // empty is what this fixes, but a failed write must not cost her the
    // signup, and nothing here is worth delaying the redirect for.
    if (data.session && data.user) {
      const userId = data.user.id;
      const tz = (() => {
        try {
          return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
        } catch {
          return "";
        }
      })();
      const derivedCountry = countryFromTimezone(tz);
      const patch: Record<string, string> = {};
      if (tz) patch.timezone = tz;
      if (derivedCountry) patch.country = derivedCountry;

      if (Object.keys(patch).length > 0) {
        void (async () => {
          try {
            const { error: locationError } = await supabase
              .from("profiles")
              .update(patch)
              .eq("user_id", userId);
            if (locationError) {
              console.error("signup: location write failed:", locationError.message);
            }
          } catch {
            // Non-critical — don't block signup on the location write
          }
        })();
      }
    }

    track.completeRegistration();

    // Record referral if this signup came via a referral link
    if (referrerId && data.user) {
      try {
        await supabase.functions.invoke("record-referral", {
          body: { referrerId, referredEmail: email.trim().toLowerCase() },
        });
        localStorage.removeItem("referrer_id");
      } catch {
        // Non-critical — don't block signup on referral failure
      }
    }

    toast({
      title: t("auth.accountCreated") || "Account created!",
      description: t("auth.welcomeMessage") || "Welcome to Klovers! You can now sign in.",
    });
    setLoading(false);

    // Auto-confirmed: redirect immediately
    if (data.session) {
      const finalRedirect = redirectTo || "/dashboard";
      navigate(finalRedirect);
    } else {
      navigate(redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login");
    }
  };


  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex flex-col items-center justify-center px-4 gap-4">

        {/* Social proof strip */}
        <div className="flex items-center gap-3 flex-wrap justify-center text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5 font-medium text-foreground">{isAr ? "⭐ تقييم 4.9" : "⭐ 4.9 rated"}</span>
          <span className="text-border">·</span>
          <span>{isAr ? "👥 +500 طالب" : "👥 500+ students"}</span>
          <span className="text-border">·</span>
          <span>{isAr ? "🌍 +15 دولة" : "🌍 15+ countries"}</span>
          <span className="text-border">·</span>
          <span className="text-green-600 font-semibold">{isAr ? "مجاني" : "Free to join"}</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            {redirectTo === "/trial-booking" && (
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-3 mb-3 text-sm text-foreground">
                <p className="font-black text-base mb-0.5">{isAr ? "🎁 خطوة واحدة لحصتك المجانية" : "🎁 One step from your free class"}</p>
                <p className="text-muted-foreground text-xs">{isAr ? "أنشئ حسابًا مجانيًا في 30 ثانية، ثم اختر موعدك." : "Create a free account in 30 seconds, then pick your slot."}</p>
              </div>
            )}
            <CardTitle className="text-2xl">{t("auth.createAccount") || "Create Account"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("auth.signUpSubtitle") || "Join Klovers and start learning Korean today"}
            </p>
            {/* Benefit pills */}
            <div className="flex flex-wrap justify-center gap-2 pt-3">
              {(isAr ? ["🎯 اختبار مستوى مجاني", "🎮 13 لعبة تعليمية", "📚 كتاب دراسي كامل"] : ["🎯 Free placement test", "🎮 13 learning games", "📚 Full textbook access"]).map((b) => (
                <span key={b} className="text-[11px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                  {b}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <Input
                type="text"
                placeholder={t("auth.fullName") || "Full Name"}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                type="email"
                placeholder={t("auth.email") || "Email"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder={t("auth.password") || "Password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              {password.length > 0 && (() => {
                const strength = password.length >= 10 && /[A-Z]/.test(password) && /[0-9]/.test(password) ? 3
                  : password.length >= 8 ? 2
                  : 1;
                const labels = isAr
                  ? ["ضعيفة", "جيدة", "قوية"]
                  : ["Weak", "Good", "Strong"];
                const colors = ["bg-red-500", "bg-yellow-500", "bg-green-500"];
                return (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3].map((s) => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-colors duration-200 ${s <= strength ? colors[strength - 1] : "bg-muted"}`} />
                      ))}
                    </div>
                    <p className={`text-xs ${strength === 1 ? "text-red-500" : strength === 2 ? "text-yellow-600" : "text-green-600"}`}>
                      {labels[strength - 1]}
                    </p>
                  </div>
                );
              })()}
              {redirectTo !== "/trial-booking" && (
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "مستوى اللغة الكورية (اختياري)" : "Korean level (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_sure">{isAr ? "لست متأكدًا" : "Not sure yet"}</SelectItem>
                    {LEVEL_SELECT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (t("auth.creatingAccount") || "Creating account...") : (t("auth.signUp") || "Sign Up")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                {t("auth.alreadyHaveAccount") || "Already have an account?"}{" "}
                <Link
                  to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                  className="text-foreground font-semibold underline"
                >
                  {t("auth.logIn") || "Log In"}
                </Link>
              </p>
              <p className="text-sm text-center text-muted-foreground">
                <Link
                  to={withRedirect("/forgot-password", redirectTo)}
                  className="text-foreground font-semibold underline"
                >
                  {t("auth.forgotPassword") || "Forgot password?"}
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Mini testimonial */}
        <p className="text-xs text-muted-foreground text-center max-w-xs italic">
          "I went from zero Korean to passing TOPIK I in 6 months — the classes and games made it so fun!"
          <br />
          <span className="not-italic font-medium text-foreground">— Sara M., Egypt</span>
        </p>

      </main>
      <Footer />
    </div>
  );
};

export default SignUpPage;
