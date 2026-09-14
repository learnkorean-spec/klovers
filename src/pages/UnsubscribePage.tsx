/**
 * /unsubscribe — the route two email senders have been linking to since before
 * it existed.
 *
 * `send-trial-broadcast` and `send-trial-interest-confirmation` both put
 * `https://kloversegy.com/unsubscribe?token=<uuid>` in the visible footer and
 * in the RFC 8058 `List-Unsubscribe` header. Nothing served that path, so the
 * click landed on the SPA's 404 and the flag was never set: the recipient
 * believes they opted out, and the next campaign arrives anyway. That is the
 * sequence that produces a spam complaint instead of an unsubscribe.
 *
 * WHY A REDIRECT AND NOT A FETCH
 * The work happens in the `unsubscribe-email` edge function, which owns the
 * only write to `profiles.email_unsubscribed`. It returns HTML and sets no
 * CORS headers whatsoever, so calling it with fetch() from this origin is
 * blocked by the browser before it reaches the server. Redirecting sidesteps
 * that without touching the function, and — more to the point — keeps ONE
 * implementation of opting out. Two would eventually disagree.
 *
 * The tradeoff is a visible hop to a *.supabase.co page. Acceptable: this is a
 * terminal action, not a place anyone browses from.
 */
import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { WHATSAPP_BASE } from "@/lib/siteConfig";

const FUNCTION_URL =
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unsubscribe-email`;

const UnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const lang = searchParams.get("lang") ?? "ar";

  useEffect(() => {
    if (!token) return;
    // replace(), not assign() — Back should not re-run the opt-out.
    window.location.replace(
      `${FUNCTION_URL}?token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`,
    );
  }, [token, lang]);

  const isAr = lang !== "en";

  // No token: someone typed the URL, or a mail client stripped the query
  // string. The edge function would answer "invalid or expired", which is
  // both wrong and alarming here — say what actually happened instead.
  if (!token) {
    return (
      <div
        dir={isAr ? "rtl" : "ltr"}
        className="min-h-screen flex items-center justify-center bg-muted/30 px-4"
      >
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <h1 className="text-lg font-bold text-foreground">
            {isAr ? "الرابط غير مكتمل" : "Incomplete link"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isAr
              ? "لإلغاء الاشتراك، افتح الرابط الموجود في أسفل الرسالة التي وصلتك مباشرة — لا تنسخه يدويًا."
              : "To unsubscribe, open the link at the bottom of the email you received directly rather than retyping it."}
          </p>
          {/*
            WHATSAPP_BASE, not a literal. This page carried 201288319463 while
            every other WhatsApp link in the app used 201010003084 — and this is
            the worst page to get wrong, because the person reading it is
            already trying to leave and the one button offered sent her to a
            stranger. Importing it means the next number change cannot leave
            this page behind again.
          */}
          <a
            href={WHATSAPP_BASE}
            className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {isAr ? "تواصل معنا على واتساب" : "Contact us on WhatsApp"}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-screen flex items-center justify-center bg-muted/30 px-4"
    >
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <div
          className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent"
          aria-hidden="true"
        />
        <span>{isAr ? "جارٍ إلغاء الاشتراك…" : "Unsubscribing…"}</span>
      </div>
    </div>
  );
};

export default UnsubscribePage;
