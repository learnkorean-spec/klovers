import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminLtr } from "@/hooks/admin/useAdminLtr";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Admin screens are English: always left to right, whatever the site language.
  useAdminLtr();
  const [status, setStatus] = useState<"loading" | "authorized" | "unauthorized" | "error">("loading");

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus("unauthorized");
        return;
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      // A failed lookup is not "not an admin". Sending her to the login page
      // for a dropped connection looks like being logged out; an admin who
      // is already in keeps the page, anyone else sees a retry.
      if (error) {
        setStatus((prev) => (prev === "authorized" ? prev : "error"));
        return;
      }

      setStatus(data ? "authorized" : "unauthorized");
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, []);

  if (status === "loading") {
    return (
      <div dir="ltr" lang="en" className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div dir="ltr" lang="en" className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="text-muted-foreground">Could not check your access. Check your connection and try again.</p>
        <button className="rounded-md border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" onClick={() => window.location.reload()}>Try again</button>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return <div dir="ltr" lang="en">{children}</div>;
};

export default ProtectedRoute;
