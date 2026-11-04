import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, GraduationCap } from "lucide-react";
import { WHATSAPP_NUMBER } from "@/lib/siteConfig";
import { trackAndOpenWhatsApp } from "@/lib/leadTracking";
import { withTimeout } from "@/lib/withTimeout";

type Status = "loading" | "unauthenticated" | "enrolled" | "not_enrolled" | "error";

const EnrollmentProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [status, setStatus] = useState<Status>("loading");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        // getSession() awaits a token refresh when the stored token has
        // expired; withTimeout stops that from hanging forever (the 17 Oct
        // 2026 outage failure mode) and leaving a paying student stuck on
        // "Checking access..." forever, locked out of the textbook/vocab/
        // quiz features this route gates.
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 8000, "session");
        if (!session) { setStatus("unauthenticated"); return; }

        const { data, error } = await withTimeout(
          supabase
            .from("enrollments")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("payment_status", "PAID")
            .eq("approval_status", "APPROVED")
            .limit(1)
            .maybeSingle(),
          8000,
          "enrollment check",
        );

        if (error) {
          console.error("Enrollment check failed:", error.message);
          // A failed lookup isn't "not enrolled" - that would wrongly show
          // an already-paying student the upsell screen during an outage.
          setStatus((prev) => (prev === "enrolled" ? prev : "error"));
          return;
        }
        setStatus(data ? "enrolled" : "not_enrolled");
      } catch {
        setStatus((prev) => (prev === "enrolled" ? prev : "error"));
      }
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

  if (status === "error") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <p className="text-muted-foreground">Could not check your access. Check your connection and try again.</p>
        <button
          className="rounded-md border px-3 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
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
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
