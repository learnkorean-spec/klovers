import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { useAdminLtr } from "@/hooks/admin/useAdminLtr";
import { withTimeout, isServiceOutage } from "@/lib/withTimeout";

const AdminLogin = () => {
  useAdminLtr();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // signInWithPassword() and the role check below have no timeout of
      // their own; if Supabase is unreachable (the 17 Oct 2026 outage, same
      // failure mode as ProtectedRoute.tsx's session-refresh hang), this is
      // the only door into the admin panel, so a hang here with no feedback
      // and no way to retry would be worse than being locked out already in.
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        20_000,
        "login",
      );

      if (error) {
        const description = isServiceOutage(error)
          ? "The server isn't responding. Check your connection and try again."
          : "Invalid credentials or insufficient permissions.";
        toast({ title: "Access denied", description, variant: "destructive" });
        return;
      }

      // Check if user has admin role
      const { data: roleData, error: roleError } = await withTimeout(
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .eq("role", "admin")
          .maybeSingle(),
        10_000,
        "role check",
      );

      if (roleError) {
        const description = isServiceOutage(roleError)
          ? "The server isn't responding. Check your connection and try again."
          : "Invalid credentials or insufficient permissions.";
        toast({ title: "Access denied", description, variant: "destructive" });
        return;
      }

      if (!roleData) {
        await supabase.auth.signOut();
        toast({ title: "Access denied", description: "Invalid credentials or insufficient permissions.", variant: "destructive" });
        return;
      }

      navigate("/admin");
    } catch (err) {
      const description = isServiceOutage(err)
        ? "The server isn't responding. Check your connection and try again."
        : "Something went wrong. Please try again.";
      toast({ title: "Access denied", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="ltr" lang="en" className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary border border-black/25">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-sm font-medium text-foreground">Email</label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-sm font-medium text-foreground">Password</label>
              <Input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              <Link to="/forgot-password" className="text-foreground font-semibold underline">Forgot password?</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
