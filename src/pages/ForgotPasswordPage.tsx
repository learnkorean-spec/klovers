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

const ForgotPasswordPage = () => {
  useSEO({ title: "Forgot Password | Klovers", description: "Reset your Klovers account password to regain access to your Korean lessons.", noindex: true });
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { t } = useLanguage();

  // Park the destination before the student leaves for her inbox. The reset
  // link comes back to /reset-password with no memory of where she was headed,
  // and often in a different tab, so a query parameter cannot survive the trip.
  useEffect(() => {
    rememberRedirect(redirectTo);
  }, [redirectTo]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // redirectTo is deliberately left exactly as it was. Supabase matches this
    // URL against the project's allowed-redirect list, so appending a query
    // string here risks breaking password reset for everyone. The destination
    // travels in localStorage instead - see rememberRedirect above.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      toast({ title: t("auth.loginFailed"), description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
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
              <div className="text-center space-y-4">
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
                <Input
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  <Link to={withRedirect("/login", redirectTo)} className="text-primary underline">{t("auth.backToLogin")}</Link>
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
