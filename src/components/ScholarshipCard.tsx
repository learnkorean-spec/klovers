import { ExternalLink } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { SCHOLARSHIP_KINDS, type Scholarship } from "@/constants/koreaScholarships";

/**
 * One scholarship card, shared by the homepage section and /scholarships, so a
 * fact can only ever be corrected in one place.
 *
 * The card never prints an amount the funding body has not published itself:
 * `figures` is only set where one official page states the number, and
 * otherwise the card shows the guideline note and the link (see
 * src/constants/koreaScholarships.ts for the verification behind that rule).
 */
const ScholarshipCard = ({ item, t }: { item: Scholarship; t: (s: string, k?: string) => string }) => {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const lang = isAr ? "ar" : "en";
  const kind = SCHOLARSHIP_KINDS.find((k) => k.id === item.kinds[0]);

  return (
    <article className="flex h-full flex-col gap-4 rounded-3xl bg-ivory p-5 text-charcoal sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {kind && (
          <span className="rounded-full bg-klovers-yellow px-3 py-1 text-xs font-bold text-charcoal">
            {kind.label[lang]}
          </span>
        )}
        <span className="text-xs font-semibold text-charcoal/55">{item.provider[lang]}</span>
      </div>

      <h3 className="text-lg font-extrabold leading-snug sm:text-xl">{item.name[lang]}</h3>

      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-charcoal/55">
          {t("scholarships", "covers")}
        </p>
        <ul className="mt-2 space-y-1.5">
          {item.covers[lang].map((line) => (
            <li key={line} className="flex gap-2 text-sm leading-relaxed text-charcoal/85">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-klovers-yellow" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>

      {item.figures ? (
        <div className="rounded-2xl bg-klovers-yellow/25 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-charcoal/60">
            {t("scholarships", "figures")}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-charcoal/85">{item.figures[lang]}</p>
        </div>
      ) : (
        <p className="rounded-2xl border border-charcoal/10 bg-charcoal/[0.04] p-3 text-xs leading-relaxed text-charcoal/70">
          {t("scholarships", "amountUnconfirmed")}
        </p>
      )}

      <div className="space-y-3 border-t border-charcoal/10 pt-4">
        {[
          { label: t("scholarships", "eligibility"), body: item.eligibility[lang] },
          { label: t("scholarships", "language"), body: item.language[lang] },
          { label: t("scholarships", "timeline"), body: item.timeline[lang] },
        ].map((row) => (
          <div key={row.label}>
            <p className="text-xs font-bold uppercase tracking-wide text-charcoal/55">{row.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-charcoal/80">{row.body}</p>
          </div>
        ))}
      </div>

      {item.note && (
        <p className="rounded-2xl border border-klovers-yellow bg-klovers-yellow/15 p-3 text-sm leading-relaxed text-charcoal/85">
          <span className="font-bold">{t("scholarships", "note")}: </span>
          {item.note[lang]}
        </p>
      )}

      <div className="mt-auto space-y-3 pt-2">
        <p className="text-sm leading-relaxed text-charcoal/70">
          <span className="font-bold text-charcoal/80">{t("scholarships", "whoFor")}: </span>
          {item.whoFor[lang]}
        </p>
        <Button asChild variant="outline" className="h-11 w-full gap-2 rounded-full border-charcoal/25 text-charcoal">
          <a href={item.officialUrl} target="_blank" rel="noopener noreferrer">
            {t("scholarships", "official")}
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </article>
  );
};

export default ScholarshipCard;
