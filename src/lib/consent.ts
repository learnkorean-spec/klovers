/**
 * Cookie consent (24 Sep 2026).
 *
 * GA4 and the Meta Pixel used to run before the visitor had made any choice,
 * under a banner that said "By continuing, you agree". index.html now sets
 * Google Consent Mode v2 to "denied" and revokes Pixel consent until the
 * visitor presses Accept; this module records the choice and tells both tags.
 *
 * Stored values are "granted" / "denied". The old banner stored "accepted"
 * for "Got it" on an implied-consent notice; that is deliberately NOT read as
 * consent, so those visitors are asked once more.
 *
 * index.html reads the same key before the tags load - keep the two in step.
 */
export const CONSENT_KEY = "cookie_consent";

export type ConsentChoice = "granted" | "denied";

declare global {
  interface Window {
    __klConsent?: ConsentChoice | null;
  }
}

/** The stored choice, or null when the visitor has not chosen yet. */
export function readConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    // Privacy mode can throw. Unknown means "not chosen": ask.
    return null;
  }
}

/** Store the choice and pass it to GA4 (Consent Mode) and the Meta Pixel. */
export function saveConsent(choice: ConsentChoice): void {
  try {
    localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    /* privacy mode - the choice still applies for this page load */
  }
  window.__klConsent = choice;
  window.gtag?.("consent", "update", {
    analytics_storage: choice,
    ad_storage: choice,
    ad_user_data: choice,
    ad_personalization: choice,
  });
  // The Pixel may not have loaded yet; index.html reads __klConsent when it does.
  window.fbq?.("consent", choice === "granted" ? "grant" : "revoke");
}
