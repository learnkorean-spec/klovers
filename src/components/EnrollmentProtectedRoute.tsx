import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, GraduationCap } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";

type Status = "loading" | "unauthenticated" | "enrolled" | "not_enrolled";

const EnrollmentProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<Status>("loading");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setStatus("unauthenticated"); return; }

      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", session.user.id)
        .eq("payment_status", "PAID")
        .eq("approval_status", "APPROVED")
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Enrollment check failed:", error.message);
        setStatus("not_enrolled");
        return;
      }
      setStatus(data ? "enrolled" : "not_enrolled");
    };
    check();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking access…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (status === "not_enrolled") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-primary border border-black/25 flex items-center justify-center">
              <Lock className="h-9 w-9 text-primary-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Active Enrollment Required</h1>
            <p className="text-muted-foreground text-sm leading-relaxed">
              This feature is available to enrolled students with an active paid plan.
              Enroll now to unlock the textbook, vocabulary review, daily quiz, and more.
            </p>
          </div>

          <div className="space-y-3">
            <Button size="lg" className="w-full gap-2" onClick={() => navigate("/enroll-now")}>
              <GraduationCap className="h-4 w-4" />
              See Enrollment Plans
            </Button>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to enroll in a Korean course.")}`}
              onClick={(e) => {
                e.preventDefault();
                trackAndOpenWhatsApp(
                  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I'd like to enroll in a Korean course.")}`,
                  { cta_label: "enroll_gate" },
                );
              }}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <span className="text-base">💬</span> Ask us on WhatsApp
            </a>

            <button
              onClick={() => navigate("/dashboard")}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default EnrollmentProtectedRoute;
