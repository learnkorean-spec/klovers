/**
 * The painted scenery on /games, drawn as inline SVG.
 *
 * Inline on purpose: no image requests, sharp at any width, and reviewable as
 * code. Every scene is decorative (aria-hidden) - the text beside it carries
 * the meaning. The PEOPLE are never drawn here: the boy, the girl and Cluby are
 * Klovers' own character art, placed on top by GameWorldsHub.
 *
 * The look follows the 23 Sep 2026 mockup: cream sky, soft pastel palace and
 * city, cherry blossom painted as overlapping blurred blooms.
 */

import type { ReactNode } from "react";

interface SceneProps {
  className?: string;
}

/** A soft, painted-looking cherry blossom cluster. */
const Bloom = ({ x, y, s = 1, id }: { x: number; y: number; s?: number; id: string }) => {
  const dots: [number, number, number, string][] = [
    [0, 0, 26, "#F9C6D3"], [-22, 8, 20, "#F4A9BD"], [22, 6, 22, "#F7B8C8"],
    [-10, -18, 18, "#FBD5DF"], [14, -16, 18, "#F6B3C5"], [-28, -8, 14, "#FAD0DB"],
    [30, -6, 14, "#F29BB4"], [4, 18, 18, "#F4A9BD"], [-14, 22, 12, "#F7BFCD"],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} filter={`url(#${id})`}>
      {dots.map(([dx, dy, r, c], i) => (
        <circle key={i} cx={dx} cy={dy} r={r} fill={c} opacity={0.92} />
      ))}
    </g>
  );
};

const SoftBlur = ({ id, amount = 1.2 }: { id: string; amount?: number }) => (
  <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur stdDeviation={amount} />
  </filter>
);

/** A curved Korean roof, drawn from its ridge width and position. */
const Roof = ({ x, y, w, h = 14, color = "#3A3A48" }: { x: number; y: number; w: number; h?: number; color?: string }) => (
  <path
    d={`M${x - w * 0.18} ${y + h} Q${x + w * 0.05} ${y + h * 0.7} ${x + w * 0.1} ${y} L${x + w * 0.9} ${y} Q${x + w * 0.95} ${y + h * 0.7} ${x + w * 1.18} ${y + h} Q${x + w * 0.95} ${y + h * 1.05} ${x + w * 0.88} ${y + h * 0.72} L${x + w * 0.12} ${y + h * 0.72} Q${x + w * 0.05} ${y + h * 1.05} ${x - w * 0.18} ${y + h} Z`}
    fill={color}
  />
);

const PETALS: [number, number, number][] = [
  [120, 60, 0], [300, 40, 30], [520, 90, 60], [700, 30, 15], [860, 120, 45],
  [980, 70, 70], [420, 150, 20], [640, 170, 50], [220, 190, 80], [760, 210, 10],
  [1040, 170, 35], [560, 40, 65],
];

/** The hero banner: Seoul at dawn - Namsan Tower, the city, a palace gate, blossoms. */
export const BannerScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 1200 360" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="bn-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF6DE" />
        <stop offset="0.7" stopColor="#FFEFD9" />
        <stop offset="1" stopColor="#FCE6DA" />
      </linearGradient>
      <linearGradient id="bn-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F6E7C9" />
        <stop offset="1" stopColor="#EFD9B2" />
      </linearGradient>
      <SoftBlur id="bn-soft" amount={1.4} />
      <SoftBlur id="bn-far" amount={2.2} />
    </defs>

    <rect width="1200" height="360" fill="url(#bn-sky)" />
    {/* clouds */}
    <g fill="#FFFFFF" opacity="0.8" filter="url(#bn-far)">
      <ellipse cx="260" cy="70" rx="90" ry="18" />
      <ellipse cx="620" cy="50" rx="120" ry="20" />
      <ellipse cx="960" cy="90" rx="100" ry="16" />
    </g>

    {/* Namsan and the tower */}
    <path d="M360 300 Q470 170 600 300 Z" fill="#CFE3C9" filter="url(#bn-far)" />
    <g opacity="0.85">
      <rect x="474" y="92" width="8" height="120" fill="#B9B7C6" />
      <rect x="466" y="120" width="24" height="12" rx="4" fill="#A9A7BA" />
      <ellipse cx="478" cy="138" rx="18" ry="7" fill="#C3C1D2" />
      <rect x="476" y="70" width="4" height="24" fill="#9C9AB0" />
    </g>

    {/* far city */}
    <g fill="#E3DDEA" filter="url(#bn-far)">
      {[[300, 250, 30, 60], [340, 230, 24, 80], [380, 255, 34, 55], [640, 240, 28, 70], [680, 220, 22, 90], [720, 250, 36, 60], [770, 235, 26, 75]].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} rx="2" />
      ))}
    </g>

    {/* palace gate, right */}
    <g>
      <rect x="760" y="296" width="330" height="18" fill="#D9CDBB" />
      <rect x="790" y="210" width="270" height="88" fill="#E9DCC6" />
      {[800, 900, 1000].map((x) => (
        <path key={x} d={`M${x + 20} 298 L${x + 20} 262 Q${x + 40} 238 ${x + 60} 262 L${x + 60} 298 Z`} fill="#7B4A3A" />
      ))}
      <rect x="810" y="176" width="230" height="36" fill="#F3E9D6" />
      {[818, 862, 906, 950, 994, 1030].map((x) => (
        <rect key={x} x={x} y="176" width="7" height="36" fill="#C0473A" />
      ))}
      <rect x="804" y="168" width="242" height="10" fill="#3F8C78" />
      <rect x="804" y="166" width="242" height="3" fill="#E7BD55" />
      <Roof x={804} y={144} w={242} h={26} />
      <rect x="846" y="118" width="158" height="28" fill="#F3E9D6" />
      {[852, 894, 936, 978, 996].map((x) => (
        <rect key={x} x={x} y="118" width="5" height="28" fill="#C0473A" />
      ))}
      <rect x="842" y="112" width="166" height="8" fill="#3F8C78" />
      <Roof x={842} y={90} w={166} h={24} />
    </g>

    {/* ground */}
    <rect x="0" y="300" width="1200" height="60" fill="url(#bn-ground)" />

    {/* blossoms: left corner, right edge, a low branch */}
    <path d="M0 40 Q80 70 150 60 M0 120 Q60 110 110 130" stroke="#8B5E45" strokeWidth="6" fill="none" strokeLinecap="round" />
    <Bloom x={30} y={30} s={1.3} id="bn-soft" />
    <Bloom x={110} y={60} s={1.1} id="bn-soft" />
    <Bloom x={60} y={120} s={1} id="bn-soft" />
    <Bloom x={170} y={40} s={0.8} id="bn-soft" />
    <path d="M1200 60 Q1130 100 1090 90 M1200 170 Q1150 190 1120 180" stroke="#8B5E45" strokeWidth="6" fill="none" strokeLinecap="round" />
    <Bloom x={1170} y={50} s={1.3} id="bn-soft" />
    <Bloom x={1100} y={92} s={1} id="bn-soft" />
    <Bloom x={1160} y={170} s={1.1} id="bn-soft" />
    <Bloom x={720} y={110} s={0.7} id="bn-soft" />
    <Bloom x={760} y={90} s={0.6} id="bn-soft" />

    {PETALS.map(([x, y, rot], i) => (
      <ellipse key={i} cx={x} cy={y} rx="5" ry="2.6" fill="#F29BB4" transform={`rotate(${rot} ${x} ${y})`} opacity="0.8" />
    ))}
  </svg>
);

/** Card header: Hangul Village - a hanok gate among blossoms. Calm on the left for the title. */
export const VillageScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="vs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFF4E6" />
        <stop offset="1" stopColor="#FDE3E6" />
      </linearGradient>
      <SoftBlur id="vs-soft" />
    </defs>
    <rect width="400" height="160" fill="url(#vs-sky)" />
    <path d="M150 140 Q260 90 400 120 L400 160 L150 160 Z" fill="#DDEBCF" />
    <g>
      <rect x="236" y="82" width="120" height="50" fill="#F3E9D6" />
      {[244, 280, 316, 344].map((x) => (
        <rect key={x} x={x} y="82" width="6" height="50" fill="#C0473A" />
      ))}
      <rect x="232" y="76" width="128" height="8" fill="#3F8C78" />
      <Roof x={232} y={56} w={128} h={22} />
      <rect x="284" y="104" width="26" height="28" fill="#7B4A3A" />
    </g>
    <Bloom x={380} y={30} s={1.1} id="vs-soft" />
    <Bloom x={220} y={24} s={0.9} id="vs-soft" />
    <Bloom x={200} y={120} s={0.7} id="vs-soft" />
    <g fontFamily="'Noto Sans KR', sans-serif" fontWeight="800" fill="#6D5A7B" opacity="0.55">
      <text x="300" y="36" fontSize="16">ㄱ</text>
      <text x="330" y="52" fontSize="12">ㅎ</text>
    </g>
  </svg>
);

/** Card header: Vocabulary Market - a stall with lanterns and a sign. */
export const MarketScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="ms-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#F0FAEE" />
        <stop offset="1" stopColor="#FFF3DC" />
      </linearGradient>
    </defs>
    <rect width="400" height="160" fill="url(#ms-sky)" />
    <path d="M200 20 Q300 34 400 20" stroke="#6B5B4B" strokeWidth="1.5" fill="none" />
    {[230, 290, 350].map((x, i) => (
      <g key={x}>
        <line x1={x} y1={i === 1 ? 27 : 24} x2={x} y2={i === 1 ? 32 : 29} stroke="#6B5B4B" strokeWidth="1.5" />
        <ellipse cx={x} cy={i === 1 ? 40 : 37} rx="8" ry="10" fill="#E0503B" />
      </g>
    ))}
    <rect x="228" y="62" width="120" height="20" rx="3" fill="#8B5E45" />
    <text x="288" y="77" textAnchor="middle" fontFamily="'Noto Sans KR', sans-serif" fontWeight="800" fontSize="12" fill="#FFF3DC">맛있는 하루</text>
    <path d="M210 84 L380 84 L372 102 L218 102 Z" fill="#FFFFFF" />
    {[218, 250, 282, 314, 346].map((x) => (
      <path key={x} d={`M${x} 84 L${x + 16} 84 L${x + 14} 102 L${x - 2} 102 Z`} fill="#E0503B" />
    ))}
    <rect x="220" y="102" width="152" height="46" fill="#C99A6E" />
    {[[236, "#F29A1F"], [256, "#E9462F"], [276, "#8CC152"], [296, "#F7D26B"], [316, "#E9462F"], [336, "#8CC152"], [356, "#F29A1F"]].map(([x, c], i) => (
      <circle key={i} cx={x as number} cy="114" r="8" fill={c as string} />
    ))}
    <rect x="0" y="148" width="400" height="12" fill="#EAD7B5" />
  </svg>
);

/** Card header: Conversation Café - lavender café front with a sign and lamps. */
export const CafeScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax slice" className={className} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EEEAFB" />
        <stop offset="1" stopColor="#E3DBF7" />
      </linearGradient>
    </defs>
    <rect width="400" height="160" fill="url(#cs-sky)" />
    {[250, 310].map((x) => (
      <g key={x}>
        <line x1={x} y1="0" x2={x} y2="20" stroke="#4A4458" strokeWidth="1.5" />
        <path d={`M${x - 11} 30 Q${x} 14 ${x + 11} 30 Z`} fill="#FFD76A" />
        <circle cx={x} cy="32" r="3" fill="#FFF3C4" />
      </g>
    ))}
    <rect x="330" y="14" width="64" height="92" rx="6" fill="#3F3A4D" />
    <g fontFamily="'Noto Sans KR', sans-serif" fontWeight="700" fontSize="11" fill="#FFF9EC">
      <text x="342" y="36">좋은</text>
      <text x="342" y="54">대화가</text>
      <text x="342" y="72">좋은 하루</text>
      <text x="342" y="90">만듭니다</text>
    </g>
    <rect x="210" y="48" width="112" height="72" rx="4" fill="#FFF6E8" stroke="#8B5E45" strokeWidth="4" />
    <line x1="266" y1="48" x2="266" y2="120" stroke="#8B5E45" strokeWidth="3" />
    <rect x="200" y="120" width="200" height="40" fill="#A8744A" />
    <rect x="200" y="116" width="200" height="6" fill="#C99A6E" />
    {[230, 290].map((x) => (
      <g key={x}>
        <path d={`M${x - 8} 102 L${x + 8} 102 L${x + 6} 116 L${x - 6} 116 Z`} fill="#FFFFFF" stroke="#4A4458" strokeWidth="1.2" />
        <path d={`M${x - 2} 98 q-3 -5 0 -9 M${x + 3} 98 q-3 -5 0 -9`} stroke="#B9A48C" strokeWidth="1.3" fill="none" />
      </g>
    ))}
  </svg>
);

export const WORLD_SCENES = {
  hangul_village: VillageScene,
  vocabulary_market: MarketScene,
  conversation_cafe: CafeScene,
} as const;

/* ── Journey stops: small buildings, one per world ───────────────────── */

const StopFrame = ({ children, className }: { children: ReactNode; className?: string }) => (
  <svg viewBox="0 0 140 100" className={className} aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const GateStop = ({ className }: SceneProps) => (
  <StopFrame className={className}>
    <ellipse cx="70" cy="94" rx="60" ry="5" fill="#E9DCC0" />
    <rect x="30" y="50" width="80" height="44" fill="#E9DCC6" />
    <path d="M58 94 L58 72 Q70 60 82 72 L82 94 Z" fill="#7B4A3A" />
    <rect x="36" y="36" width="68" height="16" fill="#F3E9D6" />
    {[40, 58, 76, 94].map((x) => <rect key={x} x={x} y="36" width="4" height="16" fill="#C0473A" />)}
    <rect x="32" y="32" width="76" height="5" fill="#3F8C78" />
    <Roof x={32} y={16} w={76} h={18} />
    <circle cx="18" cy="70" r="12" fill="#CFE3C9" />
    <circle cx="124" cy="66" r="14" fill="#F7B8C8" />
  </StopFrame>
);

export const MarketStop = ({ className }: SceneProps) => (
  <StopFrame className={className}>
    <ellipse cx="70" cy="94" rx="60" ry="5" fill="#E9DCC0" />
    <rect x="38" y="10" width="64" height="14" rx="2" fill="#8B5E45" />
    <text x="70" y="21" textAnchor="middle" fontFamily="'Noto Sans KR', sans-serif" fontWeight="800" fontSize="9" fill="#FFF3DC">맛있는 하루</text>
    <path d="M22 30 L118 30 L112 46 L28 46 Z" fill="#FFFFFF" />
    {[28, 46, 64, 82, 100].map((x) => <path key={x} d={`M${x} 30 L${x + 9} 30 L${x + 8} 46 L${x - 1} 46 Z`} fill="#E0503B" />)}
    <rect x="30" y="46" width="80" height="48" fill="#C99A6E" />
    {[[42, "#F29A1F"], [56, "#E9462F"], [70, "#8CC152"], [84, "#F7D26B"], [98, "#E9462F"]].map(([x, c], i) => (
      <circle key={i} cx={x as number} cy="58" r="6" fill={c as string} />
    ))}
    <rect x="36" y="68" width="68" height="4" fill="#A8744A" />
  </StopFrame>
);

export const CafeStop = ({ className }: SceneProps) => (
  <StopFrame className={className}>
    <ellipse cx="70" cy="94" rx="60" ry="5" fill="#E9DCC0" />
    <rect x="26" y="40" width="88" height="54" fill="#E3D5C2" />
    <path d="M18 42 L122 42 L112 24 L28 24 Z" fill="#8B5E45" />
    <rect x="44" y="12" width="52" height="14" rx="2" fill="#3F3A4D" />
    <text x="70" y="23" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="9" fill="#FFF3DC">CAFÉ</text>
    <rect x="34" y="52" width="30" height="24" fill="#FFF3C4" stroke="#8B5E45" strokeWidth="2" />
    <rect x="76" y="54" width="26" height="40" fill="#7B4A3A" />
    <path d="M112 78 L128 78 L126 92 L114 92 Z" fill="#FFFFFF" stroke="#4A4458" strokeWidth="1.2" />
    <path d="M118 74 q-3 -5 0 -9 M123 74 q-3 -5 0 -9" stroke="#B9A48C" strokeWidth="1.3" fill="none" />
  </StopFrame>
);

export const WORLD_STOPS = {
  hangul_village: GateStop,
  vocabulary_market: MarketStop,
  conversation_cafe: CafeStop,
} as const;
