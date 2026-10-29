import { useMemo } from "react";
import Instanced from "./Instanced";
import { KIT_MATERIALS, kitGeometry, type GeoKey, type Kit, type MatKey } from "./kit";

/**
 * Draws a whole Kit: one instanced mesh per finish × shape × shadow flag.
 * With shadows off (phones) the cast flag is simply ignored by the renderer.
 */
export default function Batch({ kit }: { kit: Kit }) {
  const lists = useMemo(() => [...kit.lists.entries()], [kit]);
  return (
    <>
      {lists.map(([key, parts]) => {
        const [mat, geo, cast] = key.split("|") as [MatKey, GeoKey, string];
        return (
          <Instanced
            key={key}
            parts={parts}
            material={KIT_MATERIALS[mat]}
            geometry={kitGeometry(geo)}
            castShadow={cast === "1"}
            receiveShadow={mat !== "accent" && mat !== "lantern" && mat !== "paper" && mat !== "hill" && mat !== "glass"}
          />
        );
      })}
    </>
  );
}
