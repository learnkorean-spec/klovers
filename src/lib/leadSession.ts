// Persistent anonymous session id + UTM capture for lead attribution.
// Plain TS, no React. Safe in SSR (guards window).

const SESSION_KEY = "klovers_lead_session";
const ATTRIBUTION_KEY = "klovers_lead_attribution";

export interface LeadAttribution {
  campaign?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_content?: string;
  referrer?: string;
  gclid?: string;
}

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (RFC4122 v4 ish)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getSessionId(): string {
  if (!isBrowser()) return "00000000-0000-0000-0000-000000000000";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

/** Read utm_* from the current URL and persist alongside referrer. Call once on app mount. */
export function captureUtmFromUrl(): void {
  if (!isBrowser()) return;
  try {
    const params = new URLSearchParams(window.location.search);
    const incoming: LeadAttribution = {};
    const campaign = params.get("utm_campaign") || params.get("campaign");
    const source = params.get("utm_source");
    const medium = params.get("utm_medium");
    const content = params.get("utm_content");
    // gclid is what Google Ads appends when the account has "auto-tagging" on
    // — most Google Ads accounts do, and plenty never add utm_ params on top
    // of it. Without reading this, a paid Google click and an organic Google
    // click are both just referrer=google.com with nothing to tell them apart.
    const gclid = params.get("gclid");
    if (campaign) incoming.campaign = campaign;
    if (source) incoming.utm_source = source;
    if (medium) incoming.utm_medium = medium;
    if (content) incoming.utm_content = content;
    if (gclid) {
      incoming.gclid = gclid;
      // A gclid with no explicit utm_source means the click came through
      // Google Ads auto-tagging alone — still Google/cpc, just not spelled
      // out in the URL. Fill it in so this doesn't fall back to "no source".
      if (!incoming.utm_source) incoming.utm_source = "google";
      if (!incoming.utm_medium) incoming.utm_medium = "cpc";
    }

    const existingRaw = localStorage.getItem(ATTRIBUTION_KEY);
    const existing: LeadAttribution = existingRaw ? JSON.parse(existingRaw) : {};

    // Only overwrite when we actually got new utm values (preserve first-touch otherwise).
    const merged: LeadAttribution =
      Object.keys(incoming).length > 0 ? { ...existing, ...incoming } : existing;

    if (!merged.referrer && document.referrer && !document.referrer.includes(window.location.host)) {
      merged.referrer = document.referrer;
    }

    if (Object.keys(merged).length > 0) {
      localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(merged));
    }
  } catch {
    /* ignore */
  }
}

export function getAttribution(): LeadAttribution {
  if (!isBrowser()) return {};
  try {
    const raw = localStorage.getItem(ATTRIBUTION_KEY);
    return raw ? (JSON.parse(raw) as LeadAttribution) : {};
  } catch {
    return {};
  }
}
