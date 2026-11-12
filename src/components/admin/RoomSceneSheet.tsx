import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Home, Loader2, MapPin, Paintbrush, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ROOM_SCENES } from "./roomScenes";
import {
  C,
  EN_FONT,
  KO_FONT,
  cornerColor,
  download,
  drawFooter,
  drawHeader,
  loadImage,
  roundRect,
  storyFrom,
} from "./WatercolorVocabSheet";

/**
 * Style 2: one isometric watercolor room with big Korean/English callouts
 * (Re, 12 Nov 2026, sharing a Seollal room and a bank waiting room: "add
 * generator for style 2 ... must be better as writing in my picture is so
 * small"). Pick a ready room (or type one), Muse Image paints it with no
 * text, gpt-4o names the grid square of each object, and the labels are laid out here
 * on the canvas, much larger than in the originals. Every label bubble and
 * every dot can be dragged on the preview to fix placement by hand.
 */

const W = 1080;
const H = 1350;
// The painted room: 1000 px square, centred between header and footer.
const IMG = { x: 40, y: 196, s: 1000 };
const BUBBLE_H = 118;
const KO_SIZE = 48;
const EN_SIZE = 27;
const TOP = 128;
const BOTTOM = 1272;

interface Pt { x: number; y: number }
interface Lbl {
  korean: string;
  english: string;
  object: string;
  dot?: Pt;
  box?: Pt; // bubble centre
}

type Busy = "" | "suggest" | "paint" | "place";

function bubbleWidth(ctx: CanvasRenderingContext2D, l: Lbl): number {
  ctx.font = `700 ${KO_SIZE}px ${KO_FONT}`;
  const k = ctx.measureText(l.korean).width;
  ctx.font = `400 ${EN_SIZE}px ${EN_FONT}`;
  const e = ctx.measureText(l.english).width;
  return Math.max(170, Math.max(k, e) + 64);
}

/** Put each bubble beside its dot on the nearer side, then push apart. */
function autoLayout(ctx: CanvasRenderingContext2D, labels: Lbl[]): Lbl[] {
  const out = labels.map((l) => ({ ...l }));
  const sides: Record<"L" | "R", number[]> = { L: [], R: [] };
  out.forEach((l, i) => sides[(l.dot?.x ?? 540) < W / 2 ? "L" : "R"].push(i));
  // Keep the two sides balanced (at most 4 on one side).
  while (sides.L.length > 4 || sides.R.length > 4) {
    const [from, to] = sides.L.length > 4 ? (["L", "R"] as const) : (["R", "L"] as const);
    sides[from].sort((a, b) => Math.abs((out[a].dot?.x ?? 540) - 540) - Math.abs((out[b].dot?.x ?? 540) - 540));
    sides[to].push(sides[from].shift()!);
  }
  const gap = BUBBLE_H + 22;
  for (const side of ["L", "R"] as const) {
    const ids = sides[side].sort((a, b) => (out[a].dot?.y ?? 0) - (out[b].dot?.y ?? 0));
    const ys = ids.map((i) => Math.min(BOTTOM - BUBBLE_H / 2, Math.max(TOP + BUBBLE_H / 2, out[i].dot?.y ?? 600)));
    for (let k = 1; k < ys.length; k++) ys[k] = Math.max(ys[k], ys[k - 1] + gap);
    const over = ys.length ? ys[ys.length - 1] - (BOTTOM - BUBBLE_H / 2) : 0;
    if (over > 0) for (let k = 0; k < ys.length; k++) ys[k] -= over;
    for (let k = ys.length - 2; k >= 0; k--) ys[k] = Math.min(ys[k], ys[k + 1] - gap);
    ids.forEach((i, k) => {
      const bw = bubbleWidth(ctx, out[i]);
      const x = side === "L" ? 24 + bw / 2 : W - 24 - bw / 2;
      out[i].box = { x, y: ys[k] };
    });
  }
  return out;
}

function drawRoom(ctx: CanvasRenderingContext2D, img: HTMLImageElement | null, labels: Lbl[], subtitle: string) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = img ? cornerColor(img) : C.page;
  ctx.fillRect(0, 0, W, H);
  if (img) ctx.drawImage(img, IMG.x, IMG.y, IMG.s, IMG.s);
  drawHeader(ctx, subtitle);
  drawFooter(ctx);
  // Leader lines under the bubbles, dots on top of the lines.
  for (const l of labels) {
    if (!l.dot || !l.box) continue;
    ctx.beginPath();
    ctx.moveTo(l.box.x, l.box.y);
    ctx.lineTo(l.dot.x, l.dot.y);
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
  }
  for (const l of labels) {
    if (!l.dot) continue;
    ctx.beginPath();
    ctx.arc(l.dot.x, l.dot.y, 11, 0, Math.PI * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(l.dot.x, l.dot.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = C.ink;
    ctx.fill();
  }
  for (const l of labels) {
    if (!l.box) continue;
    const bw = bubbleWidth(ctx, l);
    const x = l.box.x - bw / 2;
    const y = l.box.y - BUBBLE_H / 2;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, x, y, bw, BUBBLE_H, BUBBLE_H / 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x, y, bw, BUBBLE_H, BUBBLE_H / 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = C.ink;
    ctx.font = `700 ${KO_SIZE}px ${KO_FONT}`;
    ctx.fillText(l.korean, l.box.x, l.box.y + 8);
    ctx.fillStyle = "#6F6A63";
    ctx.font = `400 ${EN_SIZE}px ${EN_FONT}`;
    ctx.fillText(l.english, l.box.x, l.box.y + 42);
  }
}

/**
 * A copy of the painted room with a lettered 12 x 12 grid on it (columns A-L,
 * rows 1-12), sent to the vision model so it can name a square instead of
 * guessing coordinates. Only used for placing dots; never shown or saved.
 */
function gridCopy(img: HTMLImageElement): string {
  const n = 12;
  const s = 1024;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const x = c.getContext("2d")!;
  x.drawImage(img, 0, 0, s, s);
  const cell = s / n;
  x.strokeStyle = "rgba(255,0,80,0.55)";
  x.lineWidth = 2;
  for (let k = 1; k < n; k++) {
    x.beginPath(); x.moveTo(k * cell, 0); x.lineTo(k * cell, s); x.stroke();
    x.beginPath(); x.moveTo(0, k * cell); x.lineTo(s, k * cell); x.stroke();
  }
  x.font = "bold 15px Arial";
  x.textBaseline = "top";
  for (let r = 0; r < n; r++) {
    for (let q = 0; q < n; q++) {
      const t = `${String.fromCharCode(65 + q)}${r + 1}`;
      const w = x.measureText(t).width;
      x.fillStyle = "rgba(255,255,255,0.8)";
      x.fillRect(q * cell + 2, r * cell + 2, w + 4, 17);
      x.fillStyle = "#D00040";
      x.fillText(t, q * cell + 4, r * cell + 3);
    }
  }
  return c.toDataURL("image/jpeg", 0.85);
}

/** The plain room as a smaller JPEG, sent alongside the grid copy. */
function cleanCopy(img: HTMLImageElement): string {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  c.getContext("2d")!.drawImage(img, 0, 0, 1024, 1024);
  return c.toDataURL("image/jpeg", 0.85);
}

/** If the vision step can't find an object, start its dot on a ring round the middle. */
function fallbackDot(i: number, n: number): Pt {
  const a = (i / n) * Math.PI * 2 - Math.PI / 2;
  return { x: IMG.x + IMG.s / 2 + Math.cos(a) * 250, y: IMG.y + IMG.s / 2 + Math.sin(a) * 200 };
}

export default function RoomSceneSheet() {
  const [preset, setPreset] = useState("");
  const [setting, setSetting] = useState("");
  const [subtitle, setSubtitle] = useState("Everyday Korean");
  const [labels, setLabels] = useState<Lbl[]>([]);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [busy, setBusy] = useState<Busy>("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drag = useRef<{ i: number; part: "dot" | "box"; dx: number; dy: number } | null>(null);
  const run = useRef(0);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    void document.fonts?.ready.then(() => drawRoom(ctx, image, labels, subtitle));
  }, [image, labels, subtitle]);

  const invoke = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("generate-ai-room-concept", { body });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  /** Find each object in the painted room and lay the bubbles out. */
  const place = async (img: HTMLImageElement, list: Lbl[], id: number) => {
    setBusy("place");
    let points: (Pt | null)[] = [];
    try {
      const data = await invoke({ mode: "room-locate", cleanImageDataUrl: cleanCopy(img), imageDataUrl: gridCopy(img), objects: list.map((l) => `${l.english}: ${l.object}`) });
      points = data.points ?? [];
    } catch (e) {
      toast({ title: "Couldn't find the objects automatically", description: "Drag each dot onto its object.", variant: "destructive" });
    }
    if (id !== run.current) return;
    const withDots = list.map((l, i) => {
      const p = points[i];
      return { ...l, dot: p ? { x: IMG.x + p.x * IMG.s, y: IMG.y + p.y * IMG.s } : fallbackDot(i, list.length) };
    });
    const ctx = canvasRef.current?.getContext("2d");
    setLabels(ctx ? autoLayout(ctx, withDots) : withDots);
    setImage(img);
    setBusy("");
  };

  const paint = async (list: Lbl[] = labels, where: string = setting) => {
    if (!where.trim() || !list.length) return;
    const id = ++run.current;
    setBusy("paint");
    setImage(null);
    setLabels(list.map((l) => ({ korean: l.korean, english: l.english, object: l.object })));
    try {
      const data = await invoke({ mode: "room-scene", setting: where, objects: list.map((l) => l.object) });
      if (id !== run.current) return;
      const img = await loadImage(data.imageDataUrl);
      await place(img, list, id);
    } catch (e) {
      if (id === run.current) setBusy("");
      toast({ title: "Couldn't paint the room", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    }
  };

  const pickScene = (value: string) => {
    setPreset(value);
    const s = ROOM_SCENES[Number(value)];
    if (!s) return;
    const list = s.labels.map(([korean, english, object]) => ({ korean, english, object }));
    setSetting(s.setting);
    void paint(list, s.setting);
  };

  const suggest = async () => {
    if (!setting.trim()) return;
    setBusy("suggest");
    try {
      const data = await invoke({ mode: "vocab-words", topic: `objects you see inside ${setting}`, count: 6 });
      const list: Lbl[] = (data.words || []).slice(0, 6).map((w: { korean: string; english: string; picture: string }) => ({
        korean: w.korean,
        english: w.english,
        object: w.picture.replace(/^an? /i, ""),
      }));
      setPreset("");
      setImage(null);
      setLabels(list);
    } catch (e) {
      toast({ title: "Couldn't suggest objects", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setBusy("");
    }
  };

  const update = (i: number, patch: Partial<Lbl>) => setLabels((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));

  const relayout = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) setLabels((ls) => autoLayout(ctx, ls));
  };

  // Drag bubbles and dots on the preview.
  const toCanvas = (e: React.PointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !image) return;
    const p = toCanvas(e);
    for (let i = labels.length - 1; i >= 0; i--) {
      const l = labels[i];
      if (l.dot && Math.hypot(p.x - l.dot.x, p.y - l.dot.y) < 30) {
        drag.current = { i, part: "dot", dx: l.dot.x - p.x, dy: l.dot.y - p.y };
        break;
      }
      if (l.box) {
        const bw = bubbleWidth(ctx, l);
        if (Math.abs(p.x - l.box.x) < bw / 2 && Math.abs(p.y - l.box.y) < BUBBLE_H / 2) {
          drag.current = { i, part: "box", dx: l.box.x - p.x, dy: l.box.y - p.y };
          break;
        }
      }
    }
    if (drag.current) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = toCanvas(e);
    update(d.i, { [d.part]: { x: p.x + d.dx, y: p.y + d.dy } });
  };
  const onUp = () => {
    drag.current = null;
  };

  const ready = !!image && labels.every((l) => l.dot && l.box) && !busy;
  const slug = (ROOM_SCENES[Number(preset)]?.en ?? setting).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "room";
  const status =
    busy === "paint" ? "Painting the room (about 30 seconds)..." :
    busy === "place" ? "Finding each object and placing the labels..." :
    busy === "suggest" ? "Suggesting objects..." : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="h-4 w-4" /> Style 2: Labelled room (isometric watercolor)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Choose one of {ROOM_SCENES.length} ready rooms and it is painted straight away, then each word gets a big
          label pointing at its object. Drag any label or dot on the preview to move it.
        </p>
        <div className="grid gap-3 md:grid-cols-2 md:items-end">
          <div className="space-y-1">
            <Label htmlFor="rs-preset">Choose a room ({ROOM_SCENES.length} ready, 6 labels each)</Label>
            <select
              id="rs-preset"
              value={preset}
              disabled={!!busy}
              onChange={(e) => pickScene(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value="">Pick a room...</option>
              {ROOM_SCENES.map((s, i) => (
                <option key={s.en} value={i}>
                  {i + 1}. {s.en} ({s.ko})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rs-sub">Top-right label</Label>
            <Input id="rs-sub" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-1">
            <Label htmlFor="rs-setting">Or your own room</Label>
            <Input id="rs-setting" value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="a Korean noraebang (karaoke room)" />
          </div>
          <Button onClick={suggest} disabled={!!busy || !setting.trim()}>
            {busy === "suggest" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Suggest 6 objects
          </Button>
        </div>

        {labels.length > 0 && (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="space-y-2">
              <div className="grid grid-cols-[1fr_1fr_2fr] gap-2 text-xs font-medium text-muted-foreground px-1">
                <span>Korean</span><span>English</span><span>Object in the room</span>
              </div>
              {labels.map((l, i) => (
                <div key={i} className="grid grid-cols-[1fr_1fr_2fr] gap-2">
                  <Input value={l.korean} onChange={(e) => update(i, { korean: e.target.value })} />
                  <Input value={l.english} onChange={(e) => update(i, { english: e.target.value })} />
                  <Input value={l.object} onChange={(e) => update(i, { object: e.target.value })} />
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <Button onClick={() => void paint()} disabled={!!busy || !setting.trim()}>
                  {busy === "paint" || busy === "place" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Paintbrush className="h-4 w-4 mr-2" />}
                  {image ? "Repaint room" : "Paint room"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!image || !!busy}
                  onClick={() => image && void place(image, labels, ++run.current)}
                >
                  <MapPin className="h-4 w-4 mr-1" /> Find objects again
                </Button>
                <Button variant="outline" onClick={relayout} disabled={!image || !!busy}>
                  <Sparkles className="h-4 w-4 mr-1" /> Tidy labels
                </Button>
                <span className="text-xs text-muted-foreground">{status}</span>
              </div>
            </div>
            <div className="space-y-2">
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className="w-full rounded-md border bg-white touch-none cursor-move"
                onPointerDown={onDown}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onPointerCancel={onUp}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={!ready}
                  onClick={() => canvasRef.current && download(canvasRef.current, `klovers-${slug}-room-post.png`)}
                >
                  <Download className="h-4 w-4 mr-1" /> Post 4:5
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  disabled={!ready}
                  onClick={() => canvasRef.current && download(storyFrom(canvasRef.current), `klovers-${slug}-room-story.png`)}
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
