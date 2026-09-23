// ── Tracking utility ──────────────────────────────────────────────────────
// Wraps Meta Pixel (fbq) and GA4 (gtag) so callers don't need guard checks.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
  }
}

// Meta Pixel events
export const track = {
  /** Visitor views a page (auto-fired by Pixel base code, but call for SPAs) */
  pageView() {
    window.fbq?.("track", "PageView");
  },

  /**
   * A lead: something the visitor chose to do (see LeadSource in
   * leadTracking.ts).
   *
   * 23 Sep 2026: GA4 used to receive a bare `generate_lead` with no
   * parameters for EVERY lead - a hero click, a WhatsApp tap and a completed
   * trial booking were indistinguishable in GA4. It now receives `gaParams`
   * (lead_source, cta_label, language, page_path from logLeadEvent), or at
   * least the lead_source taken from `content_name`.
   *
   * The Meta Pixel payload is unchanged - `data` goes to fbq exactly as before.
   *
   * A completed trial booking (content_name "trial_booked", sent by
   * TrialBookingPage's success screen) also raises `booking_completed`, so the
   * funnel's last step is its own GA4 event rather than one more
   * generate_lead.
   */
  lead(data?: Record<string, unknown>, gaParams?: Record<string, unknown>) {
    window.fbq?.("track", "Lead", data);
    const params = gaParams ?? (data?.content_name ? { lead_source: data.content_name } : undefined);
    if (params) window.gtag?.("event", "generate_lead", params);
    else window.gtag?.("event", "generate_lead");
    if (data?.content_name === "trial_booked") {
      window.gtag?.("event", "booking_completed", {
        language: typeof document !== "undefined" ? document.documentElement.lang || undefined : undefined,
        trial_date: data.trial_date,
      });
    }
  },

  /** User created an account */
  completeRegistration() {
    window.fbq?.("track", "CompleteRegistration");
    window.gtag?.("event", "sign_up");
  },

  /** User reached checkout / payment page */
  initiateCheckout(data?: { value?: number; currency?: string }) {
    window.fbq?.("track", "InitiateCheckout", data);
    window.gtag?.("event", "begin_checkout", {
      currency: data?.currency ?? "USD",
      value: data?.value ?? 0,
    });
  },

  /** Payment submitted (Egypt manual upload or Stripe) */
  purchase(data?: { value?: number; currency?: string }) {
    window.fbq?.("track", "Purchase", {
      value: data?.value ?? 0,
      currency: data?.currency ?? "USD",
    });
    window.gtag?.("event", "purchase", {
      currency: data?.currency ?? "USD",
      value: data?.value ?? 0,
    });
  },

  /** Custom funnel events (Meta: trackCustom, GA4: event) */
  custom(eventName: string, params?: Record<string, unknown>) {
    window.fbq?.("trackCustom", eventName, params);
    window.gtag?.("event", eventName, params);
  },

  /**
   * GA4-only event. For things worth measuring that are not ad signals -
   * a language switch, a pricing page view - so Meta's optimisation is not
   * fed events it would read as intent.
   */
  ga(eventName: string, params?: Record<string, unknown>) {
    window.gtag?.("event", eventName, params);
  },
};
