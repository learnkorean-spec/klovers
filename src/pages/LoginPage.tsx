import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { trustCopy } from "@/lib/trustFigures";
import { safeRedirect, withRedirect } from "@/lib/authRedirect";

const LoginPage = () => {
  useSEO({ title: document.documentElement.lang === "ar" ? "تسجيل الدخول | كلوفرز" : "Login | Klovers", description: document.documentElement.lang === "ar" ? "تسجيل الدخول إلى حساب كلوفرز للوصول إلى الدروس ولوحة الطالب." : "Sign in to your Klovers account to access your Korean lessons, progress tracker, and student dashboard.", noindex: true });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Only same-site relative paths ("/x", never "//x") are honoured.
  const redirectTo = safeRedirect(searchParams.get("redirect"));
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // If user is already authenticated (e.g. returning from OAuth), redirect immediately
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const savedRedirect = safeRedirect(localStorage.getItem("enroll_redirect"));
        const finalRedirect = redirectTo || savedRedirect || "/dashboard";
        if (savedRedirect) localStorage.removeItem("enroll_redirect");
        navigate(finalRedirect, { replace: true });
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const savedRedirect = safeRedirect(localStorage.getItem("enroll_redirect"));
        const finalRedirect = redirectTo || savedRedirect || "/dashboard";
        if (savedRedirect) localStorage.removeItem("enroll_redirect");
        navigate(finalRedirect, { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      let description = t("auth.invalidCredentials");
      if (error.message?.includes("Email not confirmed")) {
        description = t("auth.emailNotConfirmed");
      }
      toast({ title: t("auth.loginFailed"), description, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Check if admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleData) {
      navigate("/admin");
    } else {
      // Stamp reset_version on profile
      try {
        const { data: setting } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "app_reset_version")
          .single();
        if (setting?.value) {
          await supabase
            .from("profiles")
            .update({ reset_version: setting.value } as any)
            .eq("user_id", data.user.id);
        }
      } catch { /* ignore */ }

      // Post-login: sync enroll_draft to enrollment if present
      try {
        const draftRaw = localStorage.getItem("enroll_draft");
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          if (draft.level || draft.package_id || draft.preferred_day) {
            const schedUpdate: Record<string, any> = {};
            if (draft.level) schedUpdate.level = draft.level;
            if (draft.package_id || draft.packageId) schedUpdate.package_id = draft.package_id || draft.packageId;
            if (draft.preferred_day || draft.days) schedUpdate.preferred_day = draft.preferred_day || draft.days;
            if (draft.preferred_time || draft.time) schedUpdate.preferred_time = draft.preferred_time || draft.time;
            if (draft.timezone || draft.tz) schedUpdate.timezone = draft.timezone || draft.tz;

            const { data: pending } = await supabase
              .from("enrollments")
              .select("id, level")
              .eq("user_id", data.user.id)
              .in("status", ["PENDING", "PENDING_PAYMENT"] as any)
              .order("created_at", { ascending: false })
              .limit(1);

            if (pending && pending.length > 0 && (!pending[0].level || pending[0].level === "")) {
              await supabase
                .from("enrollments")
                .update(schedUpdate as any)
                .eq("id", pending[0].id);
            }
            localStorage.removeItem("enroll_draft");
          }
        }
      } catch { /* ignore draft sync errors */ }

      const savedRedirect = safeRedirect(localStorage.getItem("enroll_redirect"));
      const finalRedirect = redirectTo || savedRedirect || "/dashboard";
      if (savedRedirect) localStorage.removeItem("enroll_redirect");
      navigate(finalRedirect);
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    // Always save intended redirect so we can use it after OAuth callback
    const intendedRedirect = redirectTo || "/dashboard";
    localStorage.setItem("enroll_redirect", intendedRedirect);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/login` },
      });
      if (error) {
        localStorage.removeItem("enroll_redirect");
        toast({
          title: isAr ? "تسجيل الدخول عبر Google غير متاح" : "Google sign-in unavailable",
          description: isAr ? "يرجى استخدام البريد الإلكتروني وكلمة المرور، أو التواصل مع الدعم." : "Please use email and password to log in, or contact support.",
          variant: "destructive",
        });
      }
    } catch {
      localStorage.removeItem("enroll_redirect");
      toast({
        title: isAr ? "فشل تسجيل الدخول" : "Sign-in failed",
        description: isAr ? "يرجى استخدام البريد الإلكتروني وكلمة المرور." : "Please use email and password to log in.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 px-4">
        <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-2 lg:items-center lg:gap-10">

        {/* Story art: the two friends and Cluby picnicking by the Han river.
            A short strip on phones, a tall panel beside the form from lg up. */}
        <figure className="relative overflow-hidden rounded-3xl border border-border bg-charcoal shadow-sm">
          <img
            src="/assets/cluby/picnic.webp"
            alt={isAr ? "صديقان وكلوبي في نزهة على نهر الهان" : "Two friends and Cluby having a picnic by the Han river"}
            width={1600}
            height={900}
            decoding="async"
            className="h-28 w-full object-cover object-[center_60%] lg:h-[28rem]"
          />
          <figcaption className="absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-charcoal/90 via-charcoal/50 to-transparent p-6 pt-20 text-start lg:block">
            <span className="block font-display text-2xl font-extrabold leading-tight text-ivory">
              {isAr ? "أهلًا بالعودة." : "Welcome back."}
            </span>
            <span className="mt-1 block text-sm text-ivory/80">
              {isAr ? "كل شيء محفوظ، والرحلة تُستأنف من حيث توقفت." : "Everything is saved. The journey picks up where it paused."}
            </span>
            <span className="mt-2 block text-xs font-semibold text-ivory/70">
              {trustCopy(language).ratingShort}
            </span>
          </figcaption>
        </figure>

        <div className="flex w-full flex-col items-center gap-4">

        {/* 25 Sep 2026: the emoji welcome strip that sat here was removed. The
            sourced rating (Google, 5.0 from 7) now sits in the story panel's
            caption. */}

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.logIn")}</CardTitle>
            {/* One welcome per screen: from lg up the story panel's caption
                says it, so this line shows only below lg. */}
            <p className="text-sm text-muted-foreground mt-1 lg:hidden">{isAr ? "مرحبًا بالعودة، والتقدّم محفوظ." : "Welcome back — your progress is waiting for you."}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <label htmlFor="login-email" className="sr-only">{t("auth.email")}</label>
              <Input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <label htmlFor="login-password" className="sr-only">{t("auth.password")}</label>
              <Input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.signingIn") : t("auth.logIn")}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                <Link to={withRedirect("/forgot-password", redirectTo)} className="text-foreground font-semibold underline">{t("auth.forgotPassword")}</Link>
              </p>
              <p className="text-sm text-center text-muted-foreground">
                {t("auth.dontHaveAccount")} <Link to={withRedirect("/signup", redirectTo)} className="text-foreground font-semibold underline">{t("auth.signUp")}</Link>
              </p>
            </form>
          </CardContent>
        </Card>

        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default LoginPage;
