import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Loader2 } from "lucide-react";

const ResetPasswordPage = () => {
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

    // Also check if there's already an active session (user may have landed here with a valid session)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    // Timeout: if no recovery session after 5s, mark as expired
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
      toast({ title: "Password too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    if (password !== confirmPassword) {
      toast({ title: "Passwords don't match", description: "Please make sure both passwords are the same.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      const msg = error.message?.toLowerCase() || "";
      if (msg.includes("same_password") || msg.includes("same password") || msg.includes("different password")) {
        toast({ title: "Same password", description: "New password must be different from your current password.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "Could not update password. The link may have expired.", variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    // Sign out to force a clean login with the new password
    await supabase.auth.signOut();

    toast({ title: "Password updated", description: "You can now log in with your new password." });
    navigate("/login");
  };

  if (expired && !sessionReady) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="pt-24 pb-16 flex items-center justify-center px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Link Expired</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">This password reset link has expired or is invalid.</p>
              <Button asChild className="w-full">
                <Link to="/forgot-password">Request a new link</Link>
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
        <main className="pt-24 pb-16 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your reset link…</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="pt-24 pb-16 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Set New Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-4">
              <Input
                type="password"
                placeholder="New password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
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
