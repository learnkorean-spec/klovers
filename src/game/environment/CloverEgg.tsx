import { PALETTE, PROPS } from "../config/world";

/**
 * The clover egg, dormant, on its plinth in the middle of the courtyard.
 *
 * Canon (src/config/klovers-world.ts → originStory.discovery.egg): ivory
 * shell, a small green four-leaf clover mark, initial state dormant. It does
 * not crack, glow or move here — those reactions belong to real learning
 * progress (first word / first sentence / first conversation) and will be
 * wired to learner data in a later stage, never faked.
 */
export default function CloverEgg() {
  const { x, z, w } = PROPS.eggPlinth;
  const plinthH = 0.5;
  const eggR = 0.42;

  return (
    <group position={[x, 0, z]}>
      {/* Dark stone plinth, so the ivory egg reads against it */}
      <mesh castShadow receiveShadow position={[0, plinthH / 2, 0]}>
        <boxGeometry args={[w, plinthH, w]} />
        <meshStandardMaterial color={PALETTE.charcoal} roughness={0.9} />
      </mesh>
      {/* Wooden nest ring */}
      <mesh castShadow position={[0, plinthH + 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.07, 10, 32]} />
        <meshStandardMaterial color={PALETTE.woodWarm} roughness={0.8} />
      </mesh>
      {/* Egg */}
      <mesh castShadow position={[0, plinthH + eggR * 1.25, 0]} scale={[1, 1.3, 1]}>
        <sphereGeometry args={[eggR, 32, 24]} />
        <meshStandardMaterial color={PALETTE.ivory} roughness={0.55} />
      </mesh>
      {/* Four-leaf clover mark, facing the spawn point (+z) */}
      <group position={[0, plinthH + eggR * 1.25, eggR + 0.004]}>
        {[
          [0.035, 0.035],
          [-0.035, 0.035],
          [0.035, -0.035],
          [-0.035, -0.035],
        ].map(([dx, dy], i) => (
          <mesh key={i} position={[dx, dy, 0]}>
            <circleGeometry args={[0.04, 16]} />
            <meshBasicMaterial color={PALETTE.cloverGreen} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
