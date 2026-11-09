import { Link } from "react-router-dom";
import { Sparkles, ShieldCheck, MessageCircle, Lock, X, Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSEO } from "@/hooks/useSEO";
import { SITE_URL } from "@/lib/siteConfig";

// PolyglotMatch — a distinct, dark "night mode" visual identity for the
// swipe-matching side of Language Exchange, shown as its own brand with a
// small "by Klovers" tag rather than folded into Klovers' yellow chrome.
// Deliberately does NOT use the global <Header>/<Footer>: this page is meant
// to read as its own product on first glance.
//
// This IS /exchange and /ar/exchange (9 Nov 2026, Re: "must be here") — the
// front door people land on. The actual swipe/match/chat app (unchanged) now
// lives one level down at /exchange/app, which every CTA on this page links
// to. /polyglotmatch redirects here so the short-lived standalone route
// doesn't become a dead or duplicate URL.
//
// Built from the "Midnight Match" design concept explored with Re; see the
// project doc claude/language-exchange-feature.md for context.

const PAGE_URL_EN = `${SITE_URL}/exchange`;
const PAGE_URL_AR = `${SITE_URL}/ar/exchange`;

const PolyglotMatchLandingPage = () => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  useSEO({
    title: isAr
      ? "PolyglotMatch — تطابق لغوي ليلي، من كلوفرز"
      : "PolyglotMatch — Language Exchange Matching, by Klovers",
    description: isAr
      ? "اسحب، تطابق، ومارس اللغة الليلة. تبادل لغوي سريع وآمن، بشخصيات رمزية بدل الصور، داخل كلوفرز."
      : "Swipe, match, and practice tonight. Fast, safe language-exchange matching with avatars instead of photos, inside Klovers.",
    canonical: isAr ? PAGE_URL_AR : PAGE_URL_EN,
    alternates: { en: PAGE_URL_EN, ar: PAGE_URL_AR },
  });

  const dir = isAr ? "rtl" : "ltr";

  const steps = [
    {
      n: "١",
      nEn: "1",
      title: isAr ? "جهّز ملفك" : "Build your profile",
      body: isAr
        ? "شخصية، اهتمامات، وما تبحث عنه — أقل من دقيقتين."
        : "Avatar, interests, and what you're looking for — under two minutes.",
      grad: "from-[#FF3EA5] to-[#8B5CF6]",
    },
    {
      n: "٢",
      nEn: "2",
      title: isAr ? "اسحب واكتشف" : "Swipe and discover",
      body: isAr
        ? "تصفّح ملفات متعلمين آخرين، وأعجب بمن يثير اهتمامك."
        : "Browse other learners' profiles and like the ones you connect with.",
      grad: "from-[#8B5CF6] to-[#22D3EE]",
    },
    {
      n: "٣",
      nEn: "3",
      title: isAr ? "دردش وتطابق" : "Chat and match",
      body: isAr
        ? "عند التطابق المتبادل، تُفتح المحادثة فورًا داخل كلوفرز."
        : "On a mutual like, the chat opens instantly inside Klovers.",
      grad: "from-[#22D3EE] to-[#FF3EA5]",
    },
  ];

  const safety = isAr
    ? [
        "العمر 16 سنة أو أكثر فقط",
        "لا ترسل أبدًا أموالًا أو كلمات مرور",
        "التقِ في مكان عام أولًا",
        "إبلاغ وحظر فوريّان، في أي وقت",
      ]
    : [
        "16+ only",
        "Never send money or passwords",
        "Meet in a public place first",
        "Report and block instantly, anytime",
      ];

  return (
    <div dir={dir} lang={isAr ? "ar" : "en"} className="min-h-screen bg-[#0C0A16] text-[#F3F1FA]">
      <style>{`
        .pm-display { font-family: 'Poppins', 'Cairo', sans-serif; }
        .pm-grad-text {
          background: linear-gradient(90deg,#FF3EA5,#8B5CF6,#22D3EE);
          -webkit-background-clip: text; background-clip: text; color: transparent;
          background-size: 200% auto;
          animation: pm-grad-shift 6s ease-in-out infinite;
        }
        @keyframes pm-grad-shift { 0%, 100% { background-position: 0% center; } 50% { background-position: 100% center; } }
        @keyframes pm-fade-up { 0% { opacity: 0; transform: translateY(14px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pm-float { 0%, 100% { transform: translateY(0) rotate(-1.5deg); } 50% { transform: translateY(-10px) rotate(1.5deg); } }
        .pm-fade-up { animation: pm-fade-up 0.6s cubic-bezier(0.2,0.8,0.2,1) both; }
        .pm-float { animation: pm-float 5s ease-in-out infinite; }
        .pm-hero-card { transition: transform 0.35s cubic-bezier(0.2,0.8,0.2,1); }
        .pm-hero-card:hover { transform: scale(1.035) rotate(0deg) !important; animation-play-state: paused; }
        .pm-step-card { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
        .pm-step-card:hover { transform: translateY(-6px); border-color: rgba(255,62,165,0.4); box-shadow: 0 20px 40px -20px rgba(139,92,246,0.5); }
        .pm-pill { transition: transform 0.2s ease, background-color 0.2s ease; }
        .pm-pill:hover { transform: translateY(-2px); background-color: rgba(255,255,255,0.1); }
      `}</style>

      {/* ambient glow */}
      <div className="pointer-events-none fixed -top-24 right-[-120px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,62,165,0.30),transparent_70%)] blur-xl" />
      <div className="pointer-events-none fixed top-[420px] left-[-160px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.22),transparent_70%)] blur-xl" />

      {/* NAV — pinned ltr so the logo always sits on the left, even in the
          Arabic/RTL layout (brand mark position shouldn't flip). */}
      <div dir="ltr" className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link to={isAr ? "/ar" : "/"} className="flex items-center gap-2.5" aria-label={isAr ? "العودة إلى كلوفرز" : "Back to Klovers"}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF3EA5] to-[#8B5CF6] text-lg font-extrabold">
            P
          </div>
          <div className="flex flex-col leading-tight">
            <span className="pm-display text-[19px] font-extrabold tracking-tight">PolyglotMatch</span>
            <span className="text-[11px] font-semibold text-[#A79FC9] hover:text-[#F3F1FA] transition">
              {isAr ? "من كلوفرز · by Klovers" : "by Klovers"}
            </span>
          </div>
        </Link>
        <Link
          to="/exchange/app"
          className="rounded-full bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] px-5 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5"
        >
          {isAr ? "ابدأ الماتش" : "Start matching"}
        </Link>
      </div>

      {/* HERO */}
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-14 px-6 pb-24 pt-8">
        <div className="min-w-0 flex-[999_1_420px]">
          <span className="pm-fade-up inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[13px] font-bold text-[#D9D4F0]">
            ⚡ {isAr ? "تطابق فوري" : "Instant matching"}
          </span>
          <h1 className="pm-display pm-fade-up mt-6 text-[36px] font-bold leading-[1.1] sm:text-[52px]" style={{ animationDelay: "80ms" }}>
            {isAr ? (
              <>
                اسحب. تطابق.
                <br />
                <span className="pm-grad-text">مارس اللغة الليلة.</span>
              </>
            ) : (
              <>
                Swipe. Match.
                <br />
                <span className="pm-grad-text">Practice tonight.</span>
              </>
            )}
          </h1>
          <p className="pm-fade-up mt-6 max-w-[520px] text-[19px] leading-[1.8] text-[#C3BEDB]" style={{ animationDelay: "160ms" }}>
            {isAr
              ? "أسرع طريقة تلاقي فيها شريك تبادل لغوي يناسبك فعلًا — اسحب يمينًا، كوّن تطابقًا، وابدأ الدردشة فورًا داخل كلوفرز."
              : "The fastest way to find a language-exchange partner who actually fits — swipe right, get a match, and start chatting instantly inside Klovers."}
          </p>
          <div className="pm-fade-up mt-8 flex flex-wrap gap-3.5" style={{ animationDelay: "240ms" }}>
            <Link
              to="/exchange/app"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] px-8 py-4 text-[17px] font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_-10px_rgba(255,62,165,0.6)]"
            >
              {isAr ? "جرّب الآن — مجانًا" : "Try it now — free"}
            </Link>
            <a
              href="#safety"
              className="inline-flex items-center justify-center rounded-full border-2 border-white/35 px-8 py-4 text-[17px] font-bold text-[#F3F1FA] transition hover:-translate-y-0.5 hover:border-white/60"
            >
              {isAr ? "آمن بتصميمه" : "Safe by design"}
            </a>
          </div>
        </div>

        <div className="flex min-w-[280px] flex-1 justify-center">
          <div className="pm-float pm-hero-card w-full max-w-[340px] overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#171329] shadow-[0_0_0_1px_rgba(255,62,165,0.25),0_20px_60px_-20px_rgba(139,92,246,0.45)]">
            <div className="flex h-[220px] items-center justify-center bg-gradient-to-br from-[#2A1F4D] via-[#512A6B] to-[#8B5CF6] text-6xl">
              🎧
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[17px] font-extrabold">{isAr ? "نور · 21" : "Nour · 21"}</div>
                  <div className="text-[13px] text-[#A79FC9]">
                    {isAr ? "تتعلم الكورية · كيبوب ودراما" : "Learning Korean · K-pop & dramas"}
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 px-3 py-1 text-[13px] font-bold text-[#7CE4F5]">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#22D3EE]" />
                  {isAr ? "متصلة الآن" : "Online now"}
                </span>
              </div>
              <div className="mt-5 flex gap-3">
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 py-3.5 transition hover:-translate-y-0.5 hover:border-[#FF3EA5]/40 hover:bg-[#FF3EA5]/10">
                  <X className="h-5 w-5" />
                </div>
                <div className="flex flex-1 items-center justify-center rounded-2xl bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] py-3.5 transition hover:-translate-y-0.5 hover:brightness-110">
                  <Heart className="h-5 w-5 fill-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRUST STRIP */}
      <div className="relative mx-auto flex max-w-6xl flex-wrap justify-center gap-3.5 px-6 pb-16">
        {(isAr
          ? ["🎭 شخصيات رمزية فقط — بدون صور", "🔒 محادثة مشفّرة داخل التطبيق", "🔞 16+ وإبلاغ بضغطة واحدة"]
          : ["🎭 Avatars only — no photos", "🔒 Encrypted in-app chat", "🔞 16+ with one-tap reporting"]
        ).map((pill) => (
          <span key={pill} className="pm-pill rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[13px] font-bold text-[#D9D4F0]">
            {pill}
          </span>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div className="relative mx-auto max-w-6xl px-6 pb-24">
        <h2 className="pm-display mb-12 text-center text-[26px] font-bold sm:text-[34px]">
          {isAr ? "ثلاث خطوات لماتش اليوم" : "Three steps to a match today"}
        </h2>
        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="pm-step-card pm-fade-up rounded-[22px] border border-white/[0.08] bg-[#171329] p-7"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.grad} font-extrabold`}>
                {isAr ? s.n : s.nEn}
              </div>
              <h3 className="mt-4 mb-2 text-[19px] font-bold">{s.title}</h3>
              <p className="text-[14.5px] leading-[1.8] text-[#A79FC9]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SAFETY */}
      <div id="safety" className="bg-[#120F22] px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FF3EA5]/30 bg-[#FF3EA5]/10 px-4 py-1.5 text-[13px] font-bold text-[#FF8FC8]">
            <ShieldCheck className="h-3.5 w-3.5" /> {isAr ? "جريء، لكن آمن دائمًا" : "Bold, always safe"}
          </span>
          <h2 className="pm-display mt-6 mb-8 text-[26px] font-bold sm:text-[32px]">
            {isAr ? "السرعة لا تعني التنازل عن الأمان" : "Fast doesn't mean compromising on safety"}
          </h2>
          <div className="grid gap-4 text-start sm:grid-cols-2">
            {safety.map((item) => (
              <div
                key={item}
                className="pm-step-card rounded-[22px] border border-white/[0.08] bg-[#171329] p-5 flex items-center gap-3"
              >
                <Lock className="h-4 w-4 shrink-0 text-[#A79FC9]" />
                <span className="text-[15px]">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="relative px-6 py-24 text-center">
        <h2 className="pm-display mb-4 text-[30px] font-bold sm:text-[40px]">
          <span className="pm-grad-text">{isAr ? "ماتشك القادم" : "Your next match"}</span>{" "}
          {isAr ? "على بُعد سحبة واحدة" : "is one swipe away"}
        </h2>
        <p className="mb-8 text-[16px] text-[#A79FC9]">
          {isAr ? "مجاني، وسريع، وآمن." : "Free, fast, and safe."}
        </p>
        <Link
          to="/exchange/app"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#FF3EA5] to-[#8B5CF6] px-12 py-[18px] text-[19px] font-bold text-white transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-12px_rgba(255,62,165,0.7)]"
        >
          <Sparkles className="h-5 w-5" />
          {isAr ? "ابدأ التطابق الآن" : "Start matching now"}
        </Link>
      </div>

      <div className="border-t border-white/[0.08] px-6 py-6 text-center text-[13px] text-[#7A7395]">
        <div className="flex items-center justify-center gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          {isAr ? "PolyglotMatch © ٢٠٢٦ — من كلوفرز · تبادل اللغة" : "PolyglotMatch © 2026 — by Klovers · Language Exchange"}
        </div>
      </div>
    </div>
  );
};

export default PolyglotMatchLandingPage;
