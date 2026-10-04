import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, GraduationCap, CheckCircle2, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { KOREA_SCHOLARSHIPS } from "@/constants/koreaScholarships";
import { countReachable, matchScholarships, monthsBetween, type DegreeIntent, type MatchRow } from "@/lib/scholarshipMatch";

/**
 * "Which scholarships can your level reach?" — the payoff screen of the
 * placement test, and the same block on the dashboard.
 *
 * THE ONE THING THIS COMPONENT IS CAREFUL ABOUT
 *
 * The FACTS are public and the MATCH is gated. A signed-out visitor sees the
 * six programme names — they are on /scholarships in both languages anyway —
 * and sees a lock where the verdict would be. Locking the names would be
 * pretending information is scarce when it is not; locking the verdict is the
 * honest version of "make an account and we will tell you which ones are
 * yours".
 *
 * WHY IT ASKS ONE QUESTION FIRST
 *
 * The level alone cannot decide: GKS-undergraduate is for school leavers and
 * disqualifies anyone holding a degree, KOICA is for serving officials, and the
 * exchange needs enrolment at a partner university. Guessing the stage would
 * mean telling people they qualify for programmes that explicitly exclude
 * them, so the stage is asked — four chips, one tap — and remembered in
 * localStorage. Nothing is written to the database, so this needs no migration.
 *
 * WHAT IT NEVER DOES: promise a place. `ready` means "nothing in this
 * programme's own rules is stopping you at this level"; every programme still
 * needs a file, and two of them are competitive. The card says so, and the
 * obligations are printed even in the ready state.
 */

const DEGREE_KEY = "klovers_scholarship_degree";

const DEGREE_OPTIONS: { id: DegreeIntent; ar: string; en: string }[] = [
  { id: "school", ar: "طالب في الثانوية", en: "At school" },
  { id: "enrolled", ar: "طالب جامعي", en: "At university" },
  { id: "bachelor", ar: "خريج جامعي", en: "Graduate" },
  { id: "master", ar: "دراسات عليا", en: "Postgraduate" },
];

function readStoredDegree(): DegreeIntent | null {
  try {
    const raw = localStorage.getItem(DEGREE_KEY);
    return DEGREE_OPTIONS.some((o) => o.id === raw) ? (raw as DegreeIntent) : null;
  } catch {
    // A browser refusing storage costs the visitor one tap, not the answer.
    return null;
  }
}

interface Props {
  /** The level the placement test wrote: "hangul" | "l1" … "l6". */
  levelKey: string;
  /** Signed-in learners see the verdict; visitors see the lock. */
  signedIn: boolean;
  /** Shown under the heading so the reader knows what is being matched. */
  levelLabel?: string;
}

const STATUS_STYLE: Record<MatchRow["status"], { ar: string; en: string; className: string }> = {
  ready: { ar: "متاح لمستواك", en: "Open to you", className: "bg-klovers-green text-charcoal" },
  needs: { ar: "يحتاج خطوة", en: "Needs a step", className: "bg-klovers-yellow text-charcoal" },
  not_for_you: { ar: "غير متاح لك الآن", en: "Not for you yet", className: "border border-charcoal/25 text-charcoal/70" },
};

const ScholarshipMatches = ({ levelKey, signedIn, levelLabel }: Props) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [degree, setDegree] = useState<DegreeIntent | null>(readStoredDegree);

  const rows = useMemo(
    () => (degree ? matchScholarships({ levelKey, degree }) : []),
    [degree, levelKey],
  );

  const choose = (id: DegreeIntent) => {
    setDegree(id);
    try {
      localStorage.setItem(DEGREE_KEY, id);
    } catch {
      /* not worth a toast: the answer is on screen either way */
    }
  };

  const reachable = rows.length ? countReachable(rows) : 0;

  /**
   * A dashboard student can reach this block without a level on their profile
   * — older accounts, or one who never took the test. Matching against nothing
   * would print six programmes and no answer, so the block asks for the test
   * instead of pretending to have matched anything.
   */
  const hasLevel = monthsBetween(levelKey, "l1") !== null;
  if (!hasLevel) {
    return (
      <section className="rounded-xl border border-border bg-card p-4 space-y-3 text-start">
        <div className="flex items-start gap-2">
          <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-semibold text-sm">
              {t("أي منح كوريا يستطيع مستواك الوصول إليها؟", "Which Korean scholarships can your level reach?")}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(
                "لا يوجد مستوى محسوب في حسابك بعد. اختبار تحديد المستوى مجاني، وبعد نتيجته تظهر المنح التي تناسبك مباشرة هنا.",
                "There is no level on your account yet. The placement test is free, and your result turns this block into the programmes that fit you.",
              )}
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="w-full">
          <Link to={isAr ? "/ar/placement-test" : "/placement-test"}>
            {t("اختبار تحديد المستوى المجاني", "Take the free placement test")}
          </Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 space-y-4 text-start">
      <div className="flex items-start gap-2">
        <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div>
          <h3 className="font-semibold text-sm">
            {t("أي منح كوريا يستطيع مستواك الوصول إليها؟", "Which Korean scholarships can your level reach?")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {levelLabel
              ? t(
                  `محسوبة على مستواك: ${levelLabel}. ثانية واحدة لمعرفة مرحلتك، ثم نعرض المنح التي تناسبك.`,
                  `Worked out from your level: ${levelLabel}. One tap for your stage, then we show which ones fit.`,
                )
              : t(
                  "ثانية واحدة لمعرفة مرحلتك، ثم نعرض المنح التي تناسبها.",
                  "One tap for your stage, then we show which ones fit.",
                )}
          </p>
        </div>
      </div>

      {/* The one question the level cannot answer. */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {t("أنت الآن", "You are")}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEGREE_OPTIONS.map((o) => {
            const active = degree === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => choose(o.id)}
                aria-pressed={active}
                className={`h-11 rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                  active ? "bg-primary text-primary-foreground" : "border border-border hover:border-primary/60"
                }`}
              >
                {isAr ? o.ar : o.en}
              </button>
            );
          })}
        </div>
      </div>

      {degree && (
        <>
          {signedIn ? (
            <p className="text-sm font-semibold">
              {t(
                `${reachable} من ${KOREA_SCHOLARSHIPS.length} منح مفتوحة لمستواك ومرحلتك.`,
                `${reachable} of ${KOREA_SCHOLARSHIPS.length} programmes are open to your level and stage.`,
              )}
            </p>
          ) : (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Lock className="h-4 w-4" aria-hidden="true" />
                {t(
                  `${reachable} من ${KOREA_SCHOLARSHIPS.length} منح تناسب مستواك`,
                  `${reachable} of ${KOREA_SCHOLARSHIPS.length} programmes fit your level`,
                )}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t(
                  "الأسماء والمعلومات الرسمية متاحة للجميع على صفحة المنح. أما أي منحة تناسبك بالتحديد، وكم يفصلك عنها، فتظهر في حسابك.",
                  "The names and the official facts are public on the scholarships page. Which one specifically is yours, and how far off it is, appears in your account.",
                )}
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {KOREA_SCHOLARSHIPS.map((programme) => {
              const row = rows.find((r) => r.id === programme.id);
              if (!row) return null;
              const status = STATUS_STYLE[row.status];
              return (
                <li key={programme.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{programme.name[isAr ? "ar" : "en"]}</span>
                    {signedIn ? (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}>
                        {isAr ? status.ar : status.en}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        {t("بعد التسجيل", "After sign-in")}
                      </span>
                    )}
                  </div>

                  {signedIn && (
                    <div className="mt-2 space-y-2">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        {row.monthsToLanguage === null ? (
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        ) : row.monthsToLanguage === 0 ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-klovers-green" aria-hidden="true" />
                        ) : (
                          <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {row.monthsToLanguage === null
                            ? t("لا يوجد مستوى محسوب بعد.", "No level to measure from yet.")
                            : row.monthsToLanguage === 0
                              ? t("اللغة ليست العقبة: ", "The language is not the obstacle: ")
                              : t(
                                  `يحتاج نحو ${row.monthsToLanguage} شهرًا من الدراسة للوصول إلى المستوى المطلوب. `,
                                  `About ${row.monthsToLanguage} months of study to reach the level asked for. `,
                                )}
                          {row.languageReason[isAr ? "ar" : "en"]}
                        </span>
                      </p>
                      {row.blockers[isAr ? "ar" : "en"].length > 0 && (
                        <ul className="space-y-1 ps-5">
                          {row.blockers[isAr ? "ar" : "en"].map((line) => (
                            <li key={line} className="list-disc text-xs text-muted-foreground">
                              {line}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-muted-foreground">
            {t(
              "«متاح لمستواك» تعني أن قواعد البرنامج نفسها لا تمنعك في هذه المرحلة — لا أنها قبول مضمون. الملف مطلوب في كل الحالات، وبعض البرامج تنافسية.",
              "“Open to you” means the programme's own rules do not stop you at this stage — not that you are accepted. Every programme needs a file, and some are competitive.",
            )}
          </p>

          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to={isAr ? "/ar/scholarships" : "/scholarships"}>
              {t("البرامج الستة بالتفصيل مع المصادر الرسمية", "All six programmes, with the official sources")}
            </Link>
          </Button>
        </>
      )}
    </section>
  );
};

export default ScholarshipMatches;
