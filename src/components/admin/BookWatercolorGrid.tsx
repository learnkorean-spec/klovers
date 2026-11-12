import { useEffect, useState } from "react";
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
 * and u generate 5 pictures in the tool". Each prompt becomes one square
 * image: a 2 x 2 grid of four separate watercolor illustrations with white
 * gutters, in her fixed children's-picture-book style (the style text lives
 * in the edge function, so Re only writes what goes in the four cells). The
 * page cuts each picture into its four cells, trimmed and squared on white,
 * ready for the book.
 */

const SLOTS = 5;
const PARALLEL = 3;
const STORE = "klovers-book-grid-prompts";

type Status = "idle" | "loading" | "done" | "error";
interface Slot {
  prompt: string;
  image?: string;
  cells?: string[];
  status: Status;
}

function readSaved(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(STORE) || "[]");
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Cut a 2 x 2 picture into its four cells, each trimmed of white and squared. */
async function cutCells(src: string): Promise<string[]> {
  const img = await loadImage(src);
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  const out: string[] = [];
  for (let k = 0; k < 4; k++) {
    const qx = (k % 2) * Math.floor(W / 2);
    const qy = Math.floor(k / 2) * Math.floor(H / 2);
    const qw = Math.floor(W / 2);
    const qh = Math.floor(H / 2);
    const c = document.createElement("canvas");
    c.width = qw;
    c.height = qh;
    const x = c.getContext("2d", { willReadFrequently: true })!;
    x.drawImage(img, qx, qy, qw, qh, 0, 0, qw, qh);
    const d = x.getImageData(0, 0, qw, qh).data;
    // Bounding box of anything that isn't near-white, ignoring a thin edge
    // strip where a neighbouring cell may bleed across the centre line.
    const edge = Math.round(qw * 0.01);
    let minX = qw, minY = qh, maxX = -1, maxY = -1;
    for (let py = edge; py < qh - edge; py++) {
      for (let px = edge; px < qw - edge; px++) {
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
    out.push(o.toDataURL("image/png"));
  }
  return out;
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
    return Array.from({ length: SLOTS }, (_, i) => ({ prompt: saved[i] ?? "", status: "idle" as Status }));
  });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORE, JSON.stringify(slots.map((s) => s.prompt)));
    } catch {
      /* private mode: prompts just aren't remembered */
    }
  }, [slots]);

  const update = (i: number, patch: Partial<Slot>) => setSlots((ss) => ss.map((s, j) => (j === i ? { ...s, ...patch } : s)));

  const makeOne = async (i: number, prompt: string) => {
    if (!prompt.trim()) return;
    update(i, { status: "loading", image: undefined, cells: undefined });
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "book-grid", prompt },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const cells = await cutCells(data.imageDataUrl);
      update(i, { image: data.imageDataUrl, cells, status: "done" });
    } catch (e) {
      update(i, { status: "error" });
      toast({ title: `Picture ${i + 1} failed`, description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const makeAll = async () => {
    const queue = slots.map((s, i) => ({ i, prompt: s.prompt })).filter((s) => s.prompt.trim());
    if (!queue.length) return;
    setRunning(true);
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        while (queue.length) {
          const job = queue.shift()!;
          await makeOne(job.i, job.prompt);
        }
      }),
    );
    setRunning(false);
  };

  const filled = slots.filter((s) => s.prompt.trim()).length;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Section 2: Book watercolor pictures</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> 5 prompts, 5 pictures (each a 2 x 2 grid of 4 cells)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Write what goes in the four cells for each picture (for example: "an apple, a banana, a bunch of grapes, a
            strawberry"). The book style is added automatically: 2 x 2 grid, white gutters, no text, pure white
            background, soft pastel watercolor with paper grain, no black outlines, soft light from the upper left, faint
            gray shadow. Each finished picture is also cut into its 4 cells for you.
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {slots.map((s, i) => (
              <div key={i} className="space-y-1">
                <Label htmlFor={`bg-${i}`}>Prompt {i + 1}</Label>
                <Textarea
                  id={`bg-${i}`}
                  rows={5}
                  value={s.prompt}
                  disabled={s.status === "loading"}
                  onChange={(e) => update(i, { prompt: e.target.value })}
                  placeholder="4 things for this picture"
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void makeAll()} disabled={running || !filled}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BookOpen className="h-4 w-4 mr-2" />}
              Generate {filled || ""} picture{filled === 1 ? "" : "s"}
            </Button>
            <Button
              variant="outline"
              disabled={running}
              onClick={() => setSlots(Array.from({ length: SLOTS }, () => ({ prompt: "", status: "idle" as Status })))}
            >
              Clear all
            </Button>
            {running && <span className="text-xs text-muted-foreground">About 30 seconds per picture, 3 at a time...</span>}
          </div>

          {slots.some((s) => s.status !== "idle") && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {slots.map((s, i) =>
                s.status === "idle" ? null : (
                  <div key={i} className="space-y-2 rounded-md border p-2">
                    <div className="text-xs font-medium">Picture {i + 1}</div>
                    <div className="aspect-square w-full rounded bg-muted flex items-center justify-center overflow-hidden">
                      {s.status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}
                      {s.status === "error" && <span className="text-xs text-destructive">Failed</span>}
                      {s.image && <img src={s.image} alt={`Picture ${i + 1}`} className="w-full h-full object-contain bg-white" />}
                    </div>
                    {s.cells && (
                      <div className="grid grid-cols-4 gap-1">
                        {s.cells.map((c, k) => (
                          <button
                            key={k}
                            type="button"
                            title={`Download cell ${k + 1}`}
                            onClick={() => save(c, `klovers-book-${i + 1}-cell-${k + 1}.png`)}
                            className="aspect-square rounded border bg-white overflow-hidden hover:ring-2 hover:ring-primary"
                          >
                            <img src={c} alt={`Cell ${k + 1}`} className="w-full h-full object-contain" />
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" disabled={!s.image} onClick={() => s.image && save(s.image, `klovers-book-${i + 1}.png`)}>
                        <Download className="h-3.5 w-3.5 mr-1" /> Full
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!s.cells}
                        onClick={() => s.cells?.forEach((c, k) => setTimeout(() => save(c, `klovers-book-${i + 1}-cell-${k + 1}.png`), k * 400))}
                      >
                        <Scissors className="h-3.5 w-3.5 mr-1" /> 4 cells
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`Redo picture ${i + 1}`}
                        disabled={s.status === "loading" || !s.prompt.trim()}
                        onClick={() => void makeOne(i, s.prompt)}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
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
