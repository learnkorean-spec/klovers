import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { Mail } from "lucide-react";

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { t } = useLanguage();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailRedirect = redirectTo
      ? `${window.location.origin}${redirectTo}`
      : `${window.location.origin}/enroll-now`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: emailRedirect,
      },
    });

    if (error) {
      let description = t("auth.signUpFailed");
      if (error.message?.includes("rate limit")) {
        description = t("auth.rateLimited");
      }
      toast({ title: t("auth.signUpFailed"), description, variant: "destructive" });
      setLoading(false);
      return;
    }

    // Save redirect for after magic link login
    if (redirectTo) {
      localStorage.setItem("enroll_redirect", redirectTo);
    }

    setLinkSent(true);
    toast({ title: t("auth.magicLinkSent"), description: t("auth.magicLinkSentDesc") });
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.createAccount")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t("auth.enterEmailToSignIn")}
            </p>
          </CardHeader>
          <CardContent>
            {linkSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{t("auth.checkEmail")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("auth.magicLinkSentDesc")}
                </p>
                <Button variant="outline" className="w-full" onClick={() => setLinkSent(false)}>
                  {t("auth.tryAnotherEmail") || "Try another email"}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <Input
                  type="email"
                  placeholder={t("auth.email")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  <Mail className="mr-2 h-4 w-4" />
                  {loading ? t("auth.sending") : (t("auth.sendMagicLink") || "Send Magic Link")}
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  {t("auth.alreadyHaveAccount")}{" "}
                  <Link
                    to={redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login"}
                    className="text-foreground font-semibold underline"
                  >
                    {t("auth.logIn")}
                  </Link>
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

export default SignUpPage;
