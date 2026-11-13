import { useState } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, X } from "lucide-react";
import { dashEvent } from "@/lib/dashboardEvents";

const KEY = "kl_exchange_announce_v1";

const COPY = {
  en: {
    badge: "New",
    title: "Language exchange is open",
    line: "Practise with a real partner. Free, and right here on Klovers.",
    cta: "Find a partner",
    dismiss: "Hide this announcement",
  },
  ar: {
    badge: "جديد",
    title: "تبادل اللغة متاح الآن",
    line: "تدرّب على المحادثة مع شريك حقيقي، مجانًا وداخل كلوفرز.",
    cta: "ابحث عن شريك",
    dismiss: "إخفاء هذا الإعلان",
  },
} as const;

const dismissed = () => {
  try {
    return !!localStorage.getItem(KEY);
  } catch {
    return false;
  }
};

/**
 * "Language exchange is open" — one slim line at the top of every student
 * dashboard (13 Nov 2026, Re: "add that you can exchange language now to
 * dashboards so more people join").
 *
 * The tabbed dashboard moved the full ExchangeEntryCard to the Explore tab,
 * which left the feature one tap further away. This puts the news itself on
 * the first screen of both dashboards (Korean and English track) without
 * bringing the tall card back. Colours are the exchange's own PolyglotMatch
 * palette (midnight ground, pink-to-violet action) from
 * PolyglotMatchLandingPage.tsx, not the teal of the older entry card: Re
 * asked for "the exchange color, not green". Dismissed per browser; bump the key's version
 * to announce again.
 */
export default function ExchangeAnnouncement({ isAr, surface }: { isAr: boolean; surface: "korean_dashboard" | "english_dashboard" }) {
  const [hidden, setHidden] = useState(dismissed);
  if (hidden) return null;
  const c = COPY[isAr ? "ar" : "en"];

  const hide = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* hides for this visit only */
    }
    dashEvent({ name: "exchange_announce_dismiss", surface });
    setHidden(true);
  };

  return (
    <aside
      aria-label={c.title}
      dir={isAr ? "rtl" : "ltr"}
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[#FF3EA5]/30 bg-[#171329] px-3 py-2.5 text-[#F3F1FA] sm:px-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FF3EA5] to-[#8B5CF6] text-white" aria-hidden="true">
        <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-[#F3F1FA]">
          <span className="me-1.5 inline-block rounded-full border border-[#FF3EA5]/40 bg-[#FF3EA5]/15 px-2 py-0.5 text-[11px] font-extrabold uppercase tracking-wide text-[#FF8FC8]">{c.badge}</span>
          {c.title}
        </p>
        <p className="mt-0.5 text-xs text-[#D9D4F0] sm:text-sm">{c.line}</p>
      </div>
      <Link
        to="/exchange/app"
        data-track="exchange_announce"
        onClick={() => dashEvent({ name: "exchange_announce_click", surface })}
        className="order-4 inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] px-4 sm:order-3 sm:w-auto text-sm font-bold text-white hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F3F1FA]"
      >
        {c.cta}
      </Link>
      <button
        type="button"
        onClick={hide}
        aria-label={c.dismiss}
        data-track="exchange_announce_dismiss"
        className="order-3 flex h-11 w-8 shrink-0 sm:order-4 items-center justify-center rounded-lg text-[#A79FC9] hover:text-[#F3F1FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F3F1FA]"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </aside>
  );
}
