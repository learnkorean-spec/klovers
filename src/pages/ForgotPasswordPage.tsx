import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { rememberRedirect, withRedirect } from "@/lib/authRedirect";
import { withTimeout, isServiceOutage } from "@/lib/withTimeout";

const ForgotPasswordPage = () => {
  useSEO({
    title: document.documentElement.lang === "ar" ? "استعادة كلمة المرور | كلوفرز" : "Forgot Password | Klovers",
    description: document.documentElement.lang === "ar"
      ? "إرسال رابط لإعادة تعيين كلمة مرور حساب كلوفرز والعودة إلى الدروس."
      : "Reset your Klovers account password to regain access to your Korean lessons.",
    noindex: true,
  });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { t, language } = useLanguage();
  const isAr = language === "ar";

  // Park the destination before the student leaves for her inbox. The reset
  // link comes back to /reset-password with no memory of where she was headed,
  // and often in a different tab, so a query parameter cannot survive the trip.
  useEffect(() => {
    rememberRedirect(redirectTo);
  }, [redirectTo]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // redirectTo is deliberately left exactly as it was. Supabase matches this
      // URL against the project's allowed-redirect list, so appending a query
      // string here risks breaking password reset for everyone. The destination
      // travels in localStorage instead - see rememberRedirect above.
      // withTimeout guards against the call hanging rather than resolving or
      // rejecting (the 17 Oct 2026 outage failure mode), which would otherwise
      // leave this button saying "Sending..." forever.
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        }),
        15000,
        "reset email",
      );

      if (error) {
        // Never show the raw server message (English, technical). The one case
        // a visitor can act on is the rate limit: asking twice within a minute.
        const rateLimited =
          (error as { status?: number }).status === 429 ||
          /seconds|rate limit/i.test(error.message ?? "");
        const description = rateLimited
          ? (isAr ? "طُلب رابط قبل لحظات. يمكن المحاولة مرة أخرى بعد دقيقة." : "A link was requested a moment ago. Please try again in a minute.")
          : isServiceOutage(error)
          ? (isAr ? "الخادم لا يستجيب. يُرجى التأكد من الاتصال والمحاولة مرة أخرى." : "The server isn't responding. Check your connection and try again.")
          : (isAr ? "يُرجى التأكد من البريد الإلكتروني والمحاولة مرة أخرى." : "Please check the email address and try again.");
        toast({
          title: isAr ? "تعذّر إرسال الرابط" : "The link could not be sent",
          description,
          variant: "destructive",
        });
        return;
      }

      setSent(true);
    } catch (err) {
      toast({
        title: isAr ? "تعذّر إرسال الرابط" : "The link could not be sent",
        description: isServiceOutage(err)
          ? (isAr ? "الخادم لا يستجيب. يُرجى التأكد من الاتصال والمحاولة مرة أخرى." : "The server isn't responding. Check your connection and try again.")
          : (isAr ? "يُرجى المحاولة مرة أخرى." : "Please try again."),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.resetPassword")}</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4" role="status">
                <p className="text-muted-foreground">
                  {t("auth.resetEmailSent")}
                </p>
                <Button variant="outline" asChild className="w-full">
                  <Link to={withRedirect("/login", redirectTo)}>{t("auth.backToLogin")}</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t("auth.resetEmailPrompt")}
                </p>
                <label htmlFor="forgot-email" className="sr-only">{t("auth.email")}</label>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  <Link to={withRedirect("/login", redirectTo)} className="text-foreground font-semibold underline">{t("auth.backToLogin")}</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPasswordPage;
