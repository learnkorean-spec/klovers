import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide, MeshPhysicalMaterial, type Group, type Mesh } from "three";
import { ACCENT, std } from "../config/materials";
import { MARKET } from "../config/rooms";
import { PALETTE } from "../config/world";
import { Signboard } from "./parts";

/**
 * The market's little shop: three things on the second produce table that
 * the learner can press (click or tap them in the scene, or walk up and use
 * the round button / E). Picking one opens the shop card in WorldPage, where
 * the learner asks for it in Korean ("사과 주세요") and learns the word.
 *
 * Built finer than the rest of the square on purpose — these are the things
 * the camera is brought close to — with smooth curved geometry and glossy
 * finishes that catch the sky light. A thing's word hangs over it once the
 * learner knows it (canon: learned words appear as objects in the world).
 */

export type ShopItem = (typeof MARKET.shop.items)[number];

const TABLE = MARKET.tables[MARKET.shop.table];
/** The shop's things are shown a little larger than life, so they read from across the square. */
const BASE = 1.3;
const TOP = 0.81;
/** Item spots along the table's long side (the table runs north–south). */
const SPOTS: { item: ShopItem; x: number; z: number }[] = MARKET.shop.items.map((item, i) => ({
  item,
  // Toward the square side, clear of the parasol pole in the middle.
  x: TABLE[0] - 0.22,
  z: TABLE[1] + (i - 1) * (TABLE[3] / 3.1),
}));

/* Finer materials, made once. */
const appleSkin = std("#C8242B", 0.32, { metalness: 0.02 });
const appleSkin2 = std("#B51E28", 0.36);
const stemMat = std("#5A3A1E", 0.8);
const leafMat = std("#4E8A2E", 0.55);
const bowlMat = std("#8C5A32", 0.45);
const capMat = std("#2F6FC4", 0.35);
const labelMat = std("#EAF4FF", 0.6);
const potMat = std("#B5653A", 0.7);
const soilMat = std("#4A3424", 1);
const petalMat = std("#F27BA6", 0.6);
const petalMat2 = std("#FFFFFF", 0.6);
const centreMat = std(PALETTE.yellow, 0.55);
let bottleMat: MeshPhysicalMaterial | null = null;
const glass = () =>
  (bottleMat ??= new MeshPhysicalMaterial({
    color: "#CFE8FF",
    roughness: 0.06,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    side: DoubleSide,
  }));
const waterMat = std("#7DB8EA", 0.1, { metalness: 0 });

function Apple({ x, z, s = 1, r = 0 }: { x: number; z: number; s?: number; r?: number }) {
  return (
    <group position={[x, 0.075 * s, z]} rotation={[0.15 * Math.sin(r * 3), r, 0.12 * Math.cos(r * 2)]} scale={s}>
      <mesh castShadow scale={[1, 0.88, 1]}>
        <sphereGeometry args={[0.075, 32, 24]} />
        <primitive object={r > 1 ? appleSkin2 : appleSkin} attach="material" />
      </mesh>
      <mesh position={[0, 0.075, 0]} rotation={[0, 0, 0.25]}>
        <cylinderGeometry args={[0.005, 0.007, 0.04, 8]} />
        <primitive object={stemMat} attach="material" />
      </mesh>
      <mesh position={[0.022, 0.085, 0]} rotation={[0, 0, -0.9]} scale={[1, 0.25, 0.55]}>
        <sphereGeometry args={[0.03, 16, 10]} />
        <primitive object={leafMat} attach="material" />
      </mesh>
    </group>
  );
}

function Apples() {
  return (
    <group>
      {/* A shallow turned-wood bowl. */}
      <mesh castShadow receiveShadow position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.13, 0.06, 40, 1, true]} />
        <primitive object={bowlMat} attach="material" />
      </mesh>
      <mesh receiveShadow position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.13, 40]} />
        <primitive object={bowlMat} attach="material" />
      </mesh>
      <Apple x={-0.07} z={0.04} r={0.4} />
      <Apple x={0.07} z={0.03} r={1.7} />
      <Apple x={0} z={-0.07} r={2.6} />
      <Apple x={0} z={0} s={1.05} r={1.1} />
    </group>
  );
}

function Bottle({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      {/* The water inside, then the clear bottle over it. */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.041, 0.041, 0.2, 32]} />
        <primitive object={waterMat} attach="material" />
      </mesh>
      <mesh castShadow position={[0, 0.125, 0]}>
        <cylinderGeometry args={[0.046, 0.046, 0.25, 32]} />
        <primitive object={glass()} attach="material" />
      </mesh>
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.02, 0.046, 0.05, 32]} />
        <primitive object={glass()} attach="material" />
      </mesh>
      <mesh position={[0, 0.305, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.03, 20]} />
        <primitive object={capMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.13, 0]}>
        <cylinderGeometry args={[0.0475, 0.0475, 0.07, 32, 1, true]} />
        <primitive object={labelMat} attach="material" />
      </mesh>
    </group>
  );
}

function Water() {
  return (
    <group>
      <Bottle x={-0.06} z={0.05} />
      <Bottle x={0.06} z={0.05} />
      <Bottle x={0} z={-0.06} />
    </group>
  );
}

function Flower() {
  const petals = useMemo(() => Array.from({ length: 6 }, (_, i) => (i / 6) * Math.PI * 2), []);
  return (
    <group>
      <mesh castShadow position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.09, 0.065, 0.16, 32]} />
        <primitive object={potMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.165, 0]}>
        <torusGeometry args={[0.088, 0.012, 10, 32]} />
        <primitive object={potMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.158, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.083, 32]} />
        <primitive object={soilMat} attach="material" />
      </mesh>
      {[
        [0, 0.36, 0, 0],
        [0.07, 0.3, 0.03, 1],
        [-0.06, 0.32, -0.04, 2],
      ].map(([fx, fy, fz, k]) => (
        <group key={k}>
          <mesh position={[fx / 2, (fy + 0.16) / 2, fz / 2]} rotation={[fz * 2, 0, -fx * 2]}>
            <cylinderGeometry args={[0.005, 0.006, fy - 0.16, 8]} />
            <primitive object={leafMat} attach="material" />
          </mesh>
          <group position={[fx, fy, fz]} rotation={[0.3, k * 1.3, 0.2]}>
            {petals.map((a) => (
              <mesh key={a} position={[Math.cos(a) * 0.028, 0, Math.sin(a) * 0.028]} rotation={[0, -a, 0.35]} scale={[1, 0.3, 0.6]}>
                <sphereGeometry args={[0.03, 16, 10]} />
                <primitive object={k === 1 ? petalMat2 : petalMat} attach="material" />
              </mesh>
            ))}
            <mesh>
              <sphereGeometry args={[0.016, 16, 12]} />
              <primitive object={centreMat} attach="material" />
            </mesh>
          </group>
        </group>
      ))}
      <mesh position={[0.05, 0.2, -0.03]} rotation={[0.4, 0.6, -0.7]} scale={[1, 0.22, 0.5]}>
        <sphereGeometry args={[0.04, 16, 10]} />
        <primitive object={leafMat} attach="material" />
      </mesh>
    </group>
  );
}

const MODELS: Record<ShopItem, () => JSX.Element> = { 사과: Apples, 물: Water, 꽃: Flower };

/**
 * One pressable thing: grows a little and shows a yellow ring under the
 * pointer; hops when it has just been chosen.
 */
function Pressable({ hot, hop, onPress, onHover, children }: { hot: boolean; hop: number; onPress: () => void; onHover: (on: boolean) => void; children: ReactNode }) {
  const g = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const t = useRef({ s: BASE, hopAt: -1, seen: hop });
  useFrame(({ clock }, dt) => {
    const now = clock.elapsedTime;
    if (hop !== t.current.seen) {
      t.current.seen = hop;
      t.current.hopAt = now;
    }
    const target = BASE * (hot ? 1.14 : 1);
    t.current.s += (target - t.current.s) * Math.min(1, dt * 12);
    let y = 0;
    if (t.current.hopAt >= 0) {
      const k = (now - t.current.hopAt) / 0.55;
      if (k < 1) y = Math.sin(k * Math.PI) * 0.12;
      else t.current.hopAt = -1;
    }
    if (g.current) {
      g.current.scale.setScalar(t.current.s);
      g.current.position.y = y;
      g.current.rotation.y = hot ? Math.sin(now * 2) * 0.12 : 0;
    }
    if (ring.current) {
      ring.current.visible = hot;
      ring.current.scale.setScalar(1 + 0.05 * Math.sin(now * 5));
    }
  });
  const stop = (e: ThreeEvent<PointerEvent>) => e.stopPropagation();
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover(true);
      }}
      onPointerOut={() => onHover(false)}
      onPointerDown={stop}
      onClick={(e) => {
        e.stopPropagation();
        // A drag that looked around is not a press.
        if (e.delta > 8) return;
        onPress();
      }}
    >
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} visible={false}>
        <ringGeometry args={[0.24, 0.28, 48]} />
        <primitive object={ACCENT} attach="material" />
      </mesh>
      {/* An easy target: the thing's whole footprint, invisible. */}
      <mesh position={[0, 0.25, 0]} visible={false}>
        <boxGeometry args={[0.5, 0.55, 0.5]} />
        <meshBasicMaterial />
      </mesh>
      <group ref={g}>{children}</group>
    </group>
  );
}

export default function MarketShop({ words, chosen, onPress }: { words: string[]; chosen?: { item: string; at: number } | null; onPress?: (item: ShopItem) => void }) {
  const [hot, setHot] = useState<ShopItem | null>(null);
  useEffect(() => {
    if (!onPress) return;
    document.body.style.cursor = hot ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hot, onPress]);
  return (
    <group position={[0, TOP, 0]}>
      {SPOTS.map(({ item, x, z }) => {
        const Model = MODELS[item];
        return (
          <group key={item} position={[x, 0, z]}>
            <Pressable
              hot={hot === item}
              hop={chosen?.item === item ? chosen.at : 0}
              onPress={() => onPress?.(item)}
              onHover={(on) => setHot((h) => (on ? item : h === item ? null : h))}
            >
              <Model />
            </Pressable>
            {/* Its word, on a little card on a stick, once the learner knows it. */}
            {words.includes(item) && (
              <group position={[0.15, 0, 0]}>
                <mesh position={[0, 0.25, 0]}>
                  <cylinderGeometry args={[0.006, 0.006, 0.5, 8]} />
                  <primitive object={stemMat} attach="material" />
                </mesh>
                <group position={[0, 0.62, 0]} rotation={[0, -Math.PI / 2, 0]} scale={0.3}>
                  <Signboard text={item} w={0.9} h={0.54} aspect={1.7} />
                </group>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}
