import { Suspense, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY, paintPaving } from "../game/environment/textures";
import { GateWall, Signboard } from "../game/environment/parts";
import { Kit, tree, pine, stoneLantern, bed, grass, slabWalk, platform, pot } from "../game/environment/kit";
import Batch from "../game/environment/Batch";
import { box, type Box2 } from "../game/config/world";
import {
  LearnerPlaceholder,
  Hotspot,
  Cluby,
  BackgroundFigure,
  FollowCamera,
  useLearnerReactions,
  usePlayerMovement,
  DEFAULT_PLAYER_AVATAR,
  DRESS,
  type PlayableAvatar,
} from "./shared";
import RiggedBody from "../game/player/RiggedBody";
import { World1Atmosphere } from "./World1Stage";

/**
 * KLOVERS World 2 — the entrance courtyard, route /world2's landing view.
 *
 * Re, 3 Nov 2026: World2 read as a flat pair of tabs with no sense of a
 * place — wanted "at least an entrance room so the story is organized",
 * the way the live /world game always lands you somewhere (its Hub, see
 * src/game/environment/Hub.tsx) before you choose a direction, rather than
 * dropping you straight into a room.
 *
 * Deliberately reuses the live game's own gate and signboard parts
 * (GateWall, Signboard — src/game/environment/parts.tsx) instead of
 * inventing new geometry: these are the exact assets that make a World1
 * gate read as "a real place with a door", material-for-material — a
 * usable gate gets the thin yellow accent line, same as in the live game,
 * and the Hangul signboards are the same wood-and-ink canvas texture
 * (useSignTexture) the live game's room names use. No Kit/Batch coupling
 * to World1's own room/collision/camera state — these two components are
 * self-contained geometry + a canvas texture, nothing else.
 *
 * Two gates, two destinations — clicking a gate, OR walking the learner's
 * own character through its opening with the keyboard, is "choosing a
 * room", same mental model as the Hub. A third room later is a third gate
 * here, nothing else about this file changes.
 *
 * Re, 3 Nov 2026: "must have moves with arrows... and they must be
 * interacting" — the entrance previously stood still (Adam and Lina were
 * fixed, click-only) while both destination rooms already had full arrow-
 * key/WASD walking (see shared.tsx's usePlayerMovement/Player). The
 * learner's character now walks here too, with the same keys, and walking
 * far enough toward either gate's opening enters that room exactly like
 * clicking it — clicking the gate still works on its own as a faster
 * shortcut.
 *
 * Re, 4 Nov 2026: "the visitor is either lena or adam" — the entrance used
 * to always put Adam in the walkable slot with Lina as a fixed companion;
 * `playerAvatar` (picked on `World2Page`, see shared.tsx's `PlayableAvatar`)
 * now decides which canon learner walks here, same as in both rooms.
 *
 * Re, 4 Nov 2026 (later the same day): "student must choose a character and
 * move with one only" — the fixed companion learner described above is
 * removed entirely; only the chosen character and Cluby appear here now.
 */
export default function EntranceScene({
  playerAvatar = DEFAULT_PLAYER_AVATAR,
  onEnterRoom,
}: {
  /** Which canon learner the visitor is walking as this visit — see
   * shared.tsx's `PlayableAvatar`. */
  playerAvatar?: PlayableAvatar;
  /** Fired when the learner clicks a gate, or walks through its opening,
   * with the room it leads to. */
  onEnterRoom: (roomId: "cart" | "store") => void;
}) {
  const ground = useTiledTexture(paintPaving, 10, 10);
  // Re, 4 Nov 2026 (render-quality pass): the live /world game's own rooms
  // (VocabularyMarket.tsx etc.) upgrade this exact painted tile to a real
  // photographed stone floor once it downloads (usePhotoFloor/floorBreakup —
  // same CC0 assets, already on the CDN, no new download added by using
  // them here). World2 never adopted that upgrade path; it's a direct,
  // zero-risk texture-resolution win, since the painted tile still shows
  // until the photo loads and stays if it never does.
  const groundPhoto = usePhotoFloor("paving", 10, 10);
  // Re, 4 Nov 2026 ("make it as world1, that's not the same"): the entrance
  // read as two gates floating in an empty grey void next to the live
  // game's own Hub (kloversegy.com/world) — a dense little courtyard with
  // trees, stone lanterns, flower beds and a laid stone walk. Rather than
  // hand-rolling new geometry, this reuses the Hub's own scenery kit
  // (kit.ts's tree/pine/stoneLantern/bed/slabWalk/platform/pot, rendered
  // through the same Batch component World1 uses) — the exact same visual
  // language and materials, not an imitation of it. Built once; nothing in
  // here moves or reacts, so a plain memoized Kit is enough.
  const envKit = useMemo(() => {
    const k = new Kit();
    // Pines flanking each gate, set back from the walk so they frame the
    // opening instead of blocking it.
    pine(k, -5.4, 0.6, 1.15);
    pine(k, -6.3, 2.0, 0.95);
    pine(k, 5.4, 0.6, 1.15);
    pine(k, 6.3, 2.0, 0.95);
    // A pair of flowering trees flanking the signpost, not behind it — the
    // same role the Hub's own cherry trees play around its wayfinding
    // pillar, without their canopies covering the sign itself (they did,
    // centred and this close, when there was only one).
    tree(k, -1.9, -1.9, 0.85, true, 4);
    tree(k, 1.9, -1.9, 0.85, true, 6);
    // Stone lanterns either side of the sign, lit — they read as the
    // courtyard's own light source at dusk, same as the Hub's.
    stoneLantern(k, -1.1, -1.3, 1.05);
    stoneLantern(k, 1.1, -1.3, 1.05);
    // Flower beds along both side walls, breaking up the bare paving.
    bed(k, -4.4, 2.3, 1.3, 2.0, 2, true);
    bed(k, 4.4, 2.3, 1.3, 2.0, 5, true);
    // Grass tufts scattered near the gates and the walk.
    [[-2.6, 0.2], [-2.9, 1.1], [2.6, 0.2], [2.9, 1.1], [-0.7, 2.6], [0.8, 2.7]].forEach(([gx, gz], i) =>
      grass(k, gx, gz, 1.0, i + 1),
    );
    // A low wooden platform (pyeongsang) to one side — a place to have sat,
    // the small human touch the Hub's own benches give its square.
    platform(k, -3.3, 3.0, 1.4, 0.8, Math.PI * 0.08);
    pot(k, 3.3, 3.0, 0.9);
    // A laid stone walk from the player's own start down toward the sign —
    // reinforces the path the live game always gives a courtyard, instead
    // of bare paving all the way through.
    slabWalk(k, 0, 2.9, 0, -0.8, 1.3, 3);
    return k;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Re, 4 Nov 2026 ("movement is so bad"): collision for every solid piece
  // of `envKit` above — same positions, same live-game sizing convention
  // (config/world.ts's own PROPS/COLLIDERS: a fixed ~0.5 footprint for a
  // tree/pine regardless of its visual scale, lanternSize 0.55, a bed's own
  // w/d plus a hair of kerb). The learner is pushed out of all of these;
  // the camera only avoids the tall ones (pines, trees, lanterns) — it's
  // fine to see over a bed, the bench, or a pot, same as the live game's
  // own `CAMERA_COLLIDERS` leaving those out too.
  const tallColliders: Box2[] = useMemo(
    () => [
      box(-5.4, 0.6, 0.5, 0.5),
      box(-6.3, 2.0, 0.5, 0.5),
      box(5.4, 0.6, 0.5, 0.5),
      box(6.3, 2.0, 0.5, 0.5),
      box(-1.9, -1.9, 0.5, 0.5),
      box(1.9, -1.9, 0.5, 0.5),
      box(-1.1, -1.3, 0.58, 0.58),
      box(1.1, -1.3, 0.58, 0.58),
    ],
    [],
  );
  const groundColliders: Box2[] = useMemo(
    () => [
      ...tallColliders,
      box(-4.4, 2.3, 1.4, 2.1),
      box(4.4, 2.3, 1.4, 2.1),
      box(-3.3, 3.0, 1.4, 0.8),
      box(3.3, 3.0, 0.5, 0.5),
    ],
    [tallColliders],
  );
  const { playerControl } = useLearnerReactions();
  // Wide enough to reach both gates (±3.8 on x) with a little room to spare,
  // and deep enough (toward -1.6) to actually walk through the gate opening
  // rather than stopping dead at it.
  const player = usePlayerMovement({
    bounds: { x: [-5, 5], z: [-1.6, 3] },
    control: playerControl,
    colliders: groundColliders,
  });
  const enteredRoom = useRef(false);
  useFrame(() => {
    if (enteredRoom.current) return;
    const pos = player.current?.position;
    if (!pos || pos.z > -0.9) return;
    if (pos.x < -2.3) {
      enteredRoom.current = true;
      onEnterRoom("cart");
    } else if (pos.x > 2.3) {
      enteredRoom.current = true;
      onEnterRoom("store");
    }
  });
  return (
    <group>
      <FollowCamera target={player} control={playerControl} cameraColliders={tallColliders} />
      {/* Re, 4 Nov 2026 ("i need world 1 quality"): the live game's own
          sky, landscape, haze and light rig — see World1Stage.tsx. Replaces
          this scene's old dark dusk fog/lights and its flat sky plane. */}
      <World1Atmosphere id="w2-entrance" hx={12} hz={12} floor={{ cx: 0, cz: 0.7, w: 10, d: 4.6 }} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          key={groundPhoto ? "photo" : "painted"}
          map={groundPhoto?.map ?? ground}
          normalMap={groundPhoto?.normal ?? null}
          roughnessMap={groundPhoto?.rough ?? null}
          color={groundPhoto ? "#F4EBDD" : "#ffffff"}
          roughness={groundPhoto ? 1 : 0.95}
          onBeforeCompile={floorBreakup}
          customProgramCacheKey={FLOOR_BREAKUP_KEY}
        />
      </mesh>

      {/* Trees, lanterns, flower beds, the bench and the stone walk — see
          `envKit`'s own doc comment above. One Batch draws all of it. */}
      <Batch kit={envKit} />

      {/* The wayfinding sign every path in the live game's own Hub has —
          here it just names the place instead of pointing down several. */}
      <group position={[0, 0, -2.4]}>
        <mesh position={[0, 1.1, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 2.2, 10]} />
          <meshStandardMaterial color="#6b4a30" roughness={0.8} />
        </mesh>
        <group position={[0, 2.15, 0.2]}>
          <Signboard text={"KLOVERS\nWorld 2"} w={1.6} h={0.8} aspect={2} />
        </group>
      </group>

      {/* Left gate — the street cart room. GateWall's own frame posts sit
          at a fixed ±1.7 locally regardless of halfWidth, and halfWidth
          must clear its hardcoded 1.8-unit gate opening (segW = halfWidth +
          0.6 - 1.8) or the flanking wall segments collapse to nothing — so
          the two gates need real distance between their group origins or
          their frames crowd each other out at the middle. */}
      <group position={[-3.8, 0, 0]}>
        <Hotspot onSelect={() => onEnterRoom("cart")}>
          <GateWall z={-1.4} facing={1} open sign="포장마차" halfWidth={2.2} />
        </Hotspot>
      </group>

      {/* Right gate — the convenience store room. */}
      <group position={[3.8, 0, 0]}>
        <Hotspot onSelect={() => onEnterRoom("store")}>
          <GateWall z={-1.4} facing={1} open sign="편의점" halfWidth={2.2} />
        </Hotspot>
      </group>

      <Suspense fallback={<LearnerPlaceholder x={0} z={0.6} />}>
        <group ref={player} position={[0, 0, 0.6]} rotation={[0, Math.PI * 0.15, 0]}>
          <RiggedBody
            model={playerAvatar}
            rules={DRESS[playerAvatar]}
            female={playerAvatar === "lina"}
            control={playerControl}
          />
        </group>
      </Suspense>
      <Cluby x={0.5} y={0} z={1.3} />
      {/* Re, 4 Nov 2026 ("make it as world1, that's not the same"): a
          couple of unnamed passersby near the bench and the pot — the
          live game's own Hub always has a few other learners milling
          about its courtyard; an empty one read as a stage set rather
          than a place. See `BackgroundFigure`'s own doc comment. */}
      <BackgroundFigure x={-3.0} z={3.3} rotY={2.6} toneIndex={3} />
      <BackgroundFigure x={3.4} z={3.2} rotY={-2.3} toneIndex={1} scale={0.97} />
    </group>
  );
}
