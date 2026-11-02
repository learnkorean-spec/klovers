import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide, MeshPhysicalMaterial, type Group, type Mesh } from "three";
import { ACCENT, std } from "../config/materials";
import { MARKET } from "../config/rooms";
import { PALETTE } from "../config/world";
import { MergeChildren } from "./Merged";
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

export type ShopItem = (typeof MARKET.shop.items)[number] | (typeof MARKET.cart.items)[number];

const TABLE = MARKET.tables[MARKET.shop.table];
/** The shop's things are shown a little larger than life, so they read from across the square. */
const BASE = 1.3;
const TOP = 0.81;
/** Item spots along the table's long side (the table runs north–south). */
const CART = MARKET.cart;
/** The cart's counter top. */
const CART_TOP = 0.86;
const SPOTS: { item: ShopItem; x: number; y: number; z: number }[] = [
  ...MARKET.shop.items.map((item, i) => ({
    item,
    // Toward the square side, clear of the parasol pole in the middle.
    x: TABLE[0] - 0.22,
    y: TOP,
    z: TABLE[1] + (i - 1) * (TABLE[3] / 3.1),
  })),
  ...CART.items.map((item, i) => ({ item, x: CART.x - 0.08, y: CART_TOP, z: CART.z + (i - 1) * (CART.d / 3.1) })),
];

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

const crustMat = std("#C98B4A", 0.6);
const crustDark = std("#A8692F", 0.65);
const riceMat = std("#FFFFFF", 0.75);
const glazeMat = std("#2E2E2E", 0.25);
const cartonMat = std("#FFFFFF", 0.5);
const milkBlue = std("#4C93D8", 0.45);
const chopMat = std("#8C5A32", 0.6);

function Breads() {
  return (
    <group>
      {[
        [-0.06, 0.04, 0.3],
        [0.07, -0.02, -0.2],
        [0, -0.09, 1.2],
      ].map(([x, z, r], k) => (
        <group key={k} position={[x, 0.055 + (k === 2 ? 0.05 : 0), z]} rotation={[0, r, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.82]}>
            <capsuleGeometry args={[0.055, 0.12, 12, 24]} />
            <primitive object={k === 1 ? crustDark : crustMat} attach="material" />
          </mesh>
          {[-0.05, 0, 0.05].map((sx) => (
            <mesh key={sx} position={[sx, 0.05, 0]} rotation={[0.2, 0, 0.5]}>
              <boxGeometry args={[0.012, 0.004, 0.07]} />
              <primitive object={riceMat} attach="material" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function RiceBowl() {
  return (
    <group>
      <mesh castShadow position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.11, 0.065, 0.09, 40, 1, true]} />
        <primitive object={glazeMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.065, 32]} />
        <primitive object={glazeMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.08, 0]} scale={[1, 0.5, 1]}>
        <sphereGeometry args={[0.105, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={riceMat} attach="material" />
      </mesh>
      {/* Chopsticks resting across the rim. */}
      {[-0.012, 0.012].map((dz) => (
        <mesh key={dz} position={[0.03, 0.105, dz]} rotation={[0, 0.15, Math.PI / 2 - 0.08]}>
          <cylinderGeometry args={[0.004, 0.006, 0.26, 8]} />
          <primitive object={chopMat} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Carton({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, r, 0]}>
      <mesh castShadow position={[0, 0.09, 0]}>
        <boxGeometry args={[0.08, 0.18, 0.08]} />
        <primitive object={cartonMat} attach="material" />
      </mesh>
      <mesh position={[0, 0.07, 0]}>
        <boxGeometry args={[0.082, 0.07, 0.082]} />
        <primitive object={milkBlue} attach="material" />
      </mesh>
      {/* The gable top. */}
      <mesh position={[0, 0.2, 0]} rotation={[0, 0, Math.PI / 4]} scale={[1, 1, 1.4]}>
        <boxGeometry args={[0.04, 0.04, 0.058]} />
        <primitive object={cartonMat} attach="material" />
      </mesh>
    </group>
  );
}

function Milk() {
  return (
    <group>
      <Carton x={-0.05} z={0.04} r={0.2} />
      <Carton x={0.06} z={0.02} r={-0.15} />
      <Carton x={0} z={-0.07} r={0.5} />
    </group>
  );
}

const MODELS: Record<ShopItem, () => JSX.Element> = { 사과: Apples, 물: Water, 꽃: Flower, 빵: Breads, 밥: RiceBowl, 우유: Milk };

const cartWood = std(PALETTE.woodWarm, 0.7);
const cartDark = std(PALETTE.woodDark, 0.75);
const awningA = std("#D9534F", 0.85);
const awningB = std("#FFF9EC", 0.85);

/** The food cart: a wooden counter on two wheels under a striped canopy. */
function FoodCart() {
  const { x, z, w, d } = CART;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.58, 0]}>
        <boxGeometry args={[w, 0.5, d]} />
        <primitive object={cartWood} attach="material" />
      </mesh>
      <mesh receiveShadow position={[0, CART_TOP - 0.02, 0]}>
        <boxGeometry args={[w + 0.1, 0.04, d + 0.1]} />
        <primitive object={cartDark} attach="material" />
      </mesh>
      {/* Planks on the front, and two wheels on the east side. */}
      {[-0.5, 0, 0.5].map((pz) => (
        <mesh key={pz} position={[-w / 2 - 0.005, 0.58, pz * (d / 1.6)]}>
          <boxGeometry args={[0.01, 0.46, 0.02]} />
          <primitive object={cartDark} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((sz) => (
        <group key={sz} position={[w / 2 + 0.04, 0.33, sz * (d / 2 - 0.25)]} rotation={[0, 0, Math.PI / 2]}>
          <mesh castShadow>
            <torusGeometry args={[0.28, 0.03, 10, 32]} />
            <primitive object={cartDark} attach="material" />
          </mesh>
          {[0, 1, 2, 3].map((k) => (
            <mesh key={k} rotation={[0, (k * Math.PI) / 4, 0]}>
              <boxGeometry args={[0.02, 0.02, 0.54]} />
              <primitive object={cartDark} attach="material" />
            </mesh>
          ))}
        </group>
      ))}
      {/* Legs on the west side, so it stands level. */}
      {[-1, 1].map((sz) => (
        <mesh key={sz} castShadow position={[-w / 2 + 0.06, 0.17, sz * (d / 2 - 0.1)]}>
          <boxGeometry args={[0.06, 0.34, 0.06]} />
          <primitive object={cartDark} attach="material" />
        </mesh>
      ))}
      {/* Canopy: four posts and a striped roof. */}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} castShadow position={[sx * (w / 2 - 0.03), 1.45, sz * (d / 2 - 0.03)]}>
            <cylinderGeometry args={[0.025, 0.025, 1.2, 10]} />
            <primitive object={cartDark} attach="material" />
          </mesh>
        )),
      )}
      {Array.from({ length: 6 }, (_, k) => (
        <mesh key={k} castShadow position={[0, 2.08, -d / 2 - 0.1 + (k + 0.5) * ((d + 0.2) / 6)]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[w + 0.35, 0.04, (d + 0.2) / 6]} />
          <primitive object={k % 2 ? awningB : awningA} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

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
    <group>
      <MergeChildren>
        <FoodCart />
      </MergeChildren>
      {SPOTS.map(({ item, x, y, z }) => {
        const Model = MODELS[item];
        return (
          <group key={item} position={[x, y, z]}>
            <Pressable
              hot={hot === item}
              hop={chosen?.item === item ? chosen.at : 0}
              onPress={() => onPress?.(item)}
              onHover={(on) => setHot((h) => (on ? item : h === item ? null : h))}
            >
              <MergeChildren>
                <Model />
              </MergeChildren>
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
