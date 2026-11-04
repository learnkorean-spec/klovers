import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { withTimeout, isServiceOutage } from "@/lib/withTimeout";

const ResetPasswordPage = () => {
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  useSEO({
    title: isAr ? "كلمة مرور جديدة | كلوفرز" : "Reset Password | Klovers",
    description: isAr
      ? "تعيين كلمة مرور جديدة لحساب كلوفرز."
      : "Set a new password for your Klovers account.",
    noindex: true,
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    const timeout = setTimeout(() => {
      setSessionReady((ready) => {
        if (!ready) setExpired(true);
        return ready;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast({ title: t("auth.passwordTooShort"), variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: t("auth.passwordsDontMatch"), variant: "destructive" });
      return;
    }

    setLoading(true);

    let result: Awaited<ReturnType<typeof supabase.auth.updateUser>>;
    try {
      // withTimeout guards against updateUser() hanging rather than resolving
      // or rejecting (the 17 Oct 2026 outage failure mode), which would
      // otherwise leave this button saying "Updating..." forever.
      result = await withTimeout(supabase.auth.updateUser({ password }), 15000, "update password");
    } catch (err) {
      toast({
        title: isAr ? "تعذّر حفظ كلمة المرور" : "The password could not be saved",
        description: isServiceOutage(err)
          ? (isAr ? "الخادم لا يستجيب. يُرجى المحاولة مرة أخرى بعد لحظات." : "The server isn't responding. Please try again in a moment.")
          : (isAr ? "يُرجى المحاولة مرة أخرى." : "Please try again."),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = result;

    if (error) {
      // Only an expired/missing recovery session means "the link expired".
      // A weak password, a rate limit or a network failure used to be
      // reported as an expired link too, sending the student back to request
      // a new email for nothing. Never show the raw server text (English).
      const msg = error.message?.toLowerCase() || "";
      const status = (error as { status?: number }).status;
      if (msg.includes("same_password") || msg.includes("same password") || msg.includes("different password")) {
        toast({ title: t("auth.samePassword"), variant: "destructive" });
      } else if (msg.includes("weak") || msg.includes("at least") || msg.includes("should contain") || msg.includes("password should")) {
        toast({
          title: isAr ? "كلمة المرور ضعيفة" : "This password is too weak",
          description: isAr
            ? "يُرجى اختيار كلمة مرور أطول تجمع بين حروف وأرقام."
            : "Please choose a longer password that mixes letters and numbers.",
          variant: "destructive",
        });
      } else if (status === 401 || status === 403 || msg.includes("session") || msg.includes("jwt") || msg.includes("expired")) {
        setExpired(true);
        setSessionReady(false);
      } else {
        toast({
          title: isAr ? "تعذّر حفظ كلمة المرور" : "The password could not be saved",
          description: isAr ? "يُرجى المحاولة مرة أخرى بعد لحظات." : "Please try again in a moment.",
          variant: "destructive",
        });
      }
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();

    toast({
      title: isAr ? "حُفظت كلمة المرور الجديدة" : "New password saved",
      description: t("auth.passwordUpdated"),
    });
    navigate("/login");
  };

  if (expired && !sessionReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("auth.linkExpired")}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">{t("auth.linkExpiredDesc")}</p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">{t("auth.requestNewLink")}</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3" role="status">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-muted-foreground">{t("auth.verifyingLink")}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.setNewPassword")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <label htmlFor="reset-new-password" className="sr-only">{t("auth.newPassword")}</label>
              <Input
                id="reset-new-password"
                name="new-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <label htmlFor="reset-confirm-password" className="sr-only">{t("auth.confirmPassword")}</label>
              <Input
                id="reset-confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                placeholder={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.updating") : t("auth.updatePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ResetPasswordPage;
