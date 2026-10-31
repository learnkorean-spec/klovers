import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import World2Scene from "./World2Scene";

/** Camera gently orbits so the scene reads as a real 3D room, not a static render. */
function SlowOrbit({ children }: { children: React.ReactNode }) {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.35;
  });
  return <group ref={g}>{children}</group>;
}

/**
 * KLOVERS World 2 — hackathon preview page, route /world2.
 *
 * Isolated from the live learner world (src/game/, /world): this is a fixed
 * tech demo showing a room concept designed with Meta's Model API (Muse
 * Image for the concept art, Muse Spark for the structured design brief —
 * see AiRoomLabPage.tsx) built out as a real, if minimal, interactive 3D
 * Three.js scene, not a flat image. Nothing here reads or writes learner
 * progress.
 */
export default function World2Page() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#2E2E2E] text-[#FFF9EC]">
      <div className="sticky top-0 z-20 bg-[#2E2E2E]/90 backdrop-blur border-b border-[#FFF9EC]/10">
        <div className="max-w-5xl mx-auto flex items-center gap-3 py-3 px-4 md:px-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-[#FFF9EC] hover:bg-[#FFF9EC]/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              KLOVERS World 2
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#FFFF00] text-[#2E2E2E]">
                Hackathon preview
              </span>
            </h1>
            <p className="text-xs text-[#FFF9EC]/70">
              Concept: Meta Muse Image + Muse Spark · built into real 3D with Three.js
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-4">
        <div className="h-[60vh] rounded-lg overflow-hidden border border-[#FFF9EC]/10">
          <Canvas shadows camera={{ position: [2.6, 1.9, 3.8], fov: 42 }}>
            <Suspense fallback={null}>
              <SlowOrbit>
                <World2Scene />
              </SlowOrbit>
            </Suspense>
          </Canvas>
        </div>

        <div className="rounded-lg border border-[#FFF9EC]/10 bg-[#FFF9EC]/5 p-4 text-sm space-y-2">
          <p className="font-semibold">A warm Korean street food cart at dusk (포장마차)</p>
          <p className="text-[#FFF9EC]/80">
            Adam orders at the counter, Lina points to the menu and explains, Cluby sits on a
            stool beside them. Vocabulary: 어묵 (fish cake), 떡볶이 (spicy rice cakes), 김밥
            (seaweed rice rolls), 주세요 (please give me), 얼마예요? (how much is it?).
          </p>
          <p className="text-[#FFF9EC]/50 text-xs">
            This is a hackathon tech-demo page, separate from the live KLOVERS World learner
            experience — it does not touch production rooms, progression, or story canon gating.
          </p>
        </div>
      </div>
    </div>
  );
}
