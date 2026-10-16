import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/lib/withTimeout";

const AuthProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const location = useLocation();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, "session");
        setStatus(session ? "authenticated" : "unauthenticated");
      } catch {
        // Backend unreachable: keep whatever onAuthStateChange reported, else
        // send her to login (which explains the outage) rather than "Loading…" forever.
        setStatus((s) => (s === "loading" ? "unauthenticated" : s));
      }
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setStatus(session ? "authenticated" : "unauthenticated");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{typeof document !== "undefined" && document.documentElement.lang === "ar" ? "جارٍ التحميل…" : "Loading..."}</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

export default AuthProtectedRoute;
