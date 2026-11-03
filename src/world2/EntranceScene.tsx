import { Suspense } from "react";
import { useTiledTexture, paintPaving } from "../game/environment/textures";
import { GateWall, Signboard } from "../game/environment/parts";
import { Learner, LearnerPlaceholder, Hotspot, Cluby, useLearnerReactions } from "./shared";

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
 * Two gates, two destinations — clicking (or, on the live game's own
 * convention, walking through) a gate is "choosing a room", same mental
 * model as the Hub. A third room later is a third gate here, nothing else
 * about this file changes.
 */
export default function EntranceScene({
  onEnterRoom,
}: {
  /** Fired when the learner clicks a gate, with the room it leads to. */
  onEnterRoom: (roomId: "cart" | "store") => void;
}) {
  const ground = useTiledTexture(paintPaving, 6, 6);
  // Adam and Lina stand here only to welcome the learner in — no keyboard
  // movement in the entrance itself, so there's nothing to get in the way
  // of clicking a gate cleanly (see World2Scene's own hotspot-timing notes).
  const { adamControl, linaControl } = useLearnerReactions();
  return (
    <group>
      <fog attach="fog" args={["#2a2438", 9, 18]} />
      <ambientLight intensity={0.85} color="#FFF3DD" />
      <directionalLight
        position={[2.5, 5, 3]}
        intensity={1.5}
        color="#FFE7B0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial map={ground} color="#8a7560" roughness={0.95} />
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

      <Suspense
        fallback={
          <>
            <LearnerPlaceholder x={-0.4} z={0.6} />
            <LearnerPlaceholder x={0.4} z={0.6} />
          </>
        }
      >
        <Learner avatar="adam" x={-0.4} z={0.6} rotY={Math.PI * 0.15} control={adamControl} />
        <Learner avatar="lina" x={0.4} z={0.6} rotY={-Math.PI * 0.15} control={linaControl} />
      </Suspense>
      <Cluby x={0} y={0} z={1.3} />
    </group>
  );
}
