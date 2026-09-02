import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { COURSE_CARDS, COURSE_SECTION_COPY } from "@/constants/courseCards";

/**
 * The public "choose your level" grid.
 *
 * Two things changed here on 2026-09-02:
 *
 *   • The copy now comes from `@/constants/courseCards`, which derives the
 *     level number, TOPIK band and CEFR band from `@/constants/levels`. It
 *     used to come from `translations.courses.items` — a hand-written array
 *     that had drifted, which is how the site came to say "Level 2 — TOPIK 2
 *     / A2". A level prepares a student toward a TOPIK band; it does not
 *     equal one. There are now nine cards (seven levels, two special
 *     tracks), not six.
 *
 *   • Every card is bookable. Each level links to /enroll-now?level=<key>,
 *     which EnrollNowPage reads and preselects. Before this, a student who
 *     had decided on a level had nowhere on this page to say so.
 */

/** One accent per card, keyed so adding a level cannot shift the palette. */
const CARD_ACCENT: Record<string, string> = {
  hangul: "bg-purple-500",
  l1: "bg-green-500",
  l2: "bg-blue-500",
  l3: "bg-teal-500",
  l4: "bg-orange-500",
  l5: "bg-red-500",
  l6: "bg-pink-500",
  reading_speaking: "bg-primary",
  topik_prep: "bg-amber-500",
};

const CoursesSection = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const c = COURSE_SECTION_COPY;

  return (
    <section id="courses" className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            {isAr ? c.badge_ar : c.badge_en}
          </Badge>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-4">
            {isAr ? c.title_ar : c.title_en}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isAr ? c.subtitle_ar : c.subtitle_en}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COURSE_CARDS.map((course) => {
            const features = isAr ? course.features_ar : course.features_en;
            return (
              <Card
                key={course.key}
                className="group flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden border-border hover:border-primary/50"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        CARD_ACCENT[course.key] ?? "bg-primary"
                      }`}
                    />
                    <span className="text-sm font-medium text-muted-foreground">
                      {isAr ? course.eyebrow_ar : course.eyebrow_en}
                    </span>
                  </div>
                  <CardTitle className="text-xl text-foreground">
                    {isAr ? course.title_ar : course.title_en}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {isAr ? course.blurb_ar : course.blurb_en}
                  </p>
                </CardHeader>

                <CardContent className="flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-foreground mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button asChild className="w-full mt-5 gap-2 font-semibold">
                    <Link to={course.href}>
                      {isAr ? course.cta_ar : course.cta_en}
                      <ArrowRight className={`h-4 w-4 ${isAr ? "rotate-180" : ""}`} />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* For anyone who cannot place themselves — the reason the grid used
            to end in a dead stop. */}
        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground mb-3">
            {isAr ? c.unsure_ar : c.unsure_en}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/placement-test">{isAr ? c.placement_ar : c.placement_en}</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/free-trial">{isAr ? c.trial_ar : c.trial_en}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
