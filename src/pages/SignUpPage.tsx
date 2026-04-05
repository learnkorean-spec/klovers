import { useState } from "react";
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
import { track } from "@/lib/tracking";

const SignUpPage = () => {
  useSEO({ title: "Sign Up | Klovers Korean Academy", description: "Create your free Klovers account and start learning Korean with live interactive classes today.", noindex: true });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  // Capture referrer ID from URL param or localStorage (set by free-trial page)
  const referrerId = searchParams.get("ref") ?? localStorage.getItem("referrer_id");
  if (searchParams.get("ref")) {
    localStorage.setItem("referrer_id", searchParams.get("ref")!);
  }
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: t("auth.passwordTooShort") || "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: name.trim() },
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
      description: t("auth.welcomeMessage") || "Welcome to K-Lovers! You can now sign in.",
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
          <span>{isAr ? "👥 +1,000 طالب" : "👥 1,000+ students"}</span>
          <span className="text-border">·</span>
          <span>{isAr ? "🌍 +15 دولة" : "🌍 15+ countries"}</span>
          <span className="text-border">·</span>
          <span className="text-green-600 font-semibold">{isAr ? "مجاني" : "Free to join"}</span>
        </div>

        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.createAccount") || "Create Account"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {t("auth.signUpSubtitle") || "Join K-Lovers and start learning Korean today"}
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
