/**
 * The backdrop for LearningRoadmap, kept out of the component so that file
 * stays about the ladder and this one stays about pictures - the same split
 * whyLearnKoreanScenes.tsx uses.
 *
 * Re's mockup puts the ladder in a scene: soft hills on one side, a hanok
 * eave and a cherry branch on the other, petals drifting between them.
 *
 * DRAWN, NOT PHOTOGRAPHED. Every fill is a palette token at low opacity, so
 * the section gains a setting without gaining a colour, an HTTP request, or
 * a provenance question. It is also the only way this survives a palette
 * change: retune Mint and this retunes with it.
 *
 * THE OPACITIES ARE TUNED FOR IVORY, NOT FOR BOTH GROUNDS. On the dark theme
 * the same tints stop reading as a scene and start reading as stains - the
 * Blush cloud becomes a brown smear, the Mint hills a murky band. Hence the
 * dark:opacity-25 on the wrapper. If you add a layer, check both themes with
 * the header's toggle; it is not a detail you can reason your way to.
 *
 * Everything is aria-hidden and pointer-events-none. If you add to it, keep
 * opacities under ~0.5 - a card has to stay readable on top of it.
 */

const PETAL_ANGLES = [0, 72, 144, 216, 288];

/** One five-petal blossom, Blush with a yellow centre. */
const Blossom = ({ x, y, s = 1, o = 0.8 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    {PETAL_ANGLES.map((a) => (
      <circle
        key={a}
        cx={Math.cos((a * Math.PI) / 180) * 5.6}
        cy={Math.sin((a * Math.PI) / 180) * 5.6}
        r="4.4"
        fill="hsl(var(--peach))"
      />
    ))}
    <circle r="2.2" fill="hsl(var(--klovers-yellow))" />
  </g>
);

export const RoadmapScenery = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 overflow-hidden dark:opacity-25"
  >
    {/* Hills, low on the start side. Two layers so the ridge reads as depth
        rather than as one flat shape. */}
    <svg
      viewBox="0 0 600 240"
      fill="none"
      className="absolute bottom-[-1rem] start-[-5rem] h-56 w-[34rem] md:h-72 md:w-[44rem]"
    >
      <path
        d="M0 240V148c72-58 144-16 214 26s150 28 208-28 112-40 178-4v98z"
        fill="hsl(var(--mint))"
        opacity="0.3"
      />
      <path
        d="M0 240v-50c92-44 184 8 274 30s202 4 326-26v46z"
        fill="hsl(var(--mint))"
        opacity="0.48"
      />
    </svg>

    {/* A single cloud, high on the start side. */}
    <svg viewBox="0 0 200 70" fill="none" className="absolute top-10 start-[-2rem] h-16 w-48">
      <g fill="hsl(var(--peach))" opacity="0.34">
        <ellipse cx="52" cy="42" rx="44" ry="18" />
        <ellipse cx="92" cy="32" rx="30" ry="15" />
      </g>
    </svg>

    {/* Hanok eave and blossom branch, high on the end side. The roof is
        Charcoal at 13% rather than a colour of its own - a silhouette, not
        an illustration competing with the cards. */}
    <svg
      viewBox="0 0 300 240"
      fill="none"
      className="absolute top-[-1rem] end-[-3rem] h-60 w-72 md:h-80 md:w-96"
    >
      <path
        d="M40 98C92 46 202 40 268 84l14 12c-70-40-178-32-234 16z"
        fill="hsl(var(--charcoal))"
        opacity="0.13"
      />
      <rect x="84" y="106" width="10" height="76" rx="3" fill="hsl(var(--charcoal))" opacity="0.09" />
      <rect x="218" y="106" width="10" height="76" rx="3" fill="hsl(var(--charcoal))" opacity="0.09" />

      <path
        d="M300 16c-58 14-100 36-142 78"
        stroke="hsl(var(--charcoal))"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.18"
      />
      <path
        d="M250 34c-16 24-22 42-24 64"
        stroke="hsl(var(--charcoal))"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.14"
      />

      <Blossom x={286} y={22} s={1.1} />
      <Blossom x={252} y={36} s={0.9} />
      <Blossom x={226} y={58} s={1.05} />
      <Blossom x={228} y={92} s={0.8} o={0.7} />
      <Blossom x={192} y={78} s={0.95} />
      <Blossom x={166} y={104} s={0.85} o={0.7} />

      {/* Three petals on the way down. */}
      <ellipse cx="150" cy="150" rx="5" ry="3" fill="hsl(var(--peach))" opacity="0.6" transform="rotate(24 150 150)" />
      <ellipse cx="196" cy="186" rx="4.4" ry="2.6" fill="hsl(var(--peach))" opacity="0.5" transform="rotate(-18 196 186)" />
      <ellipse cx="118" cy="200" rx="4" ry="2.4" fill="hsl(var(--peach))" opacity="0.42" transform="rotate(38 118 200)" />
    </svg>
  </div>
);

export default RoadmapScenery;
