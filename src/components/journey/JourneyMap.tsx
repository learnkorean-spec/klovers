import { useEffect, useState } from "react";

/**
 * The journey map, one component for every language site (Re, 18 Nov 2026:
 * "must be an idea like this in each website to hook and interact").
 * Klovers (Korea), maktub (Arabic world), Voca (English-speaking world) and
 * Buda (Hungary) each pass their own map, places and brand colours.
 *
 * Canon: languageJourney + wardrobeRule.clubyException in
 * src/config/klovers-world.ts. A marketing tease only: nothing here claims
 * or changes a learner's progress.
 *
 * A place is either a shape (`d`, a country) or a pin only (a city on a
 * one-country map). `small` shapes also get a pin so they can be clicked.
 * The chip list under the map is the keyboard / screen-reader / phone path.
 * Pictures: /assets/<imageDir>/<key>.webp (1200x800), made with the
 * travel-scene mode of /admin/ai-room-lab.
 *
 * Passport (Re, 18 Nov 2026: "continue", to hook and interact): every place
 * the visitor opens gets a stamp, a "Next stop" button walks to the next
 * unseen one, and the last stamp ends on the trial CTA. Stamps are a light
 * per-browser convenience in localStorage (one key per site). They are NOT
 * learning progress and never say so: story progress comes only from real
 * learning (canon).
 */

export interface JourneyFact {
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  /** Optional line in the language itself, shown above the value. */
  native?: string;
  nativeDir?: "rtl" | "ltr";
}

export interface JourneyPlace {
  key: string;
  en: string;
  ar: string;
  placeEn: string;
  placeAr: string;
  d?: string;
  cx: number;
  cy: number;
  small?: boolean;
  facts: JourneyFact[];
}

export interface JourneyTheme {
  bg: string;
  panel: string;
  otherLand: string;
  land: string;
  hover: string;
  selected: string;
  selectedText: string;
  kicker: string;
  cta: string;
  ctaText: string;
  headingFont?: string;
}

export interface JourneyMapProps {
  id?: string;
  isAr: boolean;
  tr: (en: string, ar: string) => string;
  theme: JourneyTheme;
  width: number;
  height: number;
  /** Neighbouring land, drawn behind. */
  otherLandPath: string;
  /** The single country, for one-country maps (Korea, Hungary). */
  homeLandPath?: string;
  places: JourneyPlace[];
  imageDir: string;
  kickerEn: string;
  kickerAr: string;
  titleEn: string;
  titleAr: string;
  introEn: string;
  introAr: string;
  ctaHref: string;
  ctaEn: string;
  ctaAr: string;
  mapLabelEn: string;
  mapLabelAr: string;
}

const JourneyMap = (p: JourneyMapProps) => {
  const { isAr, tr, theme: t } = p;
  const [selected, setSelected] = useState<string>(p.places[0].key);
  const [hover, setHover] = useState<string | null>(null);
  const storeKey = `klovers-journey-passport:${p.imageDir}`;
  const [visited, setVisited] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem(storeKey);
      const list = raw ? (JSON.parse(raw) as unknown) : [];
      return Array.isArray(list) ? list.filter((k): k is string => typeof k === "string") : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    setVisited((v) => (v.includes(selected) ? v : [...v, selected]));
  }, [selected]);
  useEffect(() => {
    try {
      window.localStorage.setItem(storeKey, JSON.stringify(visited));
    } catch {
      /* storage blocked: stamps just last for this visit */
    }
  }, [storeKey, visited]);
  const total = p.places.length;
  const stamped = p.places.filter((c) => visited.includes(c.key)).length;
  const done = stamped >= total;
  const nextStop = (() => {
    const i = p.places.findIndex((c) => c.key === selected);
    for (let n = 1; n <= total; n++) {
      const c = p.places[(i + n) % total];
      if (!visited.includes(c.key)) return c;
    }
    return p.places[(i + 1) % total];
  })();
  const current = p.places.find((c) => c.key === selected) ?? p.places[0];
  // Warm the next picture so "Next stop" flips without a blank frame.
  useEffect(() => {
    const img = new Image();
    img.src = `/assets/${p.imageDir}/${nextStop.key}.webp`;
  }, [p.imageDir, nextStop.key]);
  const heading = { fontFamily: t.headingFont ?? "Poppins, system-ui, sans-serif" };

  const shapeFill = (key: string) => (key === selected ? t.selected : key === hover ? t.hover : t.land);
  const pinFill = (key: string) => (key === selected ? t.selected : key === hover ? t.hover : t.kicker);

  const handlers = (key: string) => ({
    onClick: () => setSelected(key),
    onMouseEnter: () => setHover(key),
    onMouseLeave: () => setHover(null),
  });

  return (
    <section id={p.id ?? "journey"} className="py-20 border-b text-white scroll-mt-24" style={{ backgroundColor: t.bg }}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider" style={{ color: t.kicker }}>
            {tr(p.kickerEn, p.kickerAr)}
          </p>
          <h2 className="mt-2 text-3xl md:text-4xl font-extrabold" style={heading}>
            {tr(p.titleEn, p.titleAr)}
          </h2>
          <p className="mt-3 text-white/75 leading-relaxed">{tr(p.introEn, p.introAr)}</p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.25fr_1fr] items-start">
          <div className="rounded-3xl p-3 md:p-4" style={{ backgroundColor: t.panel }}>
            <svg
              viewBox={`0 0 ${p.width} ${p.height}`}
              className="w-full h-auto"
              role="group"
              aria-label={tr(p.mapLabelEn, p.mapLabelAr)}
            >
              <path d={p.otherLandPath} fill={t.otherLand} stroke={t.panel} strokeWidth={0.6} />
              {p.homeLandPath && <path d={p.homeLandPath} fill={t.land} stroke={t.panel} strokeWidth={1} />}
              {p.places
                .filter((c) => c.d)
                .map((c) => (
                  <path
                    key={c.key}
                    d={c.d}
                    fill={shapeFill(c.key)}
                    stroke={t.panel}
                    strokeWidth={0.8}
                    className="cursor-pointer transition-colors duration-150"
                    {...handlers(c.key)}
                  >
                    <title>{isAr ? c.ar : c.en}</title>
                  </path>
                ))}
              {p.places
                .filter((c) => !c.d || c.small)
                .map((c) => (
                  <g key={`pin-${c.key}`} className="cursor-pointer" {...handlers(c.key)}>
                    <circle cx={c.cx} cy={c.cy} r={c.key === selected ? 12 : 9} fill={pinFill(c.key)} stroke={t.panel} strokeWidth={2.5} />
                    <circle cx={c.cx} cy={c.cy} r={3} fill={t.panel} pointerEvents="none" />
                    <title>{isAr ? c.ar : c.en}</title>
                  </g>
                ))}
            </svg>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.kicker }}>
                {tr("Passport", "جواز السفر")}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={total}
                aria-valuenow={stamped}
                aria-label={tr("Places visited", "الأماكن التي زرتها")}
              >
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(stamped / total) * 100}%`, backgroundColor: t.selected }} />
              </div>
              <span className="text-xs tabular-nums text-white/80">
                {stamped}/{total}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2" role="list">
              {p.places.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="listitem"
                  aria-pressed={c.key === selected}
                  onClick={() => setSelected(c.key)}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
                  style={
                    c.key === selected
                      ? { backgroundColor: t.selected, color: t.selectedText }
                      : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.85)" }
                  }
                >
                  {visited.includes(c.key) && c.key !== selected && <span aria-hidden="true">✓ </span>}
                  {isAr ? c.ar : c.en}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white text-[#1A1A1A] shadow-xl" aria-live="polite">
            <div className="relative aspect-[3/2] bg-neutral-100">
              <img
                key={current.key}
                src={`/assets/${p.imageDir}/${current.key}.webp`}
                alt={tr(
                  `Adam, Lina and Cluby in ${current.en} (${current.placeEn}), in traditional dress`,
                  `آدم ولينا وكلوبي في ${current.ar} (${current.placeAr}) بالزي التقليدي`,
                )}
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-6">
              <p className="text-sm text-[#1A1A1A]/60">{isAr ? current.placeAr : current.placeEn}</p>
              <h3 className="mt-1 text-2xl font-bold" style={heading}>
                {isAr ? current.ar : current.en}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
                {current.facts.map((f) => (
                  <div key={f.labelEn}>
                    <dt className="text-[#1A1A1A]/60">{tr(f.labelEn, f.labelAr)}</dt>
                    <dd className="mt-1 font-semibold">
                      {f.native && (
                        <span className="block" dir={f.nativeDir ?? "ltr"}>
                          {f.native}
                        </span>
                      )}
                      <span className={f.native ? "block text-[#1A1A1A]/60 font-normal" : ""}>
                        {isAr ? f.valueAr : f.valueEn}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
              {done && (
                <p className="mt-5 rounded-2xl bg-neutral-100 p-4 text-sm leading-relaxed">
                  {tr(
                    `Every stamp collected: you have seen all ${total} stops with Adam, Lina and Cluby. The real trip starts with your first class.`,
                    `جمعت كل الأختام: شاهدت المحطات الـ${total} كلها مع آدم ولينا وكلوبي. الرحلة الحقيقية تبدأ بأول حصة.`,
                  )}
                </p>
              )}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={p.ctaHref}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold"
                  style={{ backgroundColor: t.cta, color: t.ctaText }}
                >
                  {tr(p.ctaEn, p.ctaAr)}
                </a>
                {!done && (
                  <button
                    type="button"
                    onClick={() => setSelected(nextStop.key)}
                    className="inline-flex items-center justify-center rounded-full border border-[#1A1A1A]/20 px-6 py-3 text-sm font-semibold hover:bg-neutral-100"
                  >
                    {tr(`Next stop: ${nextStop.en}`, `المحطة التالية: ${nextStop.ar}`)} {isAr ? "←" : "→"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyMap;
