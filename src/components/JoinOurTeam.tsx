import { ArrowRight, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { logEngagementEvent } from "@/lib/leadTracking";

/**
 * "Growing Our Teaching Team" — the homepage section for prospective
 * teachers, added 21 Oct 2026 alongside the admin-side Teacher Onboarding
 * system (src/components/admin/TeacherOnboardingManager.tsx) and the public
 * application intake (src/pages/TeachWithUsPage.tsx, supabase table
 * teacher_applications).
 *
 * Deliberately NOT routed through logLeadEvent: that function mirrors every
 * call to the Meta Pixel as a `Lead` conversion and to GA4 as
 * `generate_lead` — both feed ad-spend optimisation for STUDENT acquisition
 * (see the big comment on LeadSource in src/lib/leadTracking.ts). A teacher
 * applicant clicking this is not a student lead, and counting it as one
 * would quietly inject fake conversions into that data, the exact mistake
 * that file's own docs warn against for game events. logEngagementEvent
 * (source_type "homepage", like every other section's visibility/scroll
 * tracking in Index.tsx) is pixel-free by construction, so this is safe.
 *
 * Placement: last section before the footer, after every student-facing
 * conversion section and the story beats (MeetTeacher's "Meet Your Teacher"
 * stays about Reham specifically — see that file's own note on why it does
 * not claim a team — so this is a separate, clearly-secondary-audience
 * section, not a rewrite of hers).
 */
const JoinOurTeam = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="py-16 md:py-20 bg-muted/40 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-klovers-yellow/60 border border-klovers-yellow mb-5">
            <GraduationCap className="h-7 w-7 text-charcoal" aria-hidden="true" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-3">
            {isAr ? "نبحث عن معلمين ومعلمات للانضمام إلينا" : "We're Growing Our Teaching Team"}
          </h2>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-8">
            {isAr
              ? "هل تدرّسين أو تدرّس اللغة الكورية؟ كلوفرز تتوسّع عبر كل المستويات من الهانغول حتى المستوى السادس، ونرحّب بمعلمين جدد ينضمون لفريق التدريس."
              : "Do you teach Korean? Klovers is expanding across every level, from Hangul through Level 6, and we're looking for new teachers to join."}
          </p>
          <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8 rounded-full">
            <Link
              to="/teach-with-us"
              onClick={() => { try { logEngagementEvent({ source_type: "homepage", cta_label: "join_team_cta" }); } catch {} }}
            >
              {isAr ? "التقدّم للتدريس معنا" : "Apply to Teach With Us"}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default JoinOurTeam;
