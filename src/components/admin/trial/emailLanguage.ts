/**
 * Which language to WRITE a student's email in.
 *
 * Distinct from `class_language`, which says which group they would join. A
 * student on the English track is learning Korean through English; that is a
 * choice about the class, not a statement that they cannot read Arabic. An
 * Egyptian number is good evidence they would rather be written to in Arabic,
 * and getting this wrong in the generous direction costs nothing — so the rule
 * changes the language of the letter and never the class being offered.
 */

/** Egyptian mobile: +20 / 0020 / 20 followed by 1[0125] and 8 digits, or the bare local 01X form. */
export function isEgyptianPhone(phone: string | null | undefined): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return false;
  return /^(?:0020|20)1[0125]\d{8}$/.test(digits) || /^01[0125]\d{8}$/.test(digits);
}

export interface LanguageSubject {
  class_language?: string | null;
  phone?: string | null;
}

/**
 * The ISO code the email template expects: "ar" or "en".
 *
 * Arabic when the student is on the Arabic track, or when their number is
 * Egyptian. Everything else stays English.
 */
export function emailLanguageFor(b: LanguageSubject): "ar" | "en" {
  const raw = b.class_language ?? "";
  if (raw === "arabic" || raw === "ar") return "ar";
  if (isEgyptianPhone(b.phone)) return "ar";
  return "en";
}
