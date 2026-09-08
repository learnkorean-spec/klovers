import type { ReactNode } from "react";

/**
 * The artwork for the four WhyLearnKorean cards, kept out of the component so
 * the component stays about behaviour and this file stays about pictures.
 *
 * Re asked for pictures of Korea on the cards. Stock photography would mean
 * putting images whose licence nobody here has checked on the homepage of a
 * real business, so these are original drawings: a hanok academy on a spring
 * morning, the Seoul skyline at dusk, a palace gate in the golden hour, and a
 * pavilion under the moon with blossom.
 *
 * Drawn as one set - four times of day across one day, the same 200x240 frame,
 * the same three-plane composition (sky, ridgeline, subject) - so the row
 * reads as a series rather than four clip-art picks.
 *
 * A note for whoever edits a roof: the Korean roof shape is a MASS, not an
 * arc. It is drawn as a closed crescent whose ends lift, over a separate
 * building body. The first version stroked a thin curve instead and the cards
 * came out looking like bus shelters over pyramids - Egypt, not Korea.
 *
 * Every gradient id is prefixed `klv-` because these all render in the same
 * document; two `#sky` defs on one page silently take each other's colours.
 */
export const scenery: Record<string, ReactNode> = {
  // 학업 - a hanok academy, spring morning
  study: (
    <>
      <defs>
        <linearGradient id="klv-sky-study" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7FB9E4" /><stop offset="55%" stopColor="#C7E0F2" /><stop offset="100%" stopColor="#EDF2E4" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#klv-sky-study)" />
      <circle cx="154" cy="44" r="17" fill="#FFF6CF" opacity="0.9" />
      <path d="M0 152 Q40 118 84 148 Q126 176 200 136 V240 H0Z" fill="#9CC0A6" />
      <path d="M0 180 Q56 150 118 176 Q160 193 200 168 V240 H0Z" fill="#6B9A7C" />
      <path d="M0 208 H200 V240 H0Z" fill="#4E755E" />
      <rect x="62" y="186" width="76" height="30" fill="#E7DAC0" />
      <rect x="62" y="186" width="76" height="4" fill="#C6B597" />
      <rect x="88" y="194" width="24" height="22" fill="#7A6244" />
      <rect x="70" y="194" width="10" height="10" fill="#B9A480" />
      <rect x="120" y="194" width="10" height="10" fill="#B9A480" />
      <path d="M36 192 C56 168 76 160 100 160 C124 160 144 168 164 192 C148 182 124 176 100 176 C76 176 52 182 36 192 Z" fill="#3A454E" />
      <path d="M36 192 C52 184 76 178 100 178 C124 178 148 184 164 192 L160 196 C144 189 122 184 100 184 C78 184 56 189 40 196 Z" fill="#5A6872" />
      <rect x="58" y="214" width="84" height="4" fill="#8E8570" />
      <path d="M26 216 V196" stroke="#4A3B2A" strokeWidth="3.4" />
      <path d="M12 198 L26 170 L40 198 Z M16 180 L26 156 L36 180 Z" fill="#2C5741" />
      <path d="M172 216 V200" stroke="#4A3B2A" strokeWidth="3" />
      <path d="M162 202 L172 180 L182 202 Z" fill="#2C5741" />
    </>
  ),
  // 경력 - the Seoul skyline at dusk
  career: (
    <>
      <defs>
        <linearGradient id="klv-sky-career" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#15205A" /><stop offset="48%" stopColor="#6B4A87" /><stop offset="78%" stopColor="#E0794F" /><stop offset="100%" stopColor="#F4B26A" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#klv-sky-career)" />
      <circle cx="46" cy="168" r="15" fill="#FFD79A" opacity="0.9" />
      <circle cx="150" cy="40" r="2" fill="#FFFFFF" opacity="0.7" /><circle cx="172" cy="66" r="1.6" fill="#FFFFFF" opacity="0.6" />
      <circle cx="120" cy="30" r="1.6" fill="#FFFFFF" opacity="0.6" /><circle cx="30" cy="52" r="1.8" fill="#FFFFFF" opacity="0.5" />
      <path d="M0 176 Q40 158 78 172 Q120 187 200 164 V240 H0Z" fill="#2B2350" opacity="0.75" />
      <g fill="#171B33">
        <rect x="4" y="186" width="20" height="54" /><rect x="28" y="166" width="16" height="74" />
        <rect x="48" y="196" width="18" height="44" /><rect x="70" y="176" width="22" height="64" />
        <rect x="96" y="202" width="15" height="38" /><rect x="115" y="188" width="12" height="52" />
        <rect x="176" y="192" width="20" height="48" />
        <path d="M152 240 V196 h6 v44 Z" />
        <path d="M144 196 L155 166 L166 196 Z" />
        <rect x="153" y="150" width="3.5" height="18" />
      </g>
      <g fill="#FFD87A" opacity="0.85">
        <rect x="9" y="192" width="3" height="4" /><rect x="16" y="200" width="3" height="4" /><rect x="9" y="210" width="3" height="4" />
        <rect x="33" y="174" width="3" height="4" /><rect x="38" y="186" width="3" height="4" /><rect x="33" y="200" width="3" height="4" />
        <rect x="75" y="184" width="3" height="4" /><rect x="83" y="196" width="3" height="4" /><rect x="75" y="210" width="3" height="4" />
        <rect x="180" y="200" width="3" height="4" /><rect x="187" y="212" width="3" height="4" />
        <rect x="150" y="178" width="10" height="3" />
      </g>
    </>
  ),
  // 여행 - a palace gate in the golden hour
  travel: (
    <>
      <defs>
        <linearGradient id="klv-sky-travel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F8D593" /><stop offset="50%" stopColor="#EE9E62" /><stop offset="100%" stopColor="#D2624C" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#klv-sky-travel)" />
      <circle cx="60" cy="80" r="20" fill="#FFF1C6" opacity="0.7" />
      <path d="M0 150 L22 124 L38 140 L62 104 L82 132 L104 112 L128 146 L152 122 L176 148 L200 132 V240 H0Z" fill="#B9705A" opacity="0.8" />
      <path d="M0 176 L30 150 L54 172 L84 144 L112 172 L140 152 L168 178 L200 160 V240 H0Z" fill="#8A4750" />
      <path d="M0 206 H200 V240 H0Z" fill="#5C2C38" />
      <rect x="54" y="196" width="92" height="22" fill="#3A1C26" />
      <rect x="48" y="216" width="104" height="6" fill="#2A1219" />
      <path d="M84 218 V204 A16 16 0 0 1 116 204 V218 Z" fill="#170A10" />
      <path d="M34 200 C58 176 78 168 100 168 C122 168 142 176 166 200 C146 190 124 184 100 184 C76 184 54 190 34 200 Z" fill="#33161F" />
      <path d="M56 172 C72 156 86 150 100 150 C114 150 128 156 144 172 C128 165 114 161 100 161 C86 161 72 165 56 172 Z" fill="#33161F" />
      <rect x="76" y="172" width="48" height="14" fill="#4A2029" />
      <circle cx="62" cy="192" r="3" fill="#F5C86E" /><circle cx="138" cy="192" r="3" fill="#F5C86E" />
    </>
  ),
  // 문화 - a pavilion under the moon, with blossom
  culture: (
    <>
      <defs>
        <linearGradient id="klv-sky-culture" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0C1436" /><stop offset="58%" stopColor="#2B2158" /><stop offset="100%" stopColor="#5B3A63" />
        </linearGradient>
      </defs>
      <rect width="200" height="240" fill="url(#klv-sky-culture)" />
      <circle cx="146" cy="56" r="20" fill="#F6EDD0" />
      <circle cx="138" cy="50" r="4" fill="#E4D8B4" opacity="0.5" /><circle cx="152" cy="64" r="3" fill="#E4D8B4" opacity="0.4" />
      <g fill="#FFFFFF">
        <circle cx="30" cy="40" r="1.7" opacity="0.8" /><circle cx="62" cy="26" r="1.3" opacity="0.6" />
        <circle cx="94" cy="52" r="1.5" opacity="0.7" /><circle cx="22" cy="82" r="1.2" opacity="0.5" />
        <circle cx="182" cy="104" r="1.4" opacity="0.6" /><circle cx="120" cy="20" r="1.2" opacity="0.5" />
      </g>
      <path d="M0 168 Q50 142 104 166 Q152 186 200 158 V240 H0Z" fill="#1A1440" />
      <path d="M0 210 H200 V240 H0Z" fill="#120E2C" />
      <g fill="#0A0820">
        <path d="M94 196 C114 174 132 166 150 166 C168 166 186 174 200 196 C184 187 168 182 150 182 C132 182 110 187 94 196 Z" />
        <rect x="104" y="194" width="94" height="4" />
        <rect x="112" y="198" width="6" height="22" /><rect x="170" y="198" width="6" height="22" />
        <rect x="98" y="218" width="100" height="5" />
      </g>
      <path d="M0 188 C26 186 48 176 66 158 C78 146 90 140 102 138" stroke="#3B2A3F" strokeWidth="3.4" fill="none" strokeLinecap="round" />
      <path d="M26 184 L34 172 M52 170 L60 158 M80 148 L88 138" stroke="#3B2A3F" strokeWidth="2.2" strokeLinecap="round" />
      <g fill="#F5B3C8">
        <circle cx="34" cy="169" r="4" /><circle cx="41" cy="175" r="3.4" /><circle cx="27" cy="176" r="3" />
        <circle cx="60" cy="155" r="4" /><circle cx="67" cy="161" r="3.4" /><circle cx="53" cy="162" r="3" />
        <circle cx="88" cy="135" r="4" /><circle cx="95" cy="141" r="3.4" /><circle cx="81" cy="142" r="3" />
        <circle cx="14" cy="190" r="3" opacity="0.85" /><circle cx="104" cy="132" r="3" opacity="0.85" />
      </g>
    </>
  ),
};
