import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Download, Loader2, RefreshCw, Scissors } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { loadImage } from "./WatercolorVocabSheet";

/**
 * Book watercolor pictures (Re, 12 Nov 2026): "i always will give 5 prompts
 * and u generate 5 pictures in the tool". Each prompt lists four cells
 * ("Cell 1: ... Cell 4: ..."). Since 13 Nov ("each picture must be generated
 * separately") every cell is its own Muse Image call in her fixed
 * children's-picture-book style (the style text lives in the edge function),
 * so nothing bleeds between cells. Each cell is whitened, trimmed and
 * squared for the book, and the four are also assembled into a 2 x 2 grid
 * with white gutters.
 */

const SLOTS = 5;
const PARALLEL = 4;
const STORE = "klovers-book-grid-prompts";

type Status = "idle" | "loading" | "done" | "error";
interface Slot {
  prompt: string;
  cells: (string | undefined)[];
  cellStatus: Status[];
  image?: string;
}

const emptySlot = (prompt = ""): Slot => ({
  prompt,
  cells: [undefined, undefined, undefined, undefined],
  cellStatus: ["idle", "idle", "idle", "idle"],
});

/**
 * The four cell descriptions in a prompt. Re writes "Cell 1: ... Cell 2: ..."
 * (any text before Cell 1 is ignored); a prompt without those markers can
 * also be four lines, or four items separated by commas or semicolons.
 */
export function parseCells(prompt: string): string[] | null {
  const marked = [...prompt.matchAll(/cell\s*([1-4])\s*[:.)-]\s*([\s\S]*?)(?=cell\s*[1-4]\s*[:.)-]|$)/gi)];
  if (marked.length >= 4) {
    const byNum: string[] = [];
    for (const m of marked) byNum[Number(m[1]) - 1] = m[2].trim().replace(/\s+/g, " ");
    if (byNum.length === 4 && byNum.every(Boolean)) return byNum;
  }
  for (const sep of [/\n+/, /;/, /,/]) {
    const parts = prompt.split(sep).map((t) => t.trim()).filter(Boolean);
    if (parts.length === 4) return parts;
  }
  return null;
}

function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/**
 * Turn a cell's background pure white (Re, 12 Nov 2026: the model often
 * paints a pale cream/gray card with paper grain behind each object, and the
 * cells are cut out for the book). Two steps, both soft so shadow edges stay
 * smooth: white-balance the whole cell so the card colour (median of a ring
 * just inside the cell's edge) becomes exactly white, then snap the last few
 * levels of paper grain to white and ease the next few toward it. The faint
 * shadow under each object is darker than that and survives.
 */
function whitenBackground(d: Uint8ClampedArray, w: number, h: number) {
  const ring: number[][] = [];
  const inset = Math.round(w * 0.06);
  for (let t = inset; t < w - inset; t += 4) {
    for (const [x, y] of [[t, inset], [t, h - 1 - inset], [inset, t], [w - 1 - inset, t]]) {
      const i = (y * w + x) * 4;
      ring.push([d[i], d[i + 1], d[i + 2]]);
    }
  }
  const med = (k: number) => ring.map((p) => p[k]).sort((a, b) => a - b)[Math.floor(ring.length / 2)];
  const card = [med(0), med(1), med(2)];
  if (Math.min(...card) > 200 && Math.max(...card) - Math.min(...card) < 25) {
    const f = card.map((c) => 255 / c);
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, d[i] * f[0]);
      d[i + 1] = Math.min(255, d[i + 1] * f[1]);
      d[i + 2] = Math.min(255, d[i + 2] * f[2]);
    }
  }
  for (let i = 0; i < d.length; i += 4) {
    const gap = 765 - d[i] - d[i + 1] - d[i + 2];
    if (gap <= 12) {
      d[i] = d[i + 1] = d[i + 2] = 255;
    } else if (gap < 28) {
      const t = (28 - gap) / 16;
      d[i] += (255 - d[i]) * t;
      d[i + 1] += (255 - d[i + 1]) * t;
      d[i + 2] += (255 - d[i + 2]) * t;
    }
  }
}

/** One generated picture, whitened, trimmed to its subject and squared on white. */
async function cleanCell(src: string): Promise<string> {
  const img = await loadImage(src);
  const qw = img.naturalWidth;
  const qh = img.naturalHeight;
  const c = document.createElement("canvas");
  c.width = qw;
  c.height = qh;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(img, 0, 0);
  const data = x.getImageData(0, 0, qw, qh);
  const d = data.data;
  whitenBackground(d, qw, qh);
  x.putImageData(data, 0, 0);
  let minX = qw, minY = qh, maxX = -1, maxY = -1;
  for (let py = 0; py < qh; py++) {
    for (let px = 0; px < qw; px++) {
      const i = (py * qw + px) * 4;
      if (d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236) {
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;
      }
    }
  }
  if (maxX < 0) {
    minX = 0; minY = 0; maxX = qw - 1; maxY = qh - 1;
  }
  const bw = maxX - minX + 1;
  const bh = maxY - minY + 1;
  const side = Math.round(Math.max(bw, bh) * 1.14);
  const size = 1024;
  const o = document.createElement("canvas");
  o.width = size;
  o.height = size;
  const ox = o.getContext("2d")!;
  ox.fillStyle = "#FFFFFF";
  ox.fillRect(0, 0, size, size);
  const s = size / side;
  ox.imageSmoothingQuality = "high";
  ox.drawImage(c, minX, minY, bw, bh, (size - bw * s) / 2, (size - bh * s) / 2, bw * s, bh * s);
  return o.toDataURL("image/png");
}

/** The four cells as one 2 x 2 square with white gutters. */
async function composeGrid(cells: string[]): Promise<string> {
  const size = 2048;
  const gutter = 32;
  const cell = (size - gutter * 3) / 2;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const x = c.getContext("2d")!;
  x.fillStyle = "#FFFFFF";
  x.fillRect(0, 0, size, size);
  const imgs = await Promise.all(cells.map(loadImage));
  imgs.forEach((img, k) => {
    x.drawImage(img, gutter + (k % 2) * (cell + gutter), gutter + Math.floor(k / 2) * (cell + gutter), cell, cell);
  });
  return c.toDataURL("image/png");
}

function save(url: string, name: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
}

export default function BookWatercolorGrid() {
  const [slots, setSlots] = useState<Slot[]>(() => {
    const saved = readSaved();
    return Array.from({ length: SLOTS }, (_, i) => emptySlot(saved[i] ?? ""));
  });
  const [running, setRunning] = useState(false);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(slots.map((s) => s.prompt)));
    } catch {
      /* private mode: prompts just aren't remembered */
    }
  }, [slots]);

  const patchCell = (i: number, k: number, image: string | undefined, status: Status) =>
    setSlots((ss) =>
      ss.map((s, j) => {
        if (j !== i) return s;
        const cells = [...s.cells];
        const cellStatus = [...s.cellStatus];
        cells[k] = image;
        cellStatus[k] = status;
        return { ...s, cells, cellStatus, image: undefined };
      }),
    );

  // Assemble the 2 x 2 grid whenever a slot has all four cells.
  useEffect(() => {
    slots.forEach((s, i) => {
      if (s.image || !s.cells.every(Boolean)) return;
      void composeGrid(s.cells as string[]).then((image) =>
        setSlots((ss) => ss.map((t, j) => (j === i && t.cells.every((c, k) => c === s.cells[k]) ? { ...t, image } : t))),
      );
    });
  }, [slots]);

  const drawCell = async (i: number, k: number, picture: string) => {
    patchCell(i, k, undefined, "loading");
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "book-cell", picture },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      patchCell(i, k, await cleanCell(data.imageDataUrl), "done");
    } catch (e) {
      patchCell(i, k, undefined, "error");
      toast({
        title: `Picture ${i + 1}, cell ${k + 1} failed`,
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const run = async (jobs: { i: number; k: number; picture: string }[]) => {
    if (!jobs.length) return;
    setRunning(true);
    const queue = [...jobs];
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        while (queue.length) {
          const j = queue.shift()!;
          await drawCell(j.i, j.k, j.picture);
        }
      }),
    );
    setRunning(false);
  };

  const jobsFor = (i: number, only?: number) => {
    const parts = parseCells(slotsRef.current[i].prompt);
    if (!parts) {
      toast({
        title: `Prompt ${i + 1}: couldn't find 4 cells`,
        description: 'Write it as "Cell 1: ... Cell 2: ... Cell 3: ... Cell 4: ...".',
        variant: "destructive",
      });
      return [];
    }
    return parts.map((picture, k) => ({ i, k, picture })).filter((j) => only === undefined || j.k === only);
  };

  const makeAll = () => {
    const jobs = slotsRef.current.flatMap((s, i) => (s.prompt.trim() ? jobsFor(i) : []));
    void run(jobs);
  };

  const filled = slots.filter((s) => s.prompt.trim()).length;
  const anyStarted = slots.some((s) => s.cellStatus.some((c) => c !== "idle"));

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Section 2: Book watercolor pictures</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> 5 prompts, 4 pictures each, every picture drawn separately
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Write each prompt as "Cell 1: ... Cell 2: ... Cell 3: ... Cell 4: ...". Every cell is painted as its own
            picture in the book style (pure white background, no text, soft pastel watercolor with paper grain, no black
            outlines, soft light from the upper left, faint gray shadow), cleaned to pure white and squared. The four
            are also put together as a 2 x 2 grid.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {slots.map((s, i) => (
              <div key={i} className="space-y-1">
                <Label htmlFor={`bg-${i}`}>Prompt {i + 1}</Label>
                <Textarea
                  id={`bg-${i}`}
                  rows={5}
                  value={s.prompt}
                  disabled={s.cellStatus.includes("loading")}
                  onChange={(e) => {
                    const prompt = e.target.value;
                    setSlots((ss) => ss.map((t, j) => (j === i ? { ...t, prompt } : t)));
                  }}
                  placeholder={"Cell 1: ...\nCell 2: ...\nCell 3: ...\nCell 4: ..."}
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={makeAll} disabled={running || !filled}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
              Generate {filled * 4 || ""} pictures
            </Button>
            <Button variant="outline" disabled={running} onClick={() => setSlots(Array.from({ length: SLOTS }, () => emptySlot()))}>
              Clear all
            </Button>
            {running && (
              <span className="text-xs text-muted-foreground">
                {slots.reduce((n, s) => n + s.cellStatus.filter((c) => c === "done").length, 0)} done, about 30 seconds
                each, {PARALLEL} at a time...
              </span>
            )}
          </div>

          {anyStarted && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {slots.map((s, i) =>
                s.cellStatus.every((c) => c === "idle") ? null : (
                  <div key={i} className="space-y-2 rounded-md border p-2">
                    <div className="text-xs font-medium">Picture {i + 1}</div>
                    <div className="grid grid-cols-2 gap-1">
                      {s.cellStatus.map((st, k) => (
                        <div key={k} className="relative aspect-square rounded border bg-white overflow-hidden">
                          {s.cells[k] ? (
                            <button
                              type="button"
                              title={`Download cell ${k + 1}`}
                              onClick={() => save(s.cells[k]!, `klovers-book-${i + 1}-cell-${k + 1}.png`)}
                              className="w-full h-full hover:opacity-90"
                            >
                              <img src={s.cells[k]} alt={`Cell ${k + 1}`} className="w-full h-full object-contain" />
                            </button>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {st === "loading" && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                              {st === "error" && <span className="text-[10px] text-destructive">Failed</span>}
                            </div>
                          )}
                          <button
                            type="button"
                            aria-label={`Redo picture ${i + 1} cell ${k + 1}`}
                            disabled={st === "loading"}
                            onClick={() => void run(jobsFor(i, k))}
                            className="absolute bottom-1 right-1 rounded bg-white/90 p-1 border shadow-sm disabled:opacity-40"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" disabled={!s.image} onClick={() => s.image && save(s.image, `klovers-book-${i + 1}.png`)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> 2x2
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!s.cells.some(Boolean)}
                        onClick={() =>
                          s.cells.forEach((c, k) => c && setTimeout(() => save(c, `klovers-book-${i + 1}-cell-${k + 1}.png`), k * 400))
                        }
                      >
                        <Scissors className="h-3.5 w-3.5 mr-1" /> 4 cells
                      </Button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
