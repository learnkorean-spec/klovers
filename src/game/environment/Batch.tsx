import { useMemo } from "react";
import Instanced from "./Instanced";
import { KIT_MATERIALS, kitGeometry, type GeoKey, type Kit, type MatKey } from "./kit";
import type { Part } from "./Instanced";
import { pickQuality } from "../systems/quality";

/** Phones draw no shadows: there the cast flag would only split one list into two draws. */
const SHADOWS = typeof window === "undefined" ? true : pickQuality().shadows;

/**
 * Merges lists that differ only by their shadow flag into one (kept as
 * casting, so nothing changes if shadows are ever on). Exported for checks.
 */
export function mergeCastFlag(entries: [string, Part[]][]): [string, Part[]][] {
  const out = new Map<string, Part[]>();
  for (const [key, parts] of entries) {
    const [mat, geo] = key.split("|");
    const k = `${mat}|${geo}|1`;
    const l = out.get(k);
    out.set(k, l ? [...l, ...parts] : parts);
  }
  return [...out.entries()];
}

/**
 * Draws a whole Kit: one instanced mesh per finish × shape × shadow flag
 * on computers; per finish × shape on phones (no shadows there, so a
 * casting and a non-casting list of the same part are one draw).
 */
export default function Batch({ kit }: { kit: Kit }) {
  const lists = useMemo(() => {
    const all = [...kit.lists.entries()];
    return SHADOWS ? all : mergeCastFlag(all);
  }, [kit]);
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
