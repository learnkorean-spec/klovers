import { lazy, Suspense } from "react";
import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";

const RehamTrainingPanel = lazy(() => import("@/components/admin/RehamTrainingPanel"));

/**
 * Re's personal interview-training panel (/practice-interview).
 *
 * 28 Sep 2026 (dashboard scan42-pi-password-in-code): the page used to gate
 * itself with a password constant compiled into the public JS bundle, so any
 * visitor reading the code could get in. The route is now wrapped in the
 * admin ProtectedRoute (see App.tsx) and the in-page password gate is gone.
 */
export default function InterviewTrainingPage() {
  const { t } = useLanguage();
  // Private admin page: keep it out of search results (dashboard scan42-pi-indexable).
  useSEO({ title: "Interview training | Klovers", noindex: true });

  return (
    <div className="min-h-screen bg-ivory dark:bg-muted p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <GraduationCap className="h-6 w-6" aria-hidden="true" />
            {t("interviewTraining.gateTitle")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("interviewTraining.gateTag")}</p>
        </div>
        <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-charcoal border-t-transparent rounded-full" /></div>}>
          <RehamTrainingPanel />
        </Suspense>
      </div>
    </div>
  );
}
