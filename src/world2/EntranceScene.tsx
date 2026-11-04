import { Suspense, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useTiledTexture, usePhotoFloor, floorBreakup, FLOOR_BREAKUP_KEY, paintPaving } from "../game/environment/textures";
import { GateWall, Signboard } from "../game/environment/parts";
import {
  LearnerPlaceholder,
  Hotspot,
  Cluby,
  FollowCamera,
  useLearnerReactions,
  usePlayerMovement,
  DEFAULT_PLAYER_AVATAR,
  DRESS,
  type PlayableAvatar,
} from "./shared";
import RiggedBody from "../game/player/RiggedBody";

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
  const ground = useTiledTexture(paintPaving, 6, 6);
  // Re, 4 Nov 2026 (render-quality pass): the live /world game's own rooms
  // (VocabularyMarket.tsx etc.) upgrade this exact painted tile to a real
  // photographed stone floor once it downloads (usePhotoFloor/floorBreakup —
  // same CC0 assets, already on the CDN, no new download added by using
  // them here). World2 never adopted that upgrade path; it's a direct,
  // zero-risk texture-resolution win, since the painted tile still shows
  // until the photo loads and stays if it never does.
  const groundPhoto = usePhotoFloor("paving", 6, 6);
  const { playerControl } = useLearnerReactions();
  // Wide enough to reach both gates (±3.8 on x) with a little room to spare,
  // and deep enough (toward -1.6) to actually walk through the gate opening
  // rather than stopping dead at it.
  const player = usePlayerMovement({ bounds: { x: [-5, 5], z: [-1.6, 3] }, control: playerControl });
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
      <FollowCamera target={player} control={playerControl} />
      <fog attach="fog" args={["#2a2438", 9, 18]} />
      {/* Same hemisphere + warm key + cool fill recipe as World1's own
          lighting (src/game/World.tsx's LIGHT constant) — see World2Scene's
          own comment for the full rationale. */}
      <hemisphereLight args={["#FFE9CC", "#A08466", 0.5]} />
      <directionalLight position={[-5, 4, -2]} intensity={0.3} color="#C4D3EC" />
      <directionalLight
        position={[2.5, 5, 3]}
        intensity={1.5}
        color="#FFCC8E"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial
          key={groundPhoto ? "photo" : "painted"}
          map={groundPhoto?.map ?? ground}
          normalMap={groundPhoto?.normal ?? null}
          roughnessMap={groundPhoto?.rough ?? null}
          color="#8a7560"
          roughness={groundPhoto ? 1 : 0.95}
          onBeforeCompile={floorBreakup}
          customProgramCacheKey={FLOOR_BREAKUP_KEY}
        />
      </mesh>
      {/* A plain sky backdrop well behind the gates — without it they'd read
          as floating against the canvas's own void, unlike every other
          room here, which backs onto an Alley/StoreShell wall. */}
      <mesh position={[0, 4, -9]}>
        <planeGeometry args={[26, 12]} />
        <meshBasicMaterial color="#cfe0e8" />
      </mesh>

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
    </group>
  );
}
