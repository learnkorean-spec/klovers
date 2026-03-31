import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, Trash2, ChevronLeft, ChevronRight, Grid3X3, Upload, Monitor, Smartphone, FileDown, Wand2, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getLevelLabel, getUrgencyLabel } from "@/lib/marketingEngine";

// ─── Types ───
interface PostData {
  id: string;
  mainText: string;
  subtitle: string;
  extraText: string;
}

type FormatKey = "instagram" | "story" | "facebook" | "tiktok";
interface FormatOption { label: string; w: number; h: number; }

const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post",  w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post",   w: 1200, h: 630  },
  tiktok:    { label: "TikTok Cover",    w: 1080, h: 1920 },
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ─── Canvas helpers ───
function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + rw - r, y);
  ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
  ctx.lineTo(x + rw, y + rh - r);
  ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
  ctx.lineTo(x + r, y + rh);
  ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Fixed wrapText — returns actual end Y so callers can chain text below it
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  maxW: number, lineH: number, maxLines = 99,
): number {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  const capped = lines.slice(0, maxLines);
  capped.forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + (capped.length - 1) * lineH + lineH; // bottom of last line
}

// ─── Canvas Renderer ───
function renderPost(
  canvas: HTMLCanvasElement,
  post: PostData,
  format: FormatKey,
  bgImage?: HTMLImageElement | null,
) {
  const fmt = FORMATS[format];
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  const s = w / 1080;
  const isPortrait = h > w;

  ctx.clearRect(0, 0, w, h);

  // ─── PHOTO SPLIT LAYOUT ───────────────────────────────────
  if (bgImage) {
    if (isPortrait) {
      // Photo top 42%, yellow text zone bottom 58%
      const splitY = h * 0.42;
      const slant = w * 0.07;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let pw = w, ph = w / pR;
      if (ph < splitY + slant) { ph = splitY + slant; pw = ph * pR; }
      ctx.drawImage(bgImage, (w - pw) / 2, 0, pw, ph);
      const fadeGrad = ctx.createLinearGradient(0, splitY * 0.4, 0, splitY + slant);
      fadeGrad.addColorStop(0, "rgba(0,0,0,0)"); fadeGrad.addColorStop(1, "rgba(0,0,0,0.5)");
      ctx.fillStyle = fadeGrad; ctx.fill();
      ctx.restore();

      ctx.save(); ctx.beginPath();
      ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      ctx.fillStyle = "#FFFF00"; ctx.fill(); ctx.restore();

      ctx.save(); ctx.beginPath();
      ctx.moveTo(0, splitY - 4 * s); ctx.lineTo(w, splitY + slant - 4 * s);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.fillStyle = "#111"; ctx.fill(); ctx.restore();

      const tL = 40 * s, tTop = splitY + slant + 24 * s, tW = w - 80 * s;
      ctx.fillStyle = "#111"; ctx.font = `700 ${13 * s}px 'Arial', sans-serif`;
      ctx.fillText("KOREAN COURSE", tL, tTop + 14 * s);
      ctx.fillRect(tL, tTop + 21 * s, 52 * s, 3 * s);

      const mLen = post.mainText.length;
      const mSize = Math.round((mLen > 22 ? 64 : mLen > 15 ? 78 : 90) * s);
      ctx.font = `900 ${mSize}px 'Arial Black', 'Impact', sans-serif`;
      ctx.fillStyle = "#111";
      const afterMain = wrapText(ctx, post.mainText, tL, tTop + 50 * s, tW, mSize * 1.15, 2);

      if (post.subtitle) {
        const sSize = Math.round(38 * s);
        ctx.font = `500 ${sSize}px 'Arial', sans-serif`;
        ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, tL, afterMain + 18 * s, tW, sSize * 1.4, 2);
      }

      // CTA
      const ctaY = h - 80 * s;
      ctx.fillStyle = "#111"; rRect(ctx, tL, ctaY, 180 * s, 44 * s, 22 * s); ctx.fill();
      ctx.font = `bold ${14 * s}px 'Arial Black', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("Register Now →", tL + 90 * s, ctaY + 28 * s);
      ctx.textAlign = "left";
      if (post.extraText) {
        ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.font = `${11 * s}px 'Arial', sans-serif`;
        ctx.fillText(post.extraText, tL, h - 18 * s);
      }

    } else {
      // Landscape: photo left 46%, yellow right 54%
      const splitX = w * 0.46, slant = h * 0.05;
      ctx.save(); ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
      ctx.lineTo(splitX, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let ph = h, pw = h * pR;
      if (pw < splitX + slant) { pw = splitX + slant; ph = pw / pR; }
      ctx.drawImage(bgImage, 0, (h - ph) / 2, pw, ph); ctx.restore();

      ctx.save(); ctx.beginPath();
      ctx.moveTo(splitX - 4 * s, 0); ctx.lineTo(splitX + slant - 4 * s, h);
      ctx.lineTo(splitX + slant, h); ctx.lineTo(splitX, 0);
      ctx.closePath(); ctx.fillStyle = "#111"; ctx.fill(); ctx.restore();

      ctx.save(); ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h);
      ctx.lineTo(splitX + slant, h); ctx.closePath();
      ctx.fillStyle = "#FFFF00"; ctx.fill(); ctx.restore();

      const tL = splitX + slant + 28 * s, tW = w - tL - 28 * s;
      ctx.fillStyle = "#111"; ctx.font = `700 ${12 * s}px 'Arial', sans-serif`;
      ctx.fillText("KOREAN COURSE", tL, h * 0.15);
      ctx.fillRect(tL, h * 0.15 + 8 * s, 48 * s, 3 * s);

      const mLen = post.mainText.length;
      const mSize = Math.round((mLen > 22 ? 52 : mLen > 15 ? 62 : 74) * s);
      ctx.font = `900 ${mSize}px 'Arial Black', 'Impact', sans-serif`; ctx.fillStyle = "#111";
      const afterMain = wrapText(ctx, post.mainText, tL, h * 0.26, tW, mSize * 1.15, 2);

      if (post.subtitle) {
        const sSize = Math.round(32 * s);
        ctx.font = `500 ${sSize}px 'Arial', sans-serif`; ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, tL, afterMain + 12 * s, tW, sSize * 1.4, 2);
      }

      const logoY = h - 36 * s;
      ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(tL + 16 * s, logoY, 14 * s, 0, Math.PI * 2); ctx.fill();
      ctx.font = `bold ${14 * s}px 'Arial', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("K", tL + 16 * s, logoY + 5 * s); ctx.textAlign = "left";
      ctx.fillStyle = "#111"; ctx.font = `bold ${11 * s}px 'Arial', sans-serif`;
      ctx.fillText("KLOVERS", tL + 36 * s, logoY + 5 * s);
    }
    return;
  }

  // ─── NO-PHOTO: Classic Brand Layout ──────────────────────
  ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, h);

  // Diagonal black triangle (bottom-right)
  ctx.fillStyle = "#111"; ctx.beginPath();
  ctx.moveTo(w * 0.46, h); ctx.lineTo(w, h * 0.42); ctx.lineTo(w, h);
  ctx.closePath(); ctx.fill();

  // Korean watermark
  ctx.save();
  ctx.font = `900 ${Math.round(520 * s)}px 'Arial', serif`;
  ctx.fillStyle = "rgba(0,0,0,0.055)"; ctx.textAlign = "center";
  ctx.fillText("한", w * 0.52, h * 0.72); ctx.restore();

  // Left accent bar
  ctx.fillStyle = "#111"; ctx.fillRect(0, 0, 16 * s, h * 0.62);

  // Eyebrow
  const eyeSize = Math.round(26 * s);
  ctx.font = `bold ${eyeSize}px 'Arial', sans-serif`;
  ctx.fillStyle = "#111"; ctx.textAlign = "left"; ctx.letterSpacing = `${3 * s}px`;
  ctx.fillText("KOREAN COURSE", 48 * s, 68 * s); ctx.letterSpacing = "0px";
  ctx.fillRect(48 * s, 77 * s, 200 * s, 3 * s);

  // Main title
  const charLen = post.mainText.length;
  const mSize = Math.round((charLen > 22 ? 72 : charLen > 16 ? 90 : 110) * s);
  ctx.font = `900 ${mSize}px 'Arial Black', 'Impact', sans-serif`;
  ctx.fillStyle = "#000"; ctx.textAlign = "left";
  const afterMain = wrapText(ctx, post.mainText, 48 * s, h * 0.28, w * 0.60, mSize * 1.18, 2);

  // Subtitle lines
  if (post.subtitle) {
    const lines = post.subtitle.split("\n");
    const schedSize = Math.round(44 * s);
    ctx.font = `bold ${schedSize}px 'Arial', sans-serif`; ctx.fillStyle = "#111";
    let lineY = Math.max(afterMain + 20 * s, h * 0.54);
    for (const line of lines) {
      if (line.startsWith("🔴") || line.startsWith("⚡")) {
        ctx.save(); ctx.fillStyle = "#111";
        const pillW = ctx.measureText(line).width + 30 * s;
        const pillH = schedSize * 1.4;
        rRect(ctx, 48 * s, lineY - schedSize * 0.85, pillW, pillH, pillH / 2);
        ctx.fill(); ctx.fillStyle = "#FFFF00";
        ctx.fillText(line, 64 * s, lineY); ctx.restore();
      } else {
        ctx.fillText(line, 48 * s, lineY);
      }
      lineY += schedSize * 1.45;
    }
  }

  // CTA pill
  const ctaSize = Math.round(34 * s);
  ctx.font = `bold ${ctaSize}px 'Arial Black', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  const ctaText = "Register Now →";
  const ctaW = ctx.measureText(ctaText).width + 48 * s;
  const ctaH = ctaSize * 1.8;
  const ctaX = w * 0.54, ctaY = h * 0.78;
  rRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2); ctx.fill();
  ctx.fillStyle = "#111"; ctx.fillText(ctaText, ctaX + 24 * s, ctaY + ctaH * 0.65);

  // Bottom brand strip
  const stripH = 88 * s;
  ctx.fillStyle = "#111"; ctx.fillRect(0, h - stripH, w, stripH);
  ctx.font = `bold ${26 * s}px 'Arial', sans-serif`;
  ctx.fillStyle = "#FFFF00"; ctx.textAlign = "left";
  ctx.fillText(post.extraText || "#LearnKorean  #Klovers", 48 * s, h - stripH / 2 + 9 * s);
  ctx.font = `900 ${32 * s}px 'Arial Black', 'Impact', sans-serif`;
  ctx.fillStyle = "#FFFF00"; ctx.textAlign = "right";
  ctx.fillText("KLOVERS", w - 36 * s, h - stripH / 2 + 11 * s);
  ctx.textAlign = "left";
}

// ─── Platform Grid Previews ───
function PlatformGridPreviews({ posts, bgImage }: {
  posts: PostData[];
  bgImage: HTMLImageElement | null;
}) {
  const igRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const fbRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const stRefs  = useRef<(HTMLCanvasElement | null)[]>([]);
  const ttRefs  = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    posts.slice(0, 9).forEach((post, i) => {
      const ig = igRefs.current[i]; if (ig) { ig.width = 300; ig.height = 300; renderPost(ig, post, "instagram", bgImage); }
      const fb = fbRefs.current[i]; if (fb) { fb.width = 360; fb.height = 189; renderPost(fb, post, "facebook", bgImage); }
      const st = stRefs.current[i]; if (st) { st.width = 180; st.height = 320; renderPost(st, post, "story", bgImage); }
      const tt = ttRefs.current[i]; if (tt) { tt.width = 180; tt.height = 320; renderPost(tt, post, "tiktok", bgImage); }
    });
  }, [posts, bgImage]);

  const display = posts.slice(0, 9);
  if (!display.length) return null;
  const cols = Math.min(3, display.length);

  return (
    <Tabs defaultValue="instagram" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="instagram" className="text-xs gap-1.5"><Grid3X3 className="h-3.5 w-3.5" /> Instagram</TabsTrigger>
        <TabsTrigger value="facebook"  className="text-xs gap-1.5"><Monitor    className="h-3.5 w-3.5" /> Facebook</TabsTrigger>
        <TabsTrigger value="stories"   className="text-xs gap-1.5"><Smartphone className="h-3.5 w-3.5" /> Stories</TabsTrigger>
        <TabsTrigger value="tiktok"    className="text-xs gap-1.5"><Smartphone className="h-3.5 w-3.5" /> TikTok</TabsTrigger>
      </TabsList>

      <TabsContent value="instagram">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="bg-card border rounded-t-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
            <div><p className="text-xs font-bold text-foreground">klovers_academy</p><p className="text-[10px] text-muted-foreground">{display.length} posts</p></div>
          </div>
          <div className="grid gap-0.5 rounded-b-xl overflow-hidden border border-t-0 bg-border" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 160 }}>
            {display.map((p, i) => <canvas key={p.id} ref={el => { igRefs.current[i] = el; }} className="w-full aspect-square" />)}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1080 — Instagram grid preview</p>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="facebook">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="space-y-3 max-w-md mx-auto">
            {display.slice(0, 4).map((p, i) => (
              <div key={p.id} className="bg-card border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">K</div>
                  <div><p className="text-[10px] font-semibold text-foreground">KLovers Academy</p><p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p></div>
                </div>
                <canvas ref={el => { fbRefs.current[i] = el; }} className="w-full aspect-[1200/630]" />
                <div className="flex items-center justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground">
                  <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="stories">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {display.slice(0, 6).map((p, i) => (
              <div key={p.id} className="shrink-0 space-y-1">
                <div className="w-20 rounded-xl overflow-hidden border-2 border-primary shadow-md">
                  <canvas ref={el => { stRefs.current[i] = el; }} className="w-full aspect-[9/16]" />
                </div>
                <p className="text-[9px] text-muted-foreground text-center truncate w-20">{p.mainText.slice(0, 14)}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — Swipeable story sequence</p>
        </CardContent></Card>
      </TabsContent>

      <TabsContent value="tiktok">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="grid gap-0.5 rounded-xl overflow-hidden border bg-border mx-auto" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 100 }}>
            {display.map((p, i) => <canvas key={p.id} ref={el => { ttRefs.current[i] = el; }} className="w-full aspect-[9/16]" />)}
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — TikTok profile grid</p>
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component ───
export default function CreatorHub() {
  const [posts, setPosts] = useState<PostData[]>([
    { id: uid(), mainText: "Korean Level 1", subtitle: "Friday • 6:00 PM\n60 min / session", extraText: "#LearnKorean  #Klovers  #KoreanCourse" },
    { id: uid(), mainText: "Master Hangul in 2 Weeks!", subtitle: "Free Hangul Challenge — Join Now", extraText: "#Hangul  #Korean  #Klovers" },
    { id: uid(), mainText: "Why Learn Korean?", subtitle: "5 Reasons to Start Today", extraText: "#KoreanLanguage  #Motivation" },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [format, setFormat] = useState<FormatKey>("instagram");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [zipping, setZipping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePost = posts[activeIndex] || posts[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePost) return;
    const fmt = FORMATS[format];
    const maxPreview = 560;
    canvas.width  = maxPreview;
    canvas.height = Math.round(maxPreview * (fmt.h / fmt.w));
    renderPost(canvas, activePost, format, bgImage);
  }, [activePost, format, bgImage]);

  useEffect(() => { redraw(); }, [redraw]);

  function updatePost(field: keyof PostData, value: string) {
    setPosts(prev => prev.map((p, i) => i === activeIndex ? { ...p, [field]: value } : p));
  }

  function addPost() {
    const newPost: PostData = { id: uid(), mainText: "", subtitle: "", extraText: "#LearnKorean  #Klovers" };
    setPosts(prev => [...prev, newPost]);
    setActiveIndex(posts.length);
  }

  function removePost(idx: number) {
    if (posts.length <= 1) return;
    setPosts(prev => prev.filter((_, i) => i !== idx));
    setActiveIndex(Math.max(0, activeIndex >= idx ? activeIndex - 1 : activeIndex));
  }

  function handleBgUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  }

  // ── Import posts from real schedule ──
  async function importFromSchedule() {
    setImporting(true);
    try {
      const { data: pkgGroups } = await supabase
        .from("pkg_groups").select("id, name, capacity, package_id").eq("is_active", true);
      if (!pkgGroups?.length) { toast({ title: "No active groups found" }); return; }

      const packageIds = [...new Set(pkgGroups.map(g => g.package_id))];
      const { data: packages } = await supabase
        .from("schedule_packages").select("id, level, day_of_week, start_time, duration_min").in("id", packageIds);
      const { data: members } = await supabase
        .from("pkg_group_members").select("group_id").eq("member_status", "active");

      const pkgMap = new Map((packages || []).map(p => [p.id, p]));
      const counts = new Map<string, number>();
      (members || []).forEach(m => counts.set(m.group_id, (counts.get(m.group_id) || 0) + 1));

      const newPosts: PostData[] = [];
      for (const g of pkgGroups) {
        const pkg = pkgMap.get(g.package_id);
        if (!pkg) continue;
        const active = counts.get(g.id) || 0;
        const seatsLeft = g.capacity - active;
        if (seatsLeft <= 0) continue;

        const level = getLevelLabel(pkg.level);
        const dayName = DAY_NAMES[pkg.day_of_week] || "";
        const [hh, mm] = pkg.start_time.split(":");
        const h = parseInt(hh), ampm = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
        const time = `${h12}:${mm} ${ampm}`;
        const urgency = getUrgencyLabel(seatsLeft);
        const urgencyLine = seatsLeft <= 3 ? `\n🔴 Only ${seatsLeft} seats left!` : seatsLeft <= 6 ? `\n⚡ ${seatsLeft} seats left` : "";

        newPosts.push({
          id: uid(),
          mainText: level,
          subtitle: `${dayName} • ${time}\n${pkg.duration_min} min / session${urgencyLine}`,
          extraText: urgency === "Last Seats" ? "#LastSeats  #Klovers  #KoreanCourse" : "#LearnKorean  #Klovers  #KoreanCourse",
        });
      }

      if (!newPosts.length) { toast({ title: "All groups are full — no open seats to promote" }); return; }
      setPosts(newPosts);
      setActiveIndex(0);
      toast({ title: `Imported ${newPosts.length} posts from schedule`, description: "Ready to render and download." });
    } catch (err: any) {
      toast({ title: "Import error", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  }

  function handleDownload() {
    const fmt = FORMATS[format];
    const dl = document.createElement("canvas");
    dl.width = fmt.w; dl.height = fmt.h;
    renderPost(dl, activePost, format, bgImage);
    const a = document.createElement("a");
    a.download = `klovers-post-${format}-${Date.now()}.png`;
    a.href = dl.toDataURL("image/png"); a.click();
    toast({ title: "Downloaded!", description: `${fmt.w}×${fmt.h}` });
  }

  async function downloadZip(platform: "instagram" | "tiktok" | "all") {
    setZipping(true);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      const sizes: FormatKey[] = platform === "instagram" ? ["instagram", "story"] : platform === "tiktok" ? ["tiktok"] : ["instagram", "story", "facebook", "tiktok"];
      posts.forEach((post, pi) => {
        const slug = (post.mainText || `post-${pi + 1}`).replace(/[^a-z0-9]+/gi, "-").toLowerCase().slice(0, 30);
        sizes.forEach(size => {
          const fmt = FORMATS[size];
          const c = document.createElement("canvas");
          c.width = fmt.w; c.height = fmt.h;
          renderPost(c, post, size, bgImage);
          const base64 = c.toDataURL("image/png").split(",")[1];
          zip.file(`${slug}-${size}.png`, base64, { base64: true });
        });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `klovers-${platform}-${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "ZIP downloaded!", description: `${posts.length} posts × ${sizes.length} sizes` });
    } catch (err: any) {
      toast({ title: "ZIP error", description: err.message, variant: "destructive" });
    } finally {
      setZipping(false);
    }
  }

  function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const lines = (ev.target?.result as string).split("\n").filter(l => l.trim());
      const newPosts: PostData[] = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { id: uid(), mainText: parts[0] || "", subtitle: parts[1] || "", extraText: parts[2] || "#LearnKorean #Klovers" };
      });
      if (newPosts.length) { setPosts(prev => [...prev, ...newPosts]); toast({ title: `Imported ${newPosts.length} posts` }); }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Editor + Controls */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Left: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium text-foreground">{activeIndex + 1} / {posts.length}</span>
              <Button size="sm" variant="ghost" disabled={activeIndex >= posts.length - 1} onClick={() => setActiveIndex(activeIndex + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl border shadow-md max-w-full" style={{ maxHeight: 560 }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {FORMATS[format].w}×{FORMATS[format].h} — {FORMATS[format].label}
          </p>

          {/* Download buttons */}
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            <Button variant="outline" onClick={() => downloadZip("instagram")} disabled={zipping}>
              {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              Instagram ZIP
            </Button>
            <Button variant="outline" onClick={() => downloadZip("tiktok")} disabled={zipping}>
              {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              TikTok ZIP
            </Button>
            {posts.length > 1 && (
              <Button variant="outline" onClick={() => downloadZip("all")} disabled={zipping}>
                {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
                All ZIP ({posts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-5 overflow-y-auto max-h-[80vh] pr-1">

          {/* Import from Schedule */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Auto-generate from Schedule</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pulls real open class slots → ready-to-download posts</p>
              </div>
              <Button size="sm" onClick={importFromSchedule} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5" />}
                {importing ? "Loading…" : "Import"}
              </Button>
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Photo</h3>
            {bgImage ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border aspect-square w-full max-w-[200px] mx-auto shadow-md">
                  <img src={bgImage.src} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1">
                    <span className="text-[10px] text-yellow-300 font-medium">Split layout active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 border border-border rounded-md py-1.5 cursor-pointer hover:border-muted-foreground/40 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" /> Change
                    <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                  </label>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setBgImage(null)}>Remove</Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-foreground">Upload your photo</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Creates a split photo + text layout</p>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              </label>
            )}
          </div>

          {/* Text Fields */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Main Text</h3>
            <Textarea
              value={activePost.mainText}
              onChange={e => updatePost("mainText", e.target.value)}
              className="text-sm min-h-[72px]"
              placeholder="Korean Level 1"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtitle</h3>
            <Textarea
              value={activePost.subtitle}
              onChange={e => updatePost("subtitle", e.target.value)}
              className="text-sm min-h-[60px]"
              placeholder="Friday • 6:00 PM&#10;60 min / session"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Extra Text / Hashtags</h3>
            <Input
              value={activePost.extraText}
              onChange={e => updatePost("extraText", e.target.value)}
              className="text-sm"
              placeholder="#LearnKorean  #Klovers"
            />
          </div>

          {/* Format */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [FormatKey, FormatOption][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setFormat(key)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${
                    format === key ? "border-primary bg-accent" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="text-xs font-medium text-foreground block">{val.label}</span>
                  <span className="text-[10px] text-muted-foreground">{val.w}×{val.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Posts List */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts ({posts.length})</h3>
              <Button size="sm" variant="outline" onClick={addPost}><Plus className="h-3 w-3 mr-1" /> Add Post</Button>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {posts.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${
                    i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"
                  }`}
                  onClick={() => setActiveIndex(i)}
                >
                  <span className="flex-1 truncate">{p.mainText || `Post ${i + 1}`}</span>
                  {posts.length > 1 && (
                    <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); removePost(i); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bulk CSV Upload */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bulk Upload</h3>
            <label className="flex flex-col items-center gap-1 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-muted-foreground/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Upload CSV or TXT</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleBulkUpload} />
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">Format: main text, subtitle, extra (one post per line)</p>
          </div>
        </div>
      </div>

      {/* Platform Grid Previews */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" /> Platform Grid Preview
          <Badge variant="outline" className="text-[10px]">{posts.length} posts</Badge>
        </h2>
        <PlatformGridPreviews posts={posts} bgImage={bgImage} />
      </div>
    </div>
  );
}
