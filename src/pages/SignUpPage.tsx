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
import { Separator } from "@/components/ui/separator";
import { useLanguage } from "@/contexts/LanguageContext";

const SignUpPage = () => {
  useSEO({ title: "Sign Up | Klovers Korean Academy", description: "Create your free Klovers account and start learning Korean with live interactive classes today." });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const { t } = useLanguage();

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

  const handleSocialLogin = async (provider: "google" | "apple") => {
    const intendedRedirect = redirectTo || "/dashboard";
    localStorage.setItem("enroll_redirect", intendedRedirect);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/login` },
    });
    if (error) {
      localStorage.removeItem("enroll_redirect");
      toast({ title: t("auth.signUpFailed") || "Sign up failed", description: `Could not sign up with ${provider}.`, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main-content" className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{t("auth.createAccount") || "Create Account"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {t("auth.signUpSubtitle") || "Join K-Lovers and start learning Korean today"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => handleSocialLogin("google")}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("auth.continueWithGoogle") || "Continue with Google"}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleSocialLogin("apple")}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                {t("auth.continueWithApple") || "Continue with Apple"}
              </Button>
            </div>
            <div className="flex items-center gap-3 my-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">{t("auth.or") || "or"}</span>
              <Separator className="flex-1" />
            </div>
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
      </main>
      <Footer />
    </div>
  );
};

export default SignUpPage;
