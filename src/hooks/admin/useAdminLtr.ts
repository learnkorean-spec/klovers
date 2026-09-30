import { useEffect } from "react";

/**
 * The admin screens are written in English, so they always read left to right —
 * whatever language the public site was last shown in (1 Oct 2026: the Today
 * screen came up right-to-left after the site had been viewed in Arabic, with
 * full stops jumping to the start of lines).
 *
 * LanguageProvider sets <html dir> from the site language. It sits above the
 * router and its effect runs after ours on first load, so a one-off write here
 * would be overwritten. Instead we hold <html> at ltr/en while an admin screen
 * is mounted (this also covers dialogs, menus and toasts, which render outside
 * the admin tree), and hand it back to the site language when leaving.
 */
export const useAdminLtr = () => {
  useEffect(() => {
    const html = document.documentElement;
    const hold = () => {
      if (html.dir !== "ltr") html.dir = "ltr";
      if (html.lang !== "en") html.lang = "en";
    };
    hold();
    const watcher = new MutationObserver(hold);
    watcher.observe(html, { attributes: true, attributeFilter: ["dir", "lang"] });

    return () => {
      watcher.disconnect();
      let siteLang = "en";
      try {
        siteLang = localStorage.getItem("k-lovers-lang") === "ar" ? "ar" : "en";
      } catch {
        /* privacy mode — fall back to English */
      }
      html.dir = siteLang === "ar" ? "rtl" : "ltr";
      html.lang = siteLang;
    };
  }, []);
};
