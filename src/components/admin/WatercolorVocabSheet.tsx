import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Loader2, Palette, RefreshCw, Sparkles, Trash2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { VOCAB_TOPICS } from "./vocabTopics";

/**
 * Watercolor vocabulary sheets for social posts, in the KLOVERS "Everyday
 * Korean" style (Re, 12 Nov 2026: "write for example 16 pictures about
 * studying, they must give me similar pictures to this style"; then "only 9
 * pictures, prepare 50 topics in drop list ... i click the topic it generate
 * 9"). Every sheet is a 3 x 3 grid. Pick one of 50 ready topics and its 9
 * pictures start drawing at once, or type any topic and have 9 words
 * suggested first. Each picture is each picture is one Muse Image call on the Meta Model API, and the
 * sheet itself is laid out here on a canvas so the header, cards and footer
 * match the shared examples exactly instead of being left to the image model.
 */

type Status = "idle" | "loading" | "done" | "error";

interface Word {
  korean: string;
  english: string;
  picture: string;
  image?: string;
  status: Status;
}

const COUNT = 9;
const GRID: Record<number, [number, number]> = { 9: [3, 3] };
const PARALLEL = 3;

// Measured from the 1080 x 1350 sheet inside Re's examples.
const W = 1080;
const H = 1350;
export const C = {
  page: "#FBF8F0",
  ink: "#2E2E2E",
  sub: "#8C8780",
  line: "#C9C4BA",
  cardBorder: "#ECE6DA",
  yellow: "#FFF35C",
  yellowEdge: "#D9CB2E",
};
export const KO_FONT = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";
export const EN_FONT = "Inter, 'Segoe UI', Arial, sans-serif";
const BRAND_FONT = "Poppins, 'Segoe UI', Arial, sans-serif";

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** The colour at an image's corner, so the card's picture area blends into it. */
export function cornerColor(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 8;
  c.height = 8;
  const x = c.getContext("2d");
  if (!x) return "#FAF6EC";
  x.drawImage(img, 0, 0, img.naturalWidth * 0.04, img.naturalHeight * 0.04, 0, 0, 8, 8);
  const d = x.getImageData(0, 0, 8, 8).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}

/** KLOVERS header (K badge, wordmark, top-right label, rule), shared by both styles. */
export function drawHeader(ctx: CanvasRenderingContext2D, subtitle: string) {
  ctx.beginPath();
  ctx.arc(100, 62, 23, 0, Math.PI * 2);
  ctx.fillStyle = C.yellow;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = C.yellowEdge;
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.font = `800 21px ${BRAND_FONT}`;
  ctx.fillText("K", 100, 63);
  ctx.textAlign = "left";
  ctx.font = `800 29px ${BRAND_FONT}`;
  ctx.letterSpacing = "3px";
  ctx.fillText("KLOVERS", 135, 63);
  ctx.textAlign = "right";
  ctx.font = `500 14px ${EN_FONT}`;
  ctx.letterSpacing = "2.5px";
  ctx.fillStyle = "#3D3A36";
  ctx.fillText(subtitle.toUpperCase(), 1003, 63);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = C.line;
  ctx.fillRect(77, 100, 926, 2);
}

/** Footer rule and site address, shared by both styles. */
export function drawFooter(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = C.line;
  ctx.fillRect(77, 1290, 926, 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = C.ink;
  ctx.font = `700 19px ${BRAND_FONT}`;
  ctx.letterSpacing = "1px";
  ctx.fillText("kloversegy.com", 80, 1318);
  ctx.letterSpacing = "0px";
}

async function drawSheet(ctx: CanvasRenderingContext2D, words: Word[], subtitle: string) {
  await document.fonts?.ready;
  const [cols, rows] = GRID[words.length] ?? [3, 3];
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, W, H);
  drawHeader(ctx, subtitle);

  // Cards.
  const gx = 13, gy = 16, x0 = 77, y0 = 125, gw = 926, gh = 1146;
  const cw = (gw - gx * (cols - 1)) / cols;
  const ch = (gh - gy * (rows - 1)) / rows;
  const labelH = Math.max(58, Math.round(cw * 0.26));
  const koSize = Math.round(Math.min(cw * 0.086, 30));
  const enSize = Math.round(Math.min(cw * 0.064, 22));
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const x = x0 + (i % cols) * (cw + gx);
    const y = y0 + Math.floor(i / cols) * (ch + gy);
    ctx.save();
    roundRect(ctx, x, y, cw, ch, 8);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.clip();
    const ih = ch - labelH;
    if (w.image) {
      try {
        const img = await loadImage(w.image);
        ctx.fillStyle = cornerColor(img);
        ctx.fillRect(x, y, cw, ih);
        const s = Math.min(cw, ih);
        ctx.drawImage(img, x + (cw - s) / 2, y + (ih - s) / 2, s, s);
      } catch {
        ctx.fillStyle = "#FAF6EC";
        ctx.fillRect(x, y, cw, ih);
      }
    } else {
      ctx.fillStyle = "#FAF6EC";
      ctx.fillRect(x, y, cw, ih);
    }
    ctx.restore();
    roundRect(ctx, x + 0.75, y + 0.75, cw - 1.5, ch - 1.5, 8);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = C.cardBorder;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.ink;
    ctx.font = `700 ${koSize}px ${KO_FONT}`;
    ctx.fillText(w.korean, x + cw / 2, y + ih + labelH * 0.5);
    ctx.fillStyle = C.sub;
    ctx.font = `400 ${enSize}px ${EN_FONT}`;
    ctx.fillText(w.english, x + cw / 2, y + ih + labelH * 0.5 + enSize * 1.35);
  }

  drawFooter(ctx);
}

/** The 9:16 story version: the sheet over a soft, blurred copy of itself. */
export function storyFrom(sheet: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1920;
  const x = c.getContext("2d")!;
  x.filter = "blur(36px) saturate(0.9)";
  const s = 1920 / H;
  x.drawImage(sheet, (1080 - W * s) / 2, 0, W * s, 1920);
  x.filter = "none";
  x.fillStyle = "rgba(205, 200, 188, 0.55)";
  x.fillRect(0, 0, 1080, 1920);
  x.drawImage(sheet, 0, (1920 - H) / 2);
  return c;
}

export function download(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, "image/png");
}

export default function WatercolorVocabSheet() {
  const [topic, setTopic] = useState("studying");
  const [preset, setPreset] = useState("");
  const [subtitle, setSubtitle] = useState("Everyday Korean");
  const [words, setWords] = useState<Word[]>([]);
  const [suggesting, setSuggesting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wordsRef = useRef<Word[]>([]);
  wordsRef.current = words;

  const drawGen = useRef(0);
  useEffect(() => {
    if (!words.length) return;
    // Draw off-screen, then copy only the newest render, so an older redraw
    // still loading pictures can't paint over a newer one.
    const gen = ++drawGen.current;
    const off = document.createElement("canvas");
    off.width = W;
    off.height = H;
    const octx = off.getContext("2d");
    if (!octx) return;
    void drawSheet(octx, words, subtitle).then(() => {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && gen === drawGen.current) {
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(off, 0, 0);
      }
    });
  }, [words, subtitle]);

  const suggest = async () => {
    if (!topic.trim()) return;
    setSuggesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "vocab-words", topic, count: COUNT },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list: Word[] = (data.words || []).map((w: Omit<Word, "status">) => ({ ...w, status: "idle" as Status }));
      if (list.length !== COUNT) {
        toast({ title: `Got ${list.length} of ${COUNT} words`, description: "Add or remove rows to make 9." });
      }
      setPreset("");
      setWords(list.slice(0, COUNT));
    } catch (e) {
      toast({ title: "Couldn't suggest words", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setSuggesting(false);
    }
  };

  const update = (i: number, patch: Partial<Word>) =>
    setWords((ws) => ws.map((w, j) => (j === i ? { ...w, ...patch } : w)));

  const drawOne = async (i: number) => {
    const w = wordsRef.current[i];
    if (!w?.picture.trim()) return;
    update(i, { status: "loading" });
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", {
        body: { mode: "vocab-icon", picture: w.picture },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      update(i, { image: data.imageDataUrl, status: "done" });
    } catch (e) {
      update(i, { status: "error" });
      toast({ title: `Picture failed: ${w.korean}`, description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const drawAll = async (list: Word[] = words) => {
    const todo = list.map((w, i) => (w.image ? -1 : i)).filter((i) => i >= 0);
    if (!todo.length) return;
    setDrawing(true);
    const queue = [...todo];
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL, queue.length) }, async () => {
        while (queue.length) await drawOne(queue.shift()!);
      }),
    );
    setDrawing(false);
  };

  /** Pick a ready topic: load its 9 words and start painting straight away. */
  const pickTopic = (value: string) => {
    setPreset(value);
    const t = VOCAB_TOPICS[Number(value)];
    if (!t) return;
    const list: Word[] = t.words.map(([korean, english, picture]) => ({ korean, english, picture, status: "idle" }));
    setTopic(t.en.toLowerCase());
    wordsRef.current = list;
    setWords(list);
    void drawAll(list);
  };

  const validCount = words.length === COUNT;
  const doneCount = words.filter((w) => w.image).length;
  const slug = topic.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "vocab";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="h-4 w-4" /> Style 1: Watercolor word grid (9 pictures)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose one of 50 ready topics and its 9 pictures are painted straight away by Muse Image
          in the KLOVERS watercolor style, laid out like the Everyday Korean posts. Or type your own
          topic and have 9 words suggested first.
        </p>
        <div className="grid gap-3 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <Label htmlFor="vs-preset">Choose a topic (50 ready, 9 pictures each)</Label>
            <select
              id="vs-preset"
              value={preset}
              disabled={drawing || suggesting}
              onChange={(e) => pickTopic(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Pick a topic...</option>
              {VOCAB_TOPICS.map((t, i) => (
                <option key={t.en} value={i}>
                  {i + 1}. {t.en} ({t.ko})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="vs-sub">Top-right label</Label>
            <Input id="vs-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="vs-topic">Or your own topic</Label>
            <Input id="vs-topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="studying" />
          </div>
          <Button onClick={suggest} disabled={suggesting || drawing || !topic.trim()}>
            {suggesting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Suggest 9 words
          </Button>
        </div>

        {words.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Korean</span><span>English</span><span>What to paint</span><span />
              </div>
              {words.map((w, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2 items-center">
                  <Input value={w.korean} onChange={(e) => update(i, { korean: e.target.value })} />
                  <Input value={w.english} onChange={(e) => update(i, { english: e.target.value })} />
                  <Input
                    value={w.picture}
                    onChange={(e) => update(i, { picture: e.target.value, image: undefined, status: "idle" })}
                  />
                  <div className="flex items-center gap-1">
                    {w.image && <img src={w.image} alt={w.english} className="h-9 w-9 rounded object-cover border" />}
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Redraw ${w.english}`}
                      disabled={w.status === "loading" || !w.picture.trim()}
                      onClick={() => void drawOne(i)}
                    >
                      {w.status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Remove ${w.english}`}
                      disabled={drawing}
                      onClick={() => setWords((ws) => ws.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={drawing || words.length >= COUNT}
                  onClick={() => setWords((ws) => [...ws, { korean: "", english: "", picture: "", status: "idle" }])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add word
                </Button>
                <Button onClick={() => void drawAll()} disabled={drawing || !validCount || doneCount === words.length}>
                  {drawing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Palette className="h-4 w-4 mr-2" />}
                  Draw {doneCount ? `the remaining ${words.length - doneCount}` : `all ${words.length}`} pictures
                </Button>
                <span className="text-xs text-muted-foreground">
                  {validCount
                    ? `${doneCount}/${words.length} drawn`
                    : `A sheet needs exactly 9 words (now ${words.length}).`}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <canvas ref={canvasRef} width={W} height={H} className="w-full rounded-md border bg-white" />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={!validCount || doneCount < words.length}
                  onClick={() => canvasRef.current && download(canvasRef.current, `klovers-${slug}-post.png`)}
                >
                  <Download className="h-4 w-4 mr-1" /> Post 4:5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={!validCount || doneCount < words.length}
                  onClick={() => canvasRef.current && download(storyFrom(canvasRef.current), `klovers-${slug}-story.png`)}
                >
                  <Download className="h-4 w-4 mr-1" /> Story 9:16
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
