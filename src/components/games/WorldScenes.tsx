/**
 * The painted scenes on /games, drawn as inline SVG.
 *
 * Inline on purpose: they ship with the bundle, need no image request, stay
 * sharp at any width, and live in version control as reviewable code rather
 * than as binaries. Every scene is decorative (aria-hidden) - the text beside
 * it carries the meaning.
 *
 * Each scene fills its box (`slice`), anchored to the bottom, so the ground
 * line stays under the characters that stand on it at every width.
 */

interface SceneProps {
  className?: string;
}

const PETALS: [number, number, number][] = [
  [60, 40, 0], [118, 70, 30], [210, 28, 60], [262, 92, 15], [330, 52, 45],
  [372, 120, 70], [150, 118, 20], [300, 150, 50], [40, 150, 80], [238, 180, 10],
];

/** Hero: a palace courtyard at golden hour, cherry trees on both sides. */
export const PalaceScene = ({ className }: SceneProps) => (
  <svg
    viewBox="0 0 400 260"
    preserveAspectRatio="xMidYMax slice"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <defs>
      <linearGradient id="ps-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFE3A3" />
        <stop offset="0.65" stopColor="#FFD0B8" />
        <stop offset="1" stopColor="#F9C3C3" />
      </linearGradient>
      <linearGradient id="ps-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#EBD7AE" />
        <stop offset="1" stopColor="#D9BF8E" />
      </linearGradient>
    </defs>

    <rect width="400" height="260" fill="url(#ps-sky)" />
    <circle cx="300" cy="62" r="30" fill="#FFF3C4" />
    <circle cx="300" cy="62" r="22" fill="#FFE9A0" />

    {/* Far mountains */}
    <path d="M0 150 L50 105 L95 135 L150 85 L210 130 L260 95 L320 135 L370 100 L400 120 L400 180 L0 180 Z" fill="#C8B4D6" />
    <path d="M0 165 L60 130 L120 158 L185 118 L250 155 L310 125 L400 150 L400 190 L0 190 Z" fill="#AE9CC4" />

    {/* Palace wall */}
    <rect x="0" y="176" width="400" height="18" fill="#B8453A" />
    <rect x="0" y="172" width="400" height="6" fill="#3B3B46" />

    {/* Main hall */}
    <g>
      <rect x="120" y="186" width="160" height="10" fill="#CFC6B8" />
      <rect x="110" y="194" width="180" height="10" fill="#BDB2A2" />
      <rect x="138" y="138" width="124" height="50" fill="#F2E6CF" />
      {[146, 170, 194, 218, 242].map((x) => (
        <rect key={x} x={x} y="138" width="8" height="50" fill="#B83A2E" />
      ))}
      <rect x="158" y="152" width="10" height="36" fill="#7A2A22" opacity="0.35" />
      <rect x="206" y="152" width="10" height="36" fill="#7A2A22" opacity="0.35" />
      <rect x="132" y="128" width="136" height="12" fill="#2E7D6B" />
      <rect x="132" y="126" width="136" height="3" fill="#E4B94A" />
      {/* Lower roof, sweeping eaves */}
      <path d="M96 128 Q120 122 140 112 L260 112 Q280 122 304 128 Q282 130 262 124 L138 124 Q118 130 96 128 Z" fill="#34343F" />
      {/* Upper roof */}
      <rect x="152" y="96" width="96" height="16" fill="#F2E6CF" />
      {[160, 186, 212, 236].map((x) => (
        <rect key={x} x={x} y="96" width="5" height="16" fill="#B83A2E" />
      ))}
      <rect x="148" y="92" width="104" height="6" fill="#2E7D6B" />
      <path d="M120 94 Q146 88 162 76 L238 76 Q254 88 280 94 Q260 96 242 90 L158 90 Q140 96 120 94 Z" fill="#34343F" />
      <rect x="160" y="72" width="80" height="5" rx="2" fill="#2A2A33" />
    </g>

    {/* Side pavilion */}
    <g>
      <rect x="44" y="158" width="52" height="24" fill="#F2E6CF" />
      {[48, 66, 86].map((x) => (
        <rect key={x} x={x} y="158" width="5" height="24" fill="#B83A2E" />
      ))}
      <path d="M28 160 Q42 156 52 148 L88 148 Q98 156 112 160 Q98 161 88 157 L52 157 Q42 161 28 160 Z" fill="#34343F" />
    </g>

    {/* Ground and path */}
    <rect x="0" y="200" width="400" height="60" fill="url(#ps-ground)" />
    <path d="M170 204 L230 204 L270 260 L130 260 Z" fill="#F4E7C8" />

    {/* Cherry tree, left */}
    <g>
      <path d="M24 260 Q30 214 18 186 M26 216 Q46 196 60 188" stroke="#6B4632" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[[14, 176, 26], [44, 168, 24], [66, 184, 20], [0, 204, 20], [34, 196, 18]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#F29BB4" : "#F7B9CB"} />
      ))}
    </g>

    {/* Cherry tree, right */}
    <g>
      <path d="M372 260 Q366 212 380 180 M370 214 Q350 194 334 186" stroke="#6B4632" strokeWidth="7" fill="none" strokeLinecap="round" />
      {[[382, 168, 28], [350, 176, 22], [330, 192, 18], [400, 200, 22], [360, 198, 18]].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill={i % 2 ? "#F7B9CB" : "#F29BB4"} />
      ))}
    </g>

    {/* Falling petals */}
    {PETALS.map(([x, y, rot], i) => (
      <ellipse key={i} cx={x} cy={y} rx="3.2" ry="1.8" fill="#F29BB4" transform={`rotate(${rot} ${x} ${y})`} opacity="0.85" />
    ))}
  </svg>
);

/** Hangul Village: hanok roofs on green hills, letters in the air. */
export const VillageScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
    <rect width="320" height="140" fill="#DDF0F4" />
    <circle cx="262" cy="30" r="14" fill="#FFF1B3" />
    <path d="M0 96 Q60 62 120 88 Q190 56 250 84 Q290 70 320 80 L320 140 L0 140 Z" fill="#A9D59A" />
    <path d="M0 112 Q80 90 160 108 Q240 92 320 104 L320 140 L0 140 Z" fill="#86C07A" />
    {/* Hanok 1 */}
    <rect x="30" y="92" width="58" height="22" fill="#F4EAD5" />
    <rect x="36" y="98" width="12" height="16" fill="#8A5A3C" />
    <rect x="58" y="98" width="22" height="9" fill="#E0CFA9" />
    <path d="M18 94 Q30 90 38 82 L80 82 Q88 90 100 94 Q88 95 80 91 L38 91 Q30 95 18 94 Z" fill="#3B3B46" />
    {/* Hanok 2 */}
    <rect x="222" y="98" width="64" height="22" fill="#F4EAD5" />
    <rect x="262" y="104" width="12" height="16" fill="#8A5A3C" />
    <rect x="230" y="104" width="24" height="9" fill="#E0CFA9" />
    <path d="M208 100 Q222 96 230 88 L278 88 Q286 96 300 100 Q286 101 278 97 L230 97 Q222 101 208 100 Z" fill="#3B3B46" />
    {/* Floating letters */}
    <g fontFamily="'Noto Sans KR', sans-serif" fontWeight="800" fill="#2E2E2E" opacity="0.8">
      <text x="120" y="42" fontSize="20">ㄱ</text>
      <text x="168" y="30" fontSize="16">ㅎ</text>
      <text x="198" y="56" fontSize="18">ㅏ</text>
      <text x="92" y="66" fontSize="14">ㄴ</text>
    </g>
  </svg>
);

/** Vocabulary Market: striped stalls, lanterns, fruit crates. */
export const MarketScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
    <rect width="320" height="140" fill="#FFE9C7" />
    <path d="M0 26 Q80 40 160 26 Q240 40 320 26" stroke="#2E2E2E" strokeWidth="1.5" fill="none" />
    {[40, 100, 160, 220, 280].map((x, i) => (
      <g key={x}>
        <line x1={x} y1={i % 2 ? 33 : 30} x2={x} y2={i % 2 ? 40 : 37} stroke="#2E2E2E" strokeWidth="1.5" />
        <ellipse cx={x} cy={i % 2 ? 48 : 45} rx="8" ry="10" fill="#D8412F" />
        <rect x={x - 4} y={i % 2 ? 36 : 33} width="8" height="3" fill="#2E2E2E" />
      </g>
    ))}
    {/* Stall left */}
    <rect x="14" y="84" width="130" height="40" fill="#B98556" />
    <path d="M8 70 L150 70 L144 86 L14 86 Z" fill="#FCFD01" />
    {[22, 50, 78, 106, 134].map((x) => (
      <path key={x} d={`M${x} 70 L${x + 14} 70 L${x + 12} 86 L${x - 2} 86 Z`} fill="#2E2E2E" />
    ))}
    {[[36, "#E9462F"], [58, "#F29A1F"], [80, "#6DB33F"], [102, "#E9462F"], [124, "#F29A1F"]].map(([x, c], i) => (
      <circle key={i} cx={x as number} cy="96" r="7" fill={c as string} />
    ))}
    {/* Stall right */}
    <rect x="176" y="84" width="130" height="40" fill="#A8744A" />
    <path d="M170 70 L312 70 L306 86 L176 86 Z" fill="#FFF9EC" />
    {[184, 212, 240, 268, 296].map((x) => (
      <path key={x} d={`M${x} 70 L${x + 14} 70 L${x + 12} 86 L${x - 2} 86 Z`} fill="#D8412F" />
    ))}
    {[[196, "#F7D26B"], [220, "#8CC152"], [244, "#F7D26B"], [268, "#E9462F"], [292, "#8CC152"]].map(([x, c], i) => (
      <rect key={i} x={(x as number) - 8} y="90" width="16" height="12" rx="3" fill={c as string} />
    ))}
    <rect x="0" y="124" width="320" height="16" fill="#E2C79C" />
  </svg>
);

/** Conversation Café: a warm window seat with Namsan Tower outside. */
export const CafeScene = ({ className }: SceneProps) => (
  <svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false">
    <rect width="320" height="140" fill="#F3E2CB" />
    {/* Window */}
    <rect x="30" y="18" width="150" height="82" rx="6" fill="#BFE0F0" stroke="#7A5638" strokeWidth="5" />
    <line x1="105" y1="18" x2="105" y2="100" stroke="#7A5638" strokeWidth="4" />
    <path d="M34 92 Q70 70 104 84 Q140 64 176 80 L176 98 L34 98 Z" fill="#9CC98E" />
    <rect x="133" y="40" width="4" height="36" fill="#6E6E7A" />
    <ellipse cx="135" cy="42" rx="7" ry="4" fill="#6E6E7A" />
    <line x1="135" y1="30" x2="135" y2="38" stroke="#6E6E7A" strokeWidth="2" />
    {/* Hanging lamps */}
    {[220, 272].map((x) => (
      <g key={x}>
        <line x1={x} y1="0" x2={x} y2="26" stroke="#2E2E2E" strokeWidth="1.5" />
        <path d={`M${x - 12} 38 Q${x} 20 ${x + 12} 38 Z`} fill="#FCFD01" stroke="#2E2E2E" strokeWidth="1.5" />
        <circle cx={x} cy="40" r="3" fill="#FFF3C4" />
      </g>
    ))}
    {/* Menu board */}
    <rect x="206" y="52" width="84" height="44" rx="4" fill="#2E2E2E" />
    <g fontFamily="'Noto Sans KR', sans-serif" fill="#FFF9EC" fontSize="9" fontWeight="700">
      <text x="216" y="68">커피</text>
      <text x="216" y="82">라떼</text>
      <text x="254" y="68">차</text>
      <text x="254" y="82">빵</text>
    </g>
    {/* Counter + cups */}
    <rect x="0" y="108" width="320" height="32" fill="#9C6B45" />
    <rect x="0" y="104" width="320" height="6" fill="#B98556" />
    {[70, 150, 250].map((x) => (
      <g key={x}>
        <path d={`M${x - 9} 90 L${x + 9} 90 L${x + 7} 104 L${x - 7} 104 Z`} fill="#FFF9EC" stroke="#2E2E2E" strokeWidth="1.5" />
        <path d={`M${x + 9} 94 q6 2 0 7`} stroke="#2E2E2E" strokeWidth="1.5" fill="none" />
        <path d={`M${x - 3} 86 q-3 -5 0 -9 M${x + 3} 86 q-3 -5 0 -9`} stroke="#B9A48C" strokeWidth="1.5" fill="none" />
      </g>
    ))}
  </svg>
);

export const WORLD_SCENES = {
  hangul_village: VillageScene,
  vocabulary_market: MarketScene,
  conversation_cafe: CafeScene,
} as const;
