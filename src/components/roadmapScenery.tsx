/**
 * The journey map: the scene, the road, and the coordinates the road passes
 * through. Kept out of LearningRoadmap so that file stays about the levels and
 * this one stays about pictures - the same split whyLearnKoreanScenes.tsx uses.
 *
 * 2026-09-20 - this file used to hold `RoadmapScenery`, a backdrop drifting
 * behind a vertical ladder of cards. Re's new mockup is not a backdrop: it is
 * a MAP. A road climbs from a hanok gate at the bottom-left to a summit gate
 * at the top, past Namsan tower and cherry trees, and each level is a stop on
 * it. So the scene and the road now live together here, and the component
 * reads `JOURNEY_STOPS` to place its nodes on the same coordinates the road
 * was drawn through. One viewBox, one source of truth: a node cannot drift off
 * the road, because both are measured in the same units.
 *
 * DRAWN, NOT PHOTOGRAPHED. Every fill is a palette token, so the map gains a
 * setting without gaining a colour, an HTTP request, or a provenance question.
 * Retune Yellow or Ivory and this retunes with it. Re's mockup was a rendered image with
 * English baked into the pixels - it could never have carried the Arabic side
 * of this site, which is the majority script here.
 *
 * THEMES. The decorative group dims on the dark theme (`dark:opacity-50`):
 * palette tints at low alpha read as a scene on Ivory and as stains on black.
 * The ROAD is deliberately outside that group - it is structure, not scenery,
 * and it has to stay legible under the nodes in both themes. Check both with
 * the header's toggle before touching either.
 *
 * DIRECTION. The scene is not mirrored for Arabic and must not be: the road
 * runs bottom-to-top, which reads the same in both scripts. The overlay nodes
 * in LearningRoadmap are positioned with physical left/top percentages for the
 * same reason - logical properties would flip them off the road in RTL.
 */

/** The shared coordinate space. Everything below is measured in these units. */
export const JOURNEY_VIEW = { w: 360, h: 560 };

/**
 * One stop per level, bottom to top, in the order of `LEVEL_KEYS`:
 * Hangul, then Levels 1-6. Seven stops, ~70 units apart - enough vertical room
 * for a 44px node plus its label at the narrowest width the card is shown at.
 * If you add a level here, add it to the road below or the node will float.
 */
export const JOURNEY_STOPS = [
  { x: 84, y: 500 },
  { x: 156, y: 430 },
  { x: 112, y: 360 },
  { x: 184, y: 290 },
  { x: 128, y: 220 },
  { x: 200, y: 150 },
  { x: 150, y: 80 },
];

/** Where the summit banner hangs. Physical percentages, as above. */
export const JOURNEY_SUMMIT = { x: 268, y: 34 };

/**
 * The road, as one continuous curve through every stop and on to the summit
 * banner. Each segment is a cubic whose handles are vertical, so the curve
 * arrives at and leaves every node straight up - a node never sits on a kink.
 */
const ROAD =
  "M84 500 C84 470 156 462 156 430 " +
  "C156 398 112 392 112 360 " +
  "C112 328 184 322 184 290 " +
  "C184 258 128 252 128 220 " +
  "C128 188 200 182 200 150 " +
  "C200 118 150 112 150 80 " +
  "C150 58 196 46 236 42";

const PETAL_ANGLES = [0, 72, 144, 216, 288];

/** One five-petal blossom, Ivory with a yellow centre. */
const Blossom = ({ x, y, s = 1, o = 0.8 }: { x: number; y: number; s?: number; o?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    {PETAL_ANGLES.map((a) => (
      <circle
        key={a}
        cx={Math.cos((a * Math.PI) / 180) * 5.6}
        cy={Math.sin((a * Math.PI) / 180) * 5.6}
        r="4.4"
        fill="hsl(var(--ivory))"
      />
    ))}
    <circle r="2.2" fill="hsl(var(--klovers-yellow))" />
  </g>
);

/** A cherry tree. Origin is the foot of the trunk, so it stands on a hill. */
const Tree = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0v-20" stroke="hsl(var(--charcoal))" strokeWidth="3" strokeLinecap="round" opacity="0.38" />
    <path d="M0-13l-7-6M0-17l6-5" stroke="hsl(var(--charcoal))" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
    <g opacity="0.8">
      <circle cx="-8" cy="-25" r="9" fill="hsl(var(--ivory))" />
      <circle cx="7" cy="-27" r="10" fill="hsl(var(--ivory))" />
      <circle cx="0" cy="-34" r="8.5" fill="hsl(var(--ivory))" />
      <circle cx="-2" cy="-21" r="7" fill="hsl(var(--ivory))" />
      <circle cx="4" cy="-32" r="2" fill="hsl(var(--klovers-yellow))" />
      <circle cx="-7" cy="-27" r="1.8" fill="hsl(var(--klovers-yellow))" />
    </g>
  </g>
);

/**
 * A hanok gate: curved eave, painted beam, two pillars. Origin is the ridge of
 * the roof; it stands about 29 units tall. A silhouette, not an illustration -
 * it must not compete with the node sitting beside it.
 */
const Gate = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-30 0C-18-13 18-13 30 0l-5 4C14-4-14-4-25 4Z" fill="hsl(var(--charcoal))" opacity="0.4" />
    <rect x="-26" y="3" width="52" height="4" rx="2" fill="hsl(var(--ivory))" opacity="0.8" />
    <rect x="-19" y="7" width="6" height="22" rx="2" fill="hsl(var(--charcoal))" opacity="0.32" />
    <rect x="13" y="7" width="6" height="22" rx="2" fill="hsl(var(--charcoal))" opacity="0.32" />
  </g>
);

/** Namsan tower. Origin is the observation deck. */
const NamsanTower = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} opacity="0.32">
    <path d="M0-34V-9" stroke="hsl(var(--charcoal))" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cy="-6" rx="12" ry="5" fill="hsl(var(--charcoal))" />
    <path d="M-3-2h6l3 46h-12Z" fill="hsl(var(--charcoal))" />
    <path d="M-10 44h20l4 14h-28Z" fill="hsl(var(--charcoal))" opacity="0.8" />
  </g>
);

export const JourneyScene = () => (
  <svg
    aria-hidden="true"
    viewBox={`0 0 ${JOURNEY_VIEW.w} ${JOURNEY_VIEW.h}`}
    fill="none"
    className="absolute inset-0 h-full w-full"
  >
    {/* Scenery. Dimmed on the dark theme - see the file header. */}
    <g className="dark:opacity-50">
      {/* Three hill layers, so the ridge reads as depth rather than one flat
          shape. The near hill is a stronger Yellow at low alpha: on Ivory it is
          a sunlit slope, on black it is the only thing that keeps the lower
          half of the map from going featureless. */}
      <path
        d="M0 560V270c50-30 110-2 170-20s130-6 190-24v334Z"
        fill="hsl(var(--klovers-yellow))"
        opacity="0.32"
      />
      <path
        d="M0 560V370c70-30 130 2 200-18s120-8 160-22v230Z"
        fill="hsl(var(--klovers-yellow))"
        opacity="0.5"
      />
      <path
        d="M0 560V470c80-22 160 6 240-12 60-13 90-6 120-12v114Z"
        fill="hsl(var(--klovers-yellow))"
        opacity="0.22"
      />

      {/* A cloud in the sky, on the start side. */}
      <g fill="hsl(var(--klovers-yellow))" opacity="0.4">
        <ellipse cx="66" cy="120" rx="40" ry="15" />
        <ellipse cx="100" cy="110" rx="26" ry="12" />
      </g>

      <NamsanTower x={44} y={196} s={0.9} />

      {/* Gates: one at the trailhead beside the Hangul stop, one at the summit
          above the last stop, one on the far slope for depth. */}
      <Gate x={36} y={498} s={0.85} />
      <Gate x={150} y={26} s={1} />
      <Gate x={300} y={296} s={0.6} />

      {/* Trees, kept clear of the x 60-220 corridor the road runs through. */}
      <Tree x={24} y={392} s={1} />
      <Tree x={62} y={316} s={0.8} />
      <Tree x={300} y={212} s={0.95} />
      <Tree x={334} y={410} s={1.05} />
      <Tree x={252} y={472} s={0.85} />
      <Tree x={26} y={476} s={0.9} />
      <Tree x={288} y={120} s={0.7} />

      <Blossom x={246} y={352} s={0.9} o={0.6} />
      <Blossom x={72} y={246} s={0.8} o={0.55} />
      <Blossom x={324} y={510} s={0.85} o={0.5} />
      <ellipse cx="238" cy="404" rx="5" ry="3" fill="hsl(var(--ivory))" opacity="0.5" transform="rotate(24 238 404)" />
      <ellipse cx="86" cy="182" rx="4.4" ry="2.6" fill="hsl(var(--ivory))" opacity="0.45" transform="rotate(-18 86 182)" />
      <ellipse cx="316" cy="268" rx="4" ry="2.4" fill="hsl(var(--ivory))" opacity="0.4" transform="rotate(38 316 268)" />
    </g>

    {/* The road. Structure, not scenery: full opacity in both themes. */}
    <path d={ROAD} stroke="hsl(var(--charcoal))" strokeWidth="28" strokeLinecap="round" opacity="0.07" />
    <path d={ROAD} stroke="hsl(var(--muted))" strokeWidth="24" strokeLinecap="round" />
    <path
      d={ROAD}
      stroke="hsl(var(--charcoal))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeDasharray="7 11"
      opacity="0.6"
    />
  </svg>
);

export default JourneyScene;
