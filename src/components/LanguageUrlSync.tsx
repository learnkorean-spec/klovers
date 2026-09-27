import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { arabicTwinOf, isArabicUrl } from "@/lib/arabicRoutes";

/**
 * Keeps the URL and the display language in agreement on paired pages
 * (GEO-03, 27 Sep 2026). Renders nothing.
 *
 * LanguageProvider sits outside the router, so it only sees back/forward
 * (popstate). In-app links use pushState, which fires no event, so this
 * component - inside BrowserRouter - covers them:
 *   - an Arabic URL (/ar, /ar/pricing ...) always displays Arabic;
 *   - a visitor reading in Arabic who lands on, or follows a link to, a paired
 *     English URL (/, /pricing ...) is moved to its Arabic twin, in place
 *     (replace), so Back still works.
 */
const LanguageUrlSync = () => {
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    if (isArabicUrl(pathname)) {
      if (language !== "ar") setLanguage("ar");
      return;
    }
    if (language === "ar") {
      const twin = arabicTwinOf(pathname);
      if (twin) navigate(`${twin}${search}${hash}`, { replace: true });
    }
    // Deliberately not reacting to `language` alone: the toggle moves the URL
    // itself (LanguageContext.goTo) in the same event that changes language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
};

export default LanguageUrlSync;
