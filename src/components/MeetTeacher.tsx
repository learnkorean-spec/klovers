import { useLanguage } from "@/contexts/LanguageContext";
import { Users, BookOpen, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import rehamPhoto from "@/assets/reham-teacher.jpg";

const highlightIcons = [Users, BookOpen, Award];

const MeetTeacher = () => {
  const { t, tArray } = useLanguage();
  const highlights = tArray("teacher", "highlights") as { label: string; description: string }[];

  return (
    <section className="py-28 bg-background overflow-hidden">
      <div className="container mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-primary/15 text-primary text-xs font-bold tracking-[0.2em] uppercase px-5 py-2 rounded-full mb-5">
            Our Educators
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
            {t("teacher", "title")}
          </h2>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">

          {/* Photo column */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Yellow glow backdrop */}
              <div className="absolute -inset-6 rounded-3xl bg-primary/10 blur-3xl" />
              {/* Decorative yellow border offset */}
              <div className="absolute -bottom-4 -right-4 w-full h-full rounded-3xl border-2 border-primary/40" />
              {/* Photo card */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-primary/20 w-72 md:w-80 lg:w-96">
                <img
                  src={rehamPhoto}
                  alt={t("teacher", "name")}
                  className="w-full aspect-[3/4] object-cover object-top"
                />
                {/* Name overlay at bottom */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-6 py-5">
                  <p className="text-white font-bold text-lg leading-tight">{t("teacher", "name")}</p>
                  <p className="text-primary text-sm font-semibold mt-0.5">Lead Korean Instructor</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text column */}
          <div className="flex flex-col gap-8">

            {/* Bio */}
            <div className="space-y-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              <p className="text-foreground font-medium">{t("teacher", "bio1")}</p>
              <p>{t("teacher", "bio2")}</p>
              <p>{t("teacher", "bio3")}</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {highlights.map((item, index) => {
                const Icon = highlightIcons[index];
                return (
                  <div
                    key={index}
                    className="group flex flex-col items-center text-center bg-muted/50 hover:bg-primary/10 border border-border hover:border-primary/40 rounded-2xl p-4 md:p-5 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/15 group-hover:bg-primary/25 flex items-center justify-center mb-3 transition-colors">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-foreground font-extrabold text-lg md:text-xl leading-none">
                      {item.label}
                    </span>
                    <span className="text-muted-foreground text-xs md:text-sm mt-1 leading-snug">
                      {item.description}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Team note */}
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed border-l-2 border-primary pl-4 italic">
              {t("teacher", "bio4")}
            </p>

            {/* CTA */}
            <div className="pt-2">
              <Button size="lg" asChild className="gap-2 text-base font-bold h-12 px-8">
                <Link to="/enroll-now">
                  Start Learning Today
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default MeetTeacher;
