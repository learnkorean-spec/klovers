import { useEffect } from "react";

interface SEOProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  type?: "website" | "article";
  noindex?: boolean;
}

const BASE_URL = "https://kloversegy.com";
const SITE_NAME = "Klovers | Korean Lovers Academy";
const DEFAULT_IMAGE = `${BASE_URL}/klovers-logo.jpg`;
const DEFAULT_DESC =
  "Learn Korean online with Klovers — Korean Lovers Academy. Interactive lessons, games, placement tests, and certified instructors.";

export const useSEO = ({
  title,
  description = DEFAULT_DESC,
  canonical,
  ogImage = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
}: SEOProps) => {
  useEffect(() => {
    const fullTitle = `${title} | Klovers`;

    // Title
    document.title = fullTitle;

    const setMeta = (selector: string, attr: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };

    // Robots (noindex for private pages)
    const robotsMeta = document.querySelector('meta[name="robots"]');
    if (robotsMeta) robotsMeta.setAttribute("content", noindex ? "noindex, nofollow" : "index, follow");

    // Standard meta
    setMeta('meta[name="description"]', "content", description);

    // Open Graph
    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:type"]', "content", type);
    setMeta('meta[property="og:image"]', "content", ogImage);
    if (canonical) setMeta('meta[property="og:url"]', "content", canonical);

    // Twitter
    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    // Canonical link tag
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement("link");
      canonicalEl.rel = "canonical";
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical || `${BASE_URL}${window.location.pathname}`;

    // Cleanup: restore defaults on unmount
    return () => {
      document.title = SITE_NAME;
      setMeta('meta[name="description"]', "content", DEFAULT_DESC);
    };
  }, [title, description, canonical, ogImage, type]);
};
