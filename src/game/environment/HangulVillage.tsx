import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from "three";
import { VILLAGE } from "../config/rooms";
import { PALETTE } from "../config/world";
import { useSignTexture } from "./signTexture";

/**
 * Hangul Village — the first learning world (canon: worlds[0]).
 *
 * One quiet street of hanok houses. Every door carries a hanging signboard
 * with one of the first letters a learner reads (ㄱ ㄴ ㄷ ㄹ ㅁ · ㅏ ㅓ ㅗ ㅜ ㅣ),
 * a well sits in the middle, and a banner arch reads 한글 마을. South: the
 * open gate back to the courtyard. North: the shut gate of 시장, the
 * Vocabulary Market, which opens only on a real Hangul milestone.
 */

const HW = VILLAGE.halfWidth;
const HL = VILLAGE.halfLength;
const HOUSE_D = VILLAGE.houseDepth;
const HOUSE_L = VILLAGE.houseLength;
const WALL_H = 2.6;
/** x of the street-facing house wall. */
const FACE_X = HW + 0.3;
const ARCH_Z = VILLAGE.arch.z;
const ARCH_X = VILLAGE.arch.x;

function usePavingTexture() {
  return useMemo(() => {
    const size = 256;
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = PALETTE.stone;
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = "rgba(46,46,46,0.16)";
      const rows = 4;
      for (let r = 0; r < rows; r++) {
        const y = (r * size) / rows;
        ctx.fillRect(0, y, size, 2);
        const off = r % 2 ? size / 4 : 0;
        for (let x = off; x < size + 1; x += size / 2) ctx.fillRect(x % size, y, 2, size / rows);
      }
    }
    const t = new CanvasTexture(c);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    t.repeat.set(HW, HL);
    t.colorSpace = SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, []);
}

/** Two back-to-back planes so the sign reads correctly from both sides. */
function Signboard({ text, w, h, aspect = 1 }: { text: string; w: number; h: number; aspect?: number }) {
  const tex = useSignTexture(text, aspect);
  return (
    <>
      {[0, Math.PI].map((ry) => (
        <mesh key={ry} rotation={[0, ry, 0]} position={[0, 0, ry ? -0.011 : 0.011]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
      ))}
      <mesh castShadow>
        <boxGeometry args={[w + 0.04, h + 0.04, 0.02]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />
      </mesh>
    </>
  );
}

function House({ side, z, letter }: { side: -1 | 1; z: number; letter: string }) {
  const cx = side * (FACE_X + HOUSE_D / 2);
  /** Local x of the street face (toward the street is −side). */
  const fx = -side * (HOUSE_D / 2);
  const faceRot = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const roofX = (HOUSE_D / 2 + 0.75) / Math.SQRT1_2;
  const roofZ = (HOUSE_L / 2 + 0.75) / Math.SQRT1_2;

  return (
    <group position={[cx, 0, z]}>
      <mesh castShadow receiveShadow position={[0, WALL_H / 2, 0]}>
        <boxGeometry args={[HOUSE_D, WALL_H, HOUSE_L]} />
        <meshStandardMaterial color={PALETTE.ivory} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[HOUSE_D + 0.02, 0.6, HOUSE_L + 0.02]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.85} />
      </mesh>
      {/* Corner and middle posts on the street face */}
      {[-HOUSE_L / 2, 0, HOUSE_L / 2].map((pz) => (
        <mesh key={pz} castShadow position={[fx - side * 0.05, WALL_H / 2, pz]}>
          <boxGeometry args={[0.2, WALL_H, 0.2]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
        </mesh>
      ))}
      {/* Eave board and hip roof of dark tiles */}
      <mesh castShadow position={[0, WALL_H + 0.08, 0]}>
        <boxGeometry args={[HOUSE_D + 1.2, 0.16, HOUSE_L + 1.2]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, WALL_H + 0.16 + 0.65, 0]} rotation={[0, Math.PI / 4, 0]} scale={[roofX, 1.3, roofZ]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.75} flatShading />
      </mesh>
      {/* Door and two paper windows */}
      <mesh position={[fx - side * 0.03, 1.0, 0.9]} rotation={[0, faceRot, 0]}>
        <boxGeometry args={[1.1, 2.0, 0.08]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.75} />
      </mesh>
      {[-1.3].map((wz) => (
        <group key={wz} position={[fx - side * 0.02, 1.55, wz]} rotation={[0, faceRot, 0]}>
          <mesh>
            <boxGeometry args={[1.1, 0.8, 0.04]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.98, 0.68]} />
            <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.ivory} emissiveIntensity={0.3} roughness={0.95} />
          </mesh>
        </group>
      ))}
      {/* Bracket and hanging signboard, square to the street so it reads
          while walking. High enough to pass beneath. */}
      <mesh castShadow position={[fx - side * 0.4, 2.5, 0.9]}>
        <boxGeometry args={[0.8, 0.07, 0.07]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
      </mesh>
      <group position={[fx - side * 0.62, 2.12, 0.9]}>
        <Signboard text={letter} w={0.62} h={0.62} />
      </group>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  const s = VILLAGE.lampSize;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 1.1, 0]}>
        <boxGeometry args={[s * 0.5, 2.2, s * 0.5]} />
        <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
      </mesh>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[s, 0.16, s]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={1} />
      </mesh>
      <mesh castShadow position={[0, 2.42, 0]}>
        <boxGeometry args={[0.36, 0.44, 0.36]} />
        <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.ivory} emissiveIntensity={0.45} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 2.7, 0]}>
        <boxGeometry args={[0.48, 0.08, 0.48]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Well() {
  const { x, z } = VILLAGE.well;
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow receiveShadow position={[0, 0.37, 0]}>
        <cylinderGeometry args={[0.8, 0.85, 0.74, 24]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={1} />
      </mesh>
      <mesh position={[0, 0.745, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.76, 0.06, 8, 28]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 24]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.2} />
      </mesh>
      {[-1, 1].map((sx) => (
        <mesh key={sx} castShadow position={[sx * 0.72, 1.2, 0]}>
          <boxGeometry args={[0.1, 1.7, 0.1]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 2.05, 0]}>
        <boxGeometry args={[1.9, 0.12, 1.1]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
      </mesh>
      <mesh castShadow position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 1.4, 10]} />
        <meshStandardMaterial color={PALETTE.woodWarm} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Arch() {
  return (
    <group position={[0, 0, ARCH_Z]}>
      {[-ARCH_X, ARCH_X].map((x) => (
        <mesh key={x} castShadow position={[x, 1.75, 0]}>
          <boxGeometry args={[VILLAGE.arch.post, 3.5, VILLAGE.arch.post]} />
          <meshStandardMaterial color={PALETTE.woodDark} roughness={0.7} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.5, 0]}>
        <boxGeometry args={[ARCH_X * 2 + 0.8, 0.26, 0.34]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
      </mesh>
      <group position={[0, 2.85, 0]}>
        <Signboard text={VILLAGE.entranceSign} w={2.6} h={1} aspect={2.6} />
      </group>
    </group>
  );
}

/** End wall with a gate in the middle; `open` gates glow with daylight. */
function EndWall({ z, facing, open, sign }: { z: number; facing: 1 | -1; open: boolean; sign?: string }) {
  const gateHalf = 1.8;
  const segW = HW + 0.6 - gateHalf;
  const segX = gateHalf + segW / 2;
  const inner = z + facing * 0.12;
  return (
    <group>
      {[-segX, segX].map((x) => (
        <group key={x}>
          <mesh receiveShadow position={[x, 1.4, z]}>
            <boxGeometry args={[segW, 2.8, 0.4]} />
            <meshStandardMaterial color={PALETTE.ivory} roughness={0.95} />
          </mesh>
          <mesh position={[x, 0.45, z]}>
            <boxGeometry args={[segW + 0.02, 0.9, 0.42]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[x, 2.92, z]}>
            <boxGeometry args={[segW + 0.4, 0.2, 1.1]} />
            <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* Yellow gate frame — unlit so it renders as exact Klovers yellow. */}
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} castShadow position={[x, 1.5, inner]}>
          <boxGeometry args={[0.2, 3, 0.2]} />
          <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 3.05, inner]}>
        <boxGeometry args={[3.6, 0.22, 0.22]} />
        <meshBasicMaterial color={PALETTE.yellow} toneMapped={false} />
      </mesh>
      {open ? (
        <>
          {/* Daylight through the open gate */}
          <mesh position={[0, 1.45, z - facing * 0.3]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
            <planeGeometry args={[3.2, 2.9]} />
            <meshBasicMaterial color={PALETTE.ivory} toneMapped={false} />
          </mesh>
          {[-1, 1].map((sx) => (
            <mesh key={sx} castShadow position={[sx * 1.55, 1.35, z - facing * 0.85]}>
              <boxGeometry args={[0.1, 2.7, 1.5]} />
              <meshStandardMaterial color={PALETTE.woodDark} roughness={0.75} />
            </mesh>
          ))}
        </>
      ) : (
        <>
          <mesh castShadow receiveShadow position={[0, 1.35, z]}>
            <boxGeometry args={[3.2, 2.7, 0.14]} />
            <meshStandardMaterial color={PALETTE.woodDark} roughness={0.75} />
          </mesh>
          <mesh position={[0, 1.35, z + facing * 0.075]}>
            <boxGeometry args={[0.05, 2.7, 0.02]} />
            <meshStandardMaterial color={PALETTE.charcoal} />
          </mesh>
        </>
      )}
      {sign && (
        <group position={[0, 2.25, z + facing * 0.12]} rotation={[0, facing > 0 ? 0 : Math.PI, 0]}>
          <Signboard text={sign} w={1.3} h={0.65} aspect={2} />
        </group>
      )}
    </group>
  );
}

export default function HangulVillage() {
  const paving = usePavingTexture();
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[HW * 2 + 0.6, HL * 2]} />
        <meshStandardMaterial map={paving} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[90, 90]} />
        <meshStandardMaterial color={PALETTE.stone} roughness={1} />
      </mesh>
      {/* Kerbs */}
      {[-1, 1].map((s) => (
        <mesh key={s} receiveShadow position={[s * (HW + 0.15), 0.08, 0]}>
          <boxGeometry args={[0.3, 0.16, HL * 2]} />
          <meshStandardMaterial color={PALETTE.charcoal} roughness={0.9} />
        </mesh>
      ))}

      {VILLAGE.houseZ.map((z, i) => (
        <group key={z}>
          <House side={-1} z={z} letter={VILLAGE.lettersLeft[VILLAGE.lettersLeft.length - 1 - i]} />
          <House side={1} z={z} letter={VILLAGE.lettersRight[VILLAGE.lettersRight.length - 1 - i]} />
        </group>
      ))}
      {VILLAGE.lampZ.map((z) => (
        <group key={z}>
          <Lamp x={-VILLAGE.lampX} z={z} />
          <Lamp x={VILLAGE.lampX} z={z} />
        </group>
      ))}
      <Well />
      <Arch />
      {/* North: the market gate, shut. South: open, back to the courtyard. */}
      <EndWall z={-HL - 0.2} facing={1} open={false} sign={VILLAGE.marketSign} />
      <EndWall z={HL + 0.2} facing={-1} open />
    </group>
  );
}
