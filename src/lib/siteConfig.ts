// ─── Site-wide configuration constants ───────────────────────────────────────
// Change these in ONE place and they propagate everywhere.

export const WHATSAPP_NUMBER = "201010003084"; // Update this if your number changes
export const WHATSAPP_BASE = `https://wa.me/${WHATSAPP_NUMBER}`;

export const CONTACT_EMAIL = "kloversegy@gmail.com";
export const SITE_URL = "https://kloversegy.com";
export const ENROLL_URL = `${SITE_URL}/enroll-now`;

export const RETURNING_STUDENT_CODE = "KLOVERSOLDSTUDENT1";

// The number students in Egypt send Vodafone Cash / Fawry / InstaPay
// transfers to for anything paid manually (course bundles, and the shop's
// manual-payment option when a card isn't wanted or Stripe isn't available).
export const MANUAL_PAY_NUMBER = "+20 101 000 3084";

// Temporarily disable trial-confirmation emails while admin reorganizes
// existing trial leads. Flip back to `true` when ready to resume notifying
// students on confirm.
export const TRIAL_CONFIRMATION_EMAIL_ENABLED = false;
