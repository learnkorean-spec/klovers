import { useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "klovers-returning-banner-dismissed";

const ReturningStudentBanner = () => {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState(() =>
    Boolean(localStorage.getItem(STORAGE_KEY))
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white relative">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center pe-10">
        <div className="flex items-center gap-2 flex-wrap justify-center">
          <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            {t("returningStudents.banner.badge")}
          </span>
          <span className="text-sm font-medium">
            {t("returningStudents.banner.text")}
          </span>
        </div>
        <Link
          to="/placement-test"
          className="inline-flex items-center gap-1.5 bg-white text-amber-700 text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-amber-50 transition-colors shrink-0"
        >
          {t("returningStudents.banner.cta")}
        </Link>
      </div>
      <button
        onClick={handleDismiss}
        className="absolute end-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export default ReturningStudentBanner;
