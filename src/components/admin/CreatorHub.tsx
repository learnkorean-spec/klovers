import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Plus, Trash2, ChevronLeft, ChevronRight, Grid3X3, Upload, Monitor, Smartphone, DownloadCloud } from "lucide-react";
import { toast } from "@/hooks/use-toast";

// ─── Types ───
interface PostData {
  id: string;
  mainText: string;
  subtitle: string;
  extraText: string;
}

type TemplateName = "classic" | "character" | "minimal" | "gradient" | "neon" | "dark" | "editorial";
type ColorTheme = "yellow" | "midnight" | "coral" | "forest" | "lavender" | "sunset" | "ocean" | "mono";
type FormatKey = "instagram" | "story" | "facebook" | "tiktok";

interface FormatOption { label: string; w: number; h: number; }

const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post", w: 1080, h: 1080 },
  story: { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook: { label: "Facebook Post", w: 1200, h: 630 },
  tiktok: { label: "TikTok Cover", w: 1080, h: 1920 },
};

const THEME_COLORS: Record<ColorTheme, { bg: string; text: string; accent: string; label: string; dot: string }> = {
  yellow:   { bg: "#FFFF00", text: "#1a1a1a", accent: "#333", label: "Classic Yellow", dot: "#FFFF00" },
  midnight: { bg: "#1a1a2e", text: "#e0e0e0", accent: "#9b87f5", label: "Midnight", dot: "#9b87f5" },
  coral:    { bg: "#ff6b6b", text: "#fff", accent: "#ffeaa7", label: "Coral Reef", dot: "#ff6b6b" },
  forest:   { bg: "#2d6a4f", text: "#d8f3dc", accent: "#95d5b2", label: "Forest", dot: "#2d6a4f" },
  lavender: { bg: "#e8d5f5", text: "#2d1b4e", accent: "#9b59b6", label: "Lavender", dot: "#e8d5f5" },
  sunset:   { bg: "#ff7f50", text: "#fff", accent: "#ffe0b2", label: "Sunset", dot: "#ff7f50" },
  ocean:    { bg: "#0077b6", text: "#caf0f8", accent: "#90e0ef", label: "Ocean", dot: "#0077b6" },
  mono:     { bg: "#f5f5f5", text: "#222", accent: "#888", label: "Monochrome", dot: "#ccc" },
};

const TEMPLATE_META: { key: TemplateName; label: string; desc: string }[] = [
  { key: "classic", label: "Classic Yellow", desc: "Bold yellow background" },
  { key: "character", label: "Character Art", desc: "Illustrated overlay" },
  { key: "minimal", label: "Minimal", desc: "Clean with border inset" },
  { key: "gradient", label: "Gradient", desc: "Smooth color blend" },
  { key: "neon", label: "Neon", desc: "Dark with glow effects" },
  { key: "dark", label: "Dark", desc: "Elegant dark theme" },
  { key: "editorial", label: "Editorial", desc: "Magazine-style layout" },
];

const FONT_STYLES = ["Bold Italic", "Normal", "Small"] as const;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// ─── Canvas Renderer ───
function renderPost(
  canvas: HTMLCanvasElement,
  post: PostData,
  template: TemplateName,
  theme: ColorTheme,
  format: FormatKey,
  bgImage?: HTMLImageElement | null,
) {
  const fmt = FORMATS[format];
  const scale = canvas.width / fmt.w;
  const ctx = canvas.getContext("2d")!;
  const c = THEME_COLORS[theme];
  const w = canvas.width;
  const h = canvas.height;

  if (bgImage) {
    ctx.drawImage(bgImage, 0, 0, w, h);
    ctx.fillStyle = `${c.bg}cc`;
    ctx.fillRect(0, 0, w, h);
  } else {
    if (template === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, c.bg);
      grad.addColorStop(1, c.accent);
      ctx.fillStyle = grad;
    } else if (template === "neon") {
      ctx.fillStyle = "#0a0a0a";
    } else if (template === "dark") {
      ctx.fillStyle = "#1a1a1a";
    } else {
      ctx.fillStyle = c.bg;
    }
    ctx.fillRect(0, 0, w, h);
  }

  if (template === "minimal") {
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 3 * scale;
    const m = 30 * scale;
    ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  }

  if (template === "neon") {
    ctx.shadowColor = c.accent;
    ctx.shadowBlur = 40 * scale;
  }

  if (template === "classic" || template === "character") {
    ctx.font = `bold ${80 * scale}px Georgia, serif`;
    ctx.fillStyle = `${c.text}22`;
    ctx.fillText("\u201C", 40 * scale, 120 * scale);
    ctx.fillText("\u201D", w - 80 * scale, h - 40 * scale);
  }

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  const mainSize = Math.min(48 * scale, w * 0.08);
  ctx.font = `bold italic ${mainSize}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.fillStyle = template === "neon" ? c.accent : c.text;
  wrapText(ctx, post.mainText, 50 * scale, h * 0.35, w - 100 * scale, mainSize * 1.25);

  const subSize = mainSize * 0.5;
  ctx.font = `${subSize}px 'Inter', sans-serif`;
  ctx.fillStyle = template === "neon" ? c.accent : `${c.text}bb`;
  wrapText(ctx, post.subtitle, 50 * scale, h * 0.62, w - 100 * scale, subSize * 1.4);

  if (post.extraText) {
    const exSize = mainSize * 0.35;
    ctx.font = `${exSize}px 'Inter', sans-serif`;
    ctx.fillStyle = `${c.text}88`;
    ctx.fillText(post.extraText, 50 * scale, h * 0.88);
  }

  const logoSize = 48 * scale;
  ctx.beginPath();
  ctx.arc(w - 60 * scale, h - 60 * scale, logoSize / 2, 0, Math.PI * 2);
  ctx.fillStyle = template === "neon" || template === "dark" ? "#333" : "#1a1a1a";
  ctx.fill();
  ctx.font = `bold ${28 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("K", w - 60 * scale, h - 52 * scale);
  ctx.textAlign = "start";

  if (template === "editorial") {
    ctx.strokeStyle = c.accent;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.moveTo(50 * scale, h * 0.28);
    ctx.lineTo(w * 0.4, h * 0.28);
    ctx.stroke();
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = word + " ";
      cy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

// ─── Platform Grid Previews ───
function PlatformGridPreviews({ posts, template, theme, bgImage }: {
  posts: PostData[];
  template: TemplateName;
  theme: ColorTheme;
  bgImage: HTMLImageElement | null;
}) {
  const igRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const fbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const storyRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const tiktokRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const display = posts.slice(0, 9);
    display.forEach((post, i) => {
      // Instagram 1:1
      const ig = igRefs.current[i];
      if (ig) { ig.width = 300; ig.height = 300; renderPost(ig, post, template, theme, "instagram", bgImage); }
      // Facebook
      const fb = fbRefs.current[i];
      if (fb) { fb.width = 360; fb.height = 189; renderPost(fb, post, template, theme, "facebook", bgImage); }
      // Story
      const st = storyRefs.current[i];
      if (st) { st.width = 180; st.height = 320; renderPost(st, post, template, theme, "story", bgImage); }
      // TikTok
      const tt = tiktokRefs.current[i];
      if (tt) { tt.width = 180; tt.height = 320; renderPost(tt, post, template, theme, "tiktok", bgImage); }
    });
  }, [posts, template, theme, bgImage]);

  const display = posts.slice(0, 9);
  if (display.length < 1) return null;

  const cols = Math.min(3, display.length);

  return (
    <Tabs defaultValue="instagram" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="instagram" className="text-xs gap-1.5">
          <Grid3X3 className="h-3.5 w-3.5" /> Instagram
        </TabsTrigger>
        <TabsTrigger value="facebook" className="text-xs gap-1.5">
          <Monitor className="h-3.5 w-3.5" /> Facebook
        </TabsTrigger>
        <TabsTrigger value="stories" className="text-xs gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> Stories
        </TabsTrigger>
        <TabsTrigger value="tiktok" className="text-xs gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> TikTok
        </TabsTrigger>
      </TabsList>

      {/* Instagram Grid 3x3 */}
      <TabsContent value="instagram">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Grid3X3 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Instagram Profile Grid</span>
              <Badge variant="outline" className="text-[10px]">{display.length} posts</Badge>
            </div>
            {/* Mock IG profile header */}
            <div className="bg-card border rounded-t-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">K</div>
              <div>
                <p className="text-xs font-bold text-foreground">klovers_academy</p>
                <p className="text-[10px] text-muted-foreground">{display.length} posts • 1.2K followers</p>
              </div>
            </div>
            <div
              className="grid gap-0.5 rounded-b-xl overflow-hidden border border-t-0 bg-border"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 160 }}
            >
              {display.map((post, i) => (
                <canvas
                  key={post.id}
                  ref={el => { igRefs.current[i] = el; }}
                  className="w-full aspect-square"
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1080 — How your grid looks on Instagram</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Facebook Timeline */}
      <TabsContent value="facebook">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Facebook Timeline Feed</span>
            </div>
            <div className="space-y-3 max-w-md mx-auto">
              {display.slice(0, 4).map((post, i) => (
                <div key={post.id} className="bg-card border rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 p-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">K</div>
                    <div>
                      <p className="text-[10px] font-semibold text-foreground">KLovers Academy</p>
                      <p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p>
                    </div>
                  </div>
                  {post.subtitle && <p className="text-[10px] text-foreground px-2.5 pb-1">{post.subtitle}</p>}
                  <canvas
                    ref={el => { fbRefs.current[i] = el; }}
                    className="w-full aspect-[1200/630]"
                  />
                  <div className="flex items-center justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground">
                    <span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1200×630 — Facebook timeline preview</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Stories */}
      <TabsContent value="stories">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Instagram Stories Tray</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {display.slice(0, 6).map((post, i) => (
                <div key={post.id} className="shrink-0 space-y-1">
                  <div className="w-20 rounded-xl overflow-hidden border-2 border-primary shadow-md">
                    <canvas
                      ref={el => { storyRefs.current[i] = el; }}
                      className="w-full aspect-[9/16]"
                    />
                  </div>
                  <p className="text-[9px] text-muted-foreground text-center truncate w-20">
                    {post.mainText.slice(0, 12) || `Story ${i + 1}`}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — Swipeable story sequence</p>
          </CardContent>
        </Card>
      </TabsContent>

      {/* TikTok */}
      <TabsContent value="tiktok">
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">TikTok Profile Grid</span>
            </div>
            <div
              className="grid gap-0.5 rounded-xl overflow-hidden border bg-border mx-auto"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 100 }}
            >
              {display.map((post, i) => (
                <canvas
                  key={post.id}
                  ref={el => { tiktokRefs.current[i] = el; }}
                  className="w-full aspect-[9/16]"
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">1080×1920 — TikTok profile grid view</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component ───
export default function CreatorHub() {
  const [posts, setPosts] = useState<PostData[]>([
    { id: uid(), mainText: "Korean Level 1 — Friday 6:00 PM", subtitle: "🚀 Korean 1 — Starting Friday 6:00 PM", extraText: "#LearnKorean #Klovers" },
    { id: uid(), mainText: "Master Hangul in 2 Weeks!", subtitle: "📝 Free Hangul Challenge — Join Now", extraText: "#Hangul #Korean" },
    { id: uid(), mainText: "Why Learn Korean?", subtitle: "🇰🇷 5 Reasons to Start Today", extraText: "#KoreanLanguage #Motivation" },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [template, setTemplate] = useState<TemplateName>("classic");
  const [theme, setTheme] = useState<ColorTheme>("yellow");
  const [format, setFormat] = useState<FormatKey>("instagram");
  const [mainFontStyle, setMainFontStyle] = useState<string>("Bold Italic");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePost = posts[activeIndex] || posts[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePost) return;
    const fmt = FORMATS[format];
    const maxPreview = 560;
    const ratio = fmt.h / fmt.w;
    canvas.width = maxPreview;
    canvas.height = maxPreview * ratio;
    renderPost(canvas, activePost, template, theme, format, bgImage);
  }, [activePost, template, theme, format, bgImage]);

  useEffect(() => { redraw(); }, [redraw]);

  function updatePost(field: keyof PostData, value: string) {
    setPosts(prev => prev.map((p, i) => i === activeIndex ? { ...p, [field]: value } : p));
  }

  function addPost() {
    const newPost: PostData = { id: uid(), mainText: "", subtitle: "", extraText: "" };
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

  function handleDownload() {
    const fmt = FORMATS[format];
    const dlCanvas = document.createElement("canvas");
    dlCanvas.width = fmt.w;
    dlCanvas.height = fmt.h;
    renderPost(dlCanvas, activePost, template, theme, format, bgImage);
    const link = document.createElement("a");
    link.download = `klovers-post-${format}-${Date.now()}.png`;
    link.href = dlCanvas.toDataURL("image/png");
    link.click();
    toast({ title: "Downloaded!", description: `${fmt.w}×${fmt.h} image saved.` });
  }

  function handleDownloadAll() {
    const fmt = FORMATS[format];
    posts.forEach((post, i) => {
      const dlCanvas = document.createElement("canvas");
      dlCanvas.width = fmt.w;
      dlCanvas.height = fmt.h;
      renderPost(dlCanvas, post, template, theme, format, bgImage);
      const link = document.createElement("a");
      link.download = `klovers-${format}-${i + 1}-${Date.now()}.png`;
      link.href = dlCanvas.toDataURL("image/png");
      setTimeout(() => link.click(), i * 200);
    });
    toast({ title: "Downloading all!", description: `${posts.length} images at ${fmt.w}×${fmt.h}` });
  }

  function handleBulkUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const newPosts: PostData[] = lines.map(line => {
        const parts = line.split(",").map(s => s.trim());
        return { id: uid(), mainText: parts[0] || "", subtitle: parts[1] || "", extraText: parts[2] || "" };
      });
      if (newPosts.length) {
        setPosts(prev => [...prev, ...newPosts]);
        toast({ title: "Imported!", description: `${newPosts.length} posts added.` });
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-6">
      {/* Editor + Controls */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
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
            <canvas
              ref={canvasRef}
              className="rounded-xl border shadow-md max-w-full"
              style={{ maxHeight: 560 }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            {FORMATS[format].w}×{FORMATS[format].h} — {FORMATS[format].label}
          </p>

          <div className="flex justify-center gap-2 flex-wrap">
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" /> Download
            </Button>
            {posts.length > 1 && (
              <Button variant="outline" onClick={handleDownloadAll}>
                <DownloadCloud className="h-4 w-4 mr-2" /> Download All ({posts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-5 overflow-y-auto max-h-[80vh] pr-1">
          {/* Template */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Template</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_META.map(t => (
                <button
                  key={t.key}
                  onClick={() => setTemplate(t.key)}
                  className={`text-left p-2.5 rounded-lg border text-sm transition-colors ${
                    template === t.key
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="font-medium text-foreground block text-xs">{t.label}</span>
                  <span className="text-muted-foreground text-[10px]">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Theme */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Color Theme</h3>
            <div className="grid grid-cols-4 gap-2">
              {(Object.entries(THEME_COLORS) as [ColorTheme, typeof THEME_COLORS[ColorTheme]][]).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    theme === key ? "border-primary bg-accent" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: val.dot }} />
                  <span className="text-[10px] text-foreground">{val.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Background Image */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Background Image</h3>
            <label className="flex flex-col items-center justify-center gap-1 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/40 transition-colors">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{bgImage ? "Change image" : "Upload background image"}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
            </label>
            {bgImage && (
              <Button variant="ghost" size="sm" className="mt-1 text-xs" onClick={() => setBgImage(null)}>
                Remove background
              </Button>
            )}
          </div>

          {/* Text Fields */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Main Text</h3>
              <Select value={mainFontStyle} onValueChange={setMainFontStyle}>
                <SelectTrigger className="h-7 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={activePost.mainText}
              onChange={e => updatePost("mainText", e.target.value)}
              className="text-sm min-h-[80px]"
              placeholder="Main heading text"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtitle</h3>
            <Input
              value={activePost.subtitle}
              onChange={e => updatePost("subtitle", e.target.value)}
              className="text-sm"
              placeholder="🚀 Korean 1 — Starting Friday 6:00 PM"
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Extra Text</h3>
            <Input
              value={activePost.extraText}
              onChange={e => updatePost("extraText", e.target.value)}
              className="text-sm"
              placeholder="#hashtags or call-to-action"
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

          {/* Post Management */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts ({posts.length})</h3>
              <Button size="sm" variant="outline" onClick={addPost}>
                <Plus className="h-3 w-3 mr-1" /> Add Post
              </Button>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
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

          {/* Bulk Upload */}
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

      {/* Platform Grid Previews — always visible */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" /> Platform Grid Preview
          <Badge variant="outline" className="text-[10px]">{posts.length} posts</Badge>
        </h2>
        <PlatformGridPreviews
          posts={posts}
          template={template}
          theme={theme}
          bgImage={bgImage}
        />
      </div>
    </div>
  );
}
