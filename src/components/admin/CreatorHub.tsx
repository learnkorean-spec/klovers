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
type StyleKey = "bold" | "stamp" | "split";
interface FormatOption { label: string; w: number; h: number; }

const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post",  w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post",   w: 1200, h: 630  },
  tiktok:    { label: "TikTok Cover",    w: 1080, h: 1920 },
};

const STYLE_META: { key: StyleKey; label: string; desc: string }[] = [
  { key: "bold",  label: "Bold Frame",   desc: "Thick border, logo badge, clean hierarchy" },
  { key: "stamp", label: "Stamp Circle", desc: "Korean seal stamp, editorial look" },
  { key: "split", label: "Split Card",   desc: "Yellow + black split, asymmetric energy" },
];

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

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 99): number {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = word + " "; }
    else line = test;
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + Math.min(lines.length, maxLines) * lineH;
}

// ─── Logo helper — draws the Klovers K-badge ───
function drawLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, bgColor = "#111", kColor = "#FFFF00") {
  ctx.save();
  ctx.fillStyle = bgColor;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  // K letter
  ctx.fillStyle = kColor;
  ctx.font = `900 ${r * 1.1}px 'Arial Black', Impact, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", cx, cy + r * 0.04);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.restore();
}

// ─── STYLE: Bold Frame ───────────────────────────────────────────
function renderBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, bgImage: HTMLImageElement | null) {
  const isPortrait = h > w;
  const pad = 40 * s;
  const innerPad = 28 * s;
  const frameW = 14 * s; // thick border

  // Background
  ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, h);

  // Photo overlay (if any)
  if (bgImage) {
    ctx.globalAlpha = 0.18;
    const pR = bgImage.width / bgImage.height;
    let pw = w, ph = w / pR;
    if (ph < h) { ph = h; pw = h * pR; }
    ctx.drawImage(bgImage, (w - pw) / 2, (h - ph) / 2, pw, ph);
    ctx.globalAlpha = 1;
  }

  // Thick black border frame
  ctx.strokeStyle = "#111"; ctx.lineWidth = frameW;
  ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

  // Top-left logo badge
  const logoR = 34 * s;
  const logoCX = pad + innerPad + logoR;
  const logoCY = pad + innerPad + logoR;
  drawLogo(ctx, logoCX, logoCY, logoR);

  // "KLOVERS" next to logo
  ctx.fillStyle = "#111";
  ctx.font = `900 ${22 * s}px 'Arial Black', Impact, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillText("KLOVERS", logoCX + logoR + 12 * s, logoCY);
  ctx.textBaseline = "alphabetic";

  // Thin rule below logo
  ctx.fillStyle = "#111"; ctx.fillRect(pad + innerPad, pad + innerPad + logoR * 2 + 10 * s, w - (pad + innerPad) * 2, 2 * s);

  // Korean decorative character (faint, right side)
  ctx.save();
  ctx.font = `900 ${(isPortrait ? 420 : 280) * s}px serif`;
  ctx.fillStyle = "rgba(0,0,0,0.055)"; ctx.textAlign = "right";
  ctx.fillText("클", w - pad - 10 * s, h - pad - 20 * s);
  ctx.textAlign = "left"; ctx.restore();

  // Main text — massive, anchored top-left inside frame
  const tLeft = pad + innerPad;
  const tW = (isPortrait ? w * 0.85 : w * 0.70) - pad;
  const tTop = pad + innerPad + logoR * 2 + 26 * s;
  const charLen = post.mainText.length;
  const mSize = Math.round((charLen > 22 ? 68 : charLen > 14 ? 86 : 108) * s);
  ctx.font = `900 ${mSize}px 'Arial Black', Impact, sans-serif`;
  ctx.fillStyle = "#111"; ctx.textAlign = "left";
  const afterMain = wrapText(ctx, post.mainText, tLeft, tTop + mSize, tW, mSize * 1.15, 2);

  // Divider line
  ctx.fillStyle = "#111"; ctx.fillRect(tLeft, afterMain + 14 * s, 80 * s, 4 * s);

  // Subtitle
  if (post.subtitle) {
    const lines = post.subtitle.split("\n");
    const sSize = Math.round(36 * s);
    ctx.font = `600 ${sSize}px 'Arial', sans-serif`;
    ctx.fillStyle = "#111";
    let sy = afterMain + 32 * s;
    for (const line of lines) {
      ctx.fillText(line, tLeft, sy + sSize);
      sy += sSize * 1.45;
    }
  }

  // CTA — bold pill bottom-left, inside frame
  const ctaY = h - pad - innerPad - 48 * s;
  const ctaH = 48 * s; const ctaR = ctaH / 2;
  const ctaLabel = "Register Now →";
  ctx.font = `bold ${18 * s}px 'Arial Black', sans-serif`;
  const ctaW = ctx.measureText(ctaLabel).width + 48 * s;
  ctx.fillStyle = "#111"; rRect(ctx, tLeft, ctaY, ctaW, ctaH, ctaR); ctx.fill();
  ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
  ctx.fillText(ctaLabel, tLeft + ctaW / 2, ctaY + ctaH * 0.64);
  ctx.textAlign = "left";

  // Hashtags bottom-right inside frame
  if (post.extraText) {
    ctx.font = `${13 * s}px 'Arial', sans-serif`; ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.textAlign = "right";
    ctx.fillText(post.extraText, w - pad - innerPad, h - pad - innerPad - 10 * s);
    ctx.textAlign = "left";
  }
}

// ─── STYLE: Stamp Circle ─────────────────────────────────────────
function renderStamp(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, bgImage: HTMLImageElement | null) {
  const isPortrait = h > w;

  // Black background
  ctx.fillStyle = "#111"; ctx.fillRect(0, 0, w, h);

  // Photo behind (if any)
  if (bgImage) {
    ctx.globalAlpha = 0.25;
    const pR = bgImage.width / bgImage.height;
    let pw = w, ph = w / pR;
    if (ph < h) { ph = h; pw = h * pR; }
    ctx.drawImage(bgImage, (w - pw) / 2, (h - ph) / 2, pw, ph);
    ctx.globalAlpha = 1;
  }

  // Large yellow circle (stamp) — top-right area
  const circR = (isPortrait ? w * 0.42 : h * 0.48);
  const circX = w - circR * 0.65;
  const circY = isPortrait ? circR * 0.72 : h * 0.5;
  ctx.fillStyle = "#FFFF00";
  ctx.beginPath(); ctx.arc(circX, circY, circR, 0, Math.PI * 2); ctx.fill();

  // Korean character inside circle
  ctx.save();
  ctx.font = `900 ${circR * 1.1}px serif`;
  ctx.fillStyle = "rgba(0,0,0,0.12)"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("클", circX, circY);
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left"; ctx.restore();

  // Logo inside circle top
  drawLogo(ctx, circX, circY - circR * 0.48, circR * 0.22, "#111", "#FFFF00");
  ctx.fillStyle = "#111";
  ctx.font = `900 ${circR * 0.13}px 'Arial Black', sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("KLOVERS", circX, circY - circR * 0.48 + circR * 0.38);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

  // KOREAN COURSE label inside circle
  ctx.fillStyle = "#111";
  ctx.font = `700 ${circR * 0.12}px 'Arial', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("KOREAN COURSE", circX, circY + circR * 0.6);
  ctx.textAlign = "left";

  // Left text zone
  const tLeft = 48 * s;
  const tW = isPortrait ? w * 0.72 : w * 0.48;

  // Top yellow accent bar
  ctx.fillStyle = "#FFFF00"; ctx.fillRect(tLeft, 48 * s, 6 * s, isPortrait ? h * 0.28 : h * 0.55);

  const charLen = post.mainText.length;
  const mSize = Math.round((charLen > 22 ? 62 : charLen > 14 ? 78 : 96) * s);
  ctx.font = `900 ${mSize}px 'Arial Black', Impact, sans-serif`;
  ctx.fillStyle = "#FFFF00";
  const tTop = isPortrait ? h * 0.22 : h * 0.15;
  const afterMain = wrapText(ctx, post.mainText, tLeft + 22 * s, tTop + mSize, tW, mSize * 1.15, 2);

  if (post.subtitle) {
    const lines = post.subtitle.split("\n");
    const sSize = Math.round(32 * s);
    ctx.font = `400 ${sSize}px 'Arial', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.7)";
    let sy = afterMain + 16 * s;
    for (const line of lines) { ctx.fillText(line, tLeft + 22 * s, sy + sSize); sy += sSize * 1.45; }
  }

  // CTA at bottom
  const ctaY = h - 80 * s;
  ctx.fillStyle = "#FFFF00"; rRect(ctx, tLeft + 22 * s, ctaY, 200 * s, 50 * s, 25 * s); ctx.fill();
  ctx.fillStyle = "#111"; ctx.font = `bold ${17 * s}px 'Arial Black', sans-serif`;
  ctx.textAlign = "center"; ctx.fillText("Register Now →", tLeft + 22 * s + 100 * s, ctaY + 32 * s);
  ctx.textAlign = "left";

  // Hashtags
  if (post.extraText) {
    ctx.fillStyle = "rgba(255,255,0,0.35)"; ctx.font = `${12 * s}px 'Arial', sans-serif`;
    ctx.fillText(post.extraText, tLeft + 22 * s, h - 28 * s);
  }
}

// ─── STYLE: Split Card ───────────────────────────────────────────
function renderSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, bgImage: HTMLImageElement | null) {
  const isPortrait = h > w;

  if (isPortrait) {
    // Top 55% yellow, bottom 45% black — angled cut
    const cutY = h * 0.52;
    const slant = w * 0.12;

    // Yellow top
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, h);

    // Photo in yellow zone (if any)
    if (bgImage) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, cutY + slant); ctx.lineTo(0, cutY); ctx.closePath(); ctx.clip();
      ctx.globalAlpha = 0.2;
      const pR = bgImage.width / bgImage.height;
      let pw = w, ph = w / pR;
      if (ph < cutY + slant) { ph = cutY + slant; pw = ph * pR; }
      ctx.drawImage(bgImage, (w - pw) / 2, 0, pw, ph);
      ctx.globalAlpha = 1; ctx.restore();
    }

    // Black angled bottom zone
    ctx.fillStyle = "#111"; ctx.beginPath();
    ctx.moveTo(0, cutY); ctx.lineTo(w, cutY + slant); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();

    // Angle cut stripe (yellow thin)
    ctx.fillStyle = "#FFFF00"; ctx.beginPath();
    ctx.moveTo(0, cutY - 3 * s); ctx.lineTo(w, cutY + slant - 3 * s);
    ctx.lineTo(w, cutY + slant + 4 * s); ctx.lineTo(0, cutY + 4 * s); ctx.closePath(); ctx.fill();

    // Logo top-left
    drawLogo(ctx, 52 * s, 56 * s, 28 * s);
    ctx.fillStyle = "#111"; ctx.font = `900 ${20 * s}px 'Arial Black', sans-serif`;
    ctx.textBaseline = "middle"; ctx.fillText("KLOVERS", 92 * s, 56 * s);
    ctx.textBaseline = "alphabetic";

    // Small "KOREAN COURSE" tag
    const tagW = 170 * s, tagH = 28 * s;
    ctx.fillStyle = "#111"; rRect(ctx, 52 * s, 98 * s, tagW, tagH, tagH / 2); ctx.fill();
    ctx.fillStyle = "#FFFF00"; ctx.font = `bold ${11 * s}px 'Arial', sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("KOREAN COURSE", 52 * s + tagW / 2, 98 * s + tagH * 0.68);
    ctx.textAlign = "left";

    // Main text — big, yellow zone
    const charLen = post.mainText.length;
    const mSize = Math.round((charLen > 22 ? 72 : charLen > 14 ? 90 : 112) * s);
    ctx.font = `900 ${mSize}px 'Arial Black', Impact, sans-serif`;
    ctx.fillStyle = "#111";
    wrapText(ctx, post.mainText, 52 * s, h * 0.22 + mSize, w * 0.9, mSize * 1.15, 2);

    // Schedule info — white text on black zone
    if (post.subtitle) {
      const lines = post.subtitle.split("\n");
      const sSize = Math.round(38 * s);
      let sy = cutY + slant + 32 * s;
      for (const line of lines) {
        if (line.startsWith("🔴")) {
          ctx.fillStyle = "#ff4444"; ctx.font = `700 ${sSize}px 'Arial', sans-serif`;
        } else if (line.startsWith("⚡")) {
          ctx.fillStyle = "#FFFF00"; ctx.font = `700 ${sSize}px 'Arial', sans-serif`;
        } else {
          ctx.fillStyle = "#fff"; ctx.font = `400 ${sSize}px 'Arial', sans-serif`;
        }
        ctx.fillText(line, 52 * s, sy + sSize); sy += sSize * 1.5;
      }
    }

    // CTA — yellow pill on black
    const ctaY = h - 72 * s;
    ctx.fillStyle = "#FFFF00"; rRect(ctx, 52 * s, ctaY, 210 * s, 50 * s, 25 * s); ctx.fill();
    ctx.fillStyle = "#111"; ctx.font = `bold ${18 * s}px 'Arial Black', sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("Register Now →", 52 * s + 105 * s, ctaY + 32 * s);
    ctx.textAlign = "left";

    if (post.extraText) {
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `${11 * s}px 'Arial', sans-serif`;
      ctx.fillText(post.extraText, w / 2, h - 20 * s);
    }

  } else {
    // Landscape: left 52% yellow, right 48% black — vertical diagonal
    const cutX = w * 0.52;
    const slant = h * 0.08;

    ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, h);

    if (bgImage) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(cutX + slant, 0); ctx.lineTo(cutX, h); ctx.lineTo(0, h); ctx.closePath(); ctx.clip();
      ctx.globalAlpha = 0.15;
      const pR = bgImage.width / bgImage.height;
      let ph = h, pw = h * pR;
      ctx.drawImage(bgImage, 0, 0, pw, ph);
      ctx.globalAlpha = 1; ctx.restore();
    }

    ctx.fillStyle = "#111"; ctx.beginPath();
    ctx.moveTo(cutX, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(cutX + slant, h); ctx.closePath(); ctx.fill();

    // Left: text
    drawLogo(ctx, 48 * s, 52 * s, 26 * s);
    ctx.fillStyle = "#111"; ctx.font = `900 ${18 * s}px 'Arial Black', sans-serif`;
    ctx.textBaseline = "middle"; ctx.fillText("KLOVERS", 86 * s, 52 * s); ctx.textBaseline = "alphabetic";

    const charLen = post.mainText.length;
    const mSize = Math.round((charLen > 22 ? 58 : charLen > 14 ? 70 : 86) * s);
    ctx.font = `900 ${mSize}px 'Arial Black', Impact, sans-serif`;
    ctx.fillStyle = "#111";
    wrapText(ctx, post.mainText, 48 * s, h * 0.28 + mSize, cutX * 0.88, mSize * 1.15, 2);

    ctx.fillStyle = "#111"; rRect(ctx, 48 * s, h - 56 * s, 190 * s, 46 * s, 23 * s); ctx.fill();
    ctx.fillStyle = "#FFFF00"; ctx.font = `bold ${16 * s}px 'Arial Black', sans-serif`;
    ctx.textAlign = "center"; ctx.fillText("Register Now →", 48 * s + 95 * s, h - 56 * s + 30 * s); ctx.textAlign = "left";

    // Right: schedule details
    const rLeft = cutX + slant + 28 * s;
    const rW = w - rLeft - 28 * s;
    if (post.subtitle) {
      const lines = post.subtitle.split("\n");
      const sSize = Math.round(34 * s);
      let sy = h * 0.22;
      for (const line of lines) {
        ctx.fillStyle = line.startsWith("🔴") ? "#ff4444" : line.startsWith("⚡") ? "#FFFF00" : "#fff";
        ctx.font = `${line.startsWith("🔴") || line.startsWith("⚡") ? "700" : "400"} ${sSize}px 'Arial', sans-serif`;
        wrapText(ctx, line, rLeft, sy + sSize, rW, sSize * 1.4, 2);
        sy += sSize * 1.6;
      }
    }
    if (post.extraText) {
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `${11 * s}px 'Arial', sans-serif`;
      ctx.fillText(post.extraText, rLeft, h - 24 * s);
    }
  }
}

// ─── Main renderer dispatcher ─────────────────────────────────────
function renderPost(canvas: HTMLCanvasElement, post: PostData, format: FormatKey, style: StyleKey, bgImage: HTMLImageElement | null) {
  const fmt = FORMATS[format];
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width, h = canvas.height;
  const s = w / 1080;
  ctx.clearRect(0, 0, w, h);
  if (style === "bold")  renderBold(ctx, post, w, h, s, bgImage);
  else if (style === "stamp") renderStamp(ctx, post, w, h, s, bgImage);
  else renderSplit(ctx, post, w, h, s, bgImage);
}

// ─── Style Picker with live mini previews ────────────────────────
function StylePicker({ value, onChange, post, bgImage }: {
  value: StyleKey; onChange: (s: StyleKey) => void;
  post: PostData; bgImage: HTMLImageElement | null;
}) {
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    STYLE_META.forEach((sm, i) => {
      const c = refs.current[i];
      if (!c) return;
      c.width = 240; c.height = 240;
      renderPost(c, post, "instagram", sm.key, bgImage);
    });
  }, [post, bgImage]);

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Style</h3>
      <div className="grid grid-cols-3 gap-2">
        {STYLE_META.map((sm, i) => (
          <button
            key={sm.key}
            onClick={() => onChange(sm.key)}
            className={`rounded-xl overflow-hidden border-2 transition-all ${
              value === sm.key ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-muted-foreground/40"
            }`}
          >
            <canvas ref={el => { refs.current[i] = el; }} className="w-full aspect-square" />
            <div className="px-2 py-1.5 text-left">
              <p className="text-[11px] font-semibold text-foreground">{sm.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sm.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Platform Grid Previews ───────────────────────────────────────
function PlatformGridPreviews({ posts, style, bgImage }: { posts: PostData[]; style: StyleKey; bgImage: HTMLImageElement | null }) {
  const igRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const fbRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const stRefs = useRef<(HTMLCanvasElement | null)[]>([]);
  const ttRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    posts.slice(0, 9).forEach((post, i) => {
      const ig = igRefs.current[i]; if (ig) { ig.width = 300; ig.height = 300; renderPost(ig, post, "instagram", style, bgImage); }
      const fb = fbRefs.current[i]; if (fb) { fb.width = 360; fb.height = 189; renderPost(fb, post, "facebook", style, bgImage); }
      const st = stRefs.current[i]; if (st) { st.width = 180; st.height = 320; renderPost(st, post, "story", style, bgImage); }
      const tt = ttRefs.current[i]; if (tt) { tt.width = 180; tt.height = 320; renderPost(tt, post, "tiktok", style, bgImage); }
    });
  }, [posts, style, bgImage]);

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
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="facebook">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="space-y-3 max-w-md mx-auto">
            {display.slice(0, 3).map((p, i) => (
              <div key={p.id} className="bg-card border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px]">K</div>
                  <div><p className="text-[10px] font-semibold text-foreground">KLovers Academy</p><p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p></div>
                </div>
                <canvas ref={el => { fbRefs.current[i] = el; }} className="w-full aspect-[1200/630]" />
                <div className="flex items-center justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
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
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="tiktok">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="grid gap-0.5 rounded-xl overflow-hidden border bg-border mx-auto" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, maxWidth: cols * 100 }}>
            {display.map((p, i) => <canvas key={p.id} ref={el => { ttRefs.current[i] = el; }} className="w-full aspect-[9/16]" />)}
          </div>
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function CreatorHub() {
  const [posts, setPosts] = useState<PostData[]>([
    { id: uid(), mainText: "Korean Level 1", subtitle: "Friday • 6:00 PM\n60 min / session", extraText: "#LearnKorean  #Klovers  #KoreanCourse" },
    { id: uid(), mainText: "Master Hangul in 2 Weeks!", subtitle: "Free Challenge — Join Now", extraText: "#Hangul  #Korean  #Klovers" },
    { id: uid(), mainText: "Why Learn Korean?", subtitle: "5 Reasons to Start Today", extraText: "#KoreanLanguage  #Motivation" },
  ]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [format, setFormat] = useState<FormatKey>("instagram");
  const [style, setStyle] = useState<StyleKey>("bold");
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [importing, setImporting] = useState(false);
  const [zipping, setZipping] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activePost = posts[activeIndex] || posts[0];

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activePost) return;
    const fmt = FORMATS[format];
    const maxPreview = 540;
    canvas.width  = maxPreview;
    canvas.height = Math.round(maxPreview * (fmt.h / fmt.w));
    renderPost(canvas, activePost, format, style, bgImage);
  }, [activePost, format, style, bgImage]);

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
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    img.onload = () => setBgImage(img);
    img.src = URL.createObjectURL(file);
  }

  async function importFromSchedule() {
    setImporting(true);
    try {
      const { data: pkgGroups } = await supabase.from("pkg_groups").select("id, name, capacity, package_id").eq("is_active", true);
      if (!pkgGroups?.length) { toast({ title: "No active groups found" }); return; }
      const packageIds = [...new Set(pkgGroups.map(g => g.package_id))];
      const { data: packages } = await supabase.from("schedule_packages").select("id, level, day_of_week, start_time, duration_min").in("id", packageIds);
      const { data: members } = await supabase.from("pkg_group_members").select("group_id").eq("member_status", "active");
      const pkgMap = new Map((packages || []).map(p => [p.id, p]));
      const counts = new Map<string, number>();
      (members || []).forEach(m => counts.set(m.group_id, (counts.get(m.group_id) || 0) + 1));
      const newPosts: PostData[] = [];
      for (const g of pkgGroups) {
        const pkg = pkgMap.get(g.package_id); if (!pkg) continue;
        const seatsLeft = g.capacity - (counts.get(g.id) || 0);
        if (seatsLeft <= 0) continue;
        const level = getLevelLabel(pkg.level);
        const dayName = DAY_NAMES[pkg.day_of_week] || "";
        const [hh, mm] = pkg.start_time.split(":");
        const h = parseInt(hh), ampm = h >= 12 ? "PM" : "AM", h12 = h % 12 || 12;
        const time = `${h12}:${mm} ${ampm}`;
        const urgencyLine = seatsLeft <= 3 ? `\n🔴 Only ${seatsLeft} seats left!` : seatsLeft <= 6 ? `\n⚡ ${seatsLeft} seats left` : "";
        newPosts.push({
          id: uid(),
          mainText: level,
          subtitle: `${dayName} • ${time}\n${pkg.duration_min} min / session${urgencyLine}`,
          extraText: seatsLeft <= 5 ? "#LastSeats  #Klovers  #KoreanCourse" : "#LearnKorean  #Klovers  #KoreanCourse",
        });
      }
      if (!newPosts.length) { toast({ title: "All groups are full" }); return; }
      setPosts(newPosts); setActiveIndex(0);
      toast({ title: `Imported ${newPosts.length} posts`, description: "Ready to render and download." });
    } catch (err: any) {
      toast({ title: "Import error", description: err.message, variant: "destructive" });
    } finally { setImporting(false); }
  }

  function handleDownload() {
    const fmt = FORMATS[format];
    const dl = document.createElement("canvas"); dl.width = fmt.w; dl.height = fmt.h;
    renderPost(dl, activePost, format, style, bgImage);
    const a = document.createElement("a"); a.download = `klovers-${style}-${format}-${Date.now()}.png`;
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
          const fmt = FORMATS[size]; const c = document.createElement("canvas");
          c.width = fmt.w; c.height = fmt.h;
          renderPost(c, post, size, style, bgImage);
          zip.file(`${slug}-${size}.png`, c.toDataURL("image/png").split(",")[1], { base64: true });
        });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `klovers-${style}-${platform}-${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "ZIP downloaded!", description: `${posts.length} posts × ${sizes.length} sizes` });
    } catch (err: any) {
      toast({ title: "ZIP error", description: err.message, variant: "destructive" });
    } finally { setZipping(false); }
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
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">

        {/* Left: Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" disabled={activeIndex === 0} onClick={() => setActiveIndex(activeIndex - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-medium text-foreground">{activeIndex + 1} / {posts.length}</span>
              <Button size="sm" variant="ghost" disabled={activeIndex >= posts.length - 1} onClick={() => setActiveIndex(activeIndex + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl border shadow-lg max-w-full" style={{ maxHeight: 560 }} />
          </div>
          <p className="text-[10px] text-muted-foreground text-center">{FORMATS[format].w}×{FORMATS[format].h} — {FORMATS[format].label}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2" /> Download</Button>
            <Button variant="outline" onClick={() => downloadZip("instagram")} disabled={zipping}>
              {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />} Instagram ZIP
            </Button>
            <Button variant="outline" onClick={() => downloadZip("tiktok")} disabled={zipping}>
              {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />} TikTok ZIP
            </Button>
            {posts.length > 1 && (
              <Button variant="outline" onClick={() => downloadZip("all")} disabled={zipping}>
                {zipping ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />} All ZIP ({posts.length})
              </Button>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-5 overflow-y-auto max-h-[82vh] pr-1">

          {/* Import from Schedule */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-generate from Schedule</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Pulls real open class slots → ready-to-download</p>
            </div>
            <Button size="sm" onClick={importFromSchedule} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Wand2 className="h-4 w-4 mr-1.5" />}
              {importing ? "Loading…" : "Import"}
            </Button>
          </div>

          {/* Style Picker */}
          <StylePicker value={style} onChange={setStyle} post={activePost} bgImage={bgImage} />

          {/* Format */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [FormatKey, FormatOption][]).map(([key, val]) => (
                <button key={key} onClick={() => setFormat(key)}
                  className={`p-2.5 rounded-lg border text-left transition-colors ${format === key ? "border-primary bg-accent" : "border-border hover:border-muted-foreground/30"}`}
                >
                  <span className="text-xs font-medium text-foreground block">{val.label}</span>
                  <span className="text-[10px] text-muted-foreground">{val.w}×{val.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Photo (optional)</h3>
            {bgImage ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border aspect-square w-full max-w-[180px] mx-auto shadow-md">
                  <img src={bgImage.src} alt="Uploaded" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1"><span className="text-[10px] text-yellow-300 font-medium">Photo active</span></div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 border border-border rounded-md py-1.5 cursor-pointer hover:border-muted-foreground/40 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5" /> Change <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
                  </label>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setBgImage(null)}>Remove</Button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs font-medium text-foreground">Upload photo</p>
                <p className="text-[10px] text-muted-foreground">Adds photo overlay to your post</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload} />
              </label>
            )}
          </div>

          {/* Text Fields */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Main Text</h3>
            <Textarea value={activePost.mainText} onChange={e => updatePost("mainText", e.target.value)} className="text-sm min-h-[72px]" placeholder="Korean Level 1" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtitle</h3>
            <Textarea value={activePost.subtitle} onChange={e => updatePost("subtitle", e.target.value)} className="text-sm min-h-[60px]" placeholder={"Friday • 6:00 PM\n60 min / session"} />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hashtags</h3>
            <Input value={activePost.extraText} onChange={e => updatePost("extraText", e.target.value)} className="text-sm" placeholder="#LearnKorean  #Klovers" />
          </div>

          {/* Posts List */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts ({posts.length})</h3>
              <Button size="sm" variant="outline" onClick={addPost}><Plus className="h-3 w-3 mr-1" /> Add</Button>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {posts.map((p, i) => (
                <div key={p.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${i === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-muted text-foreground"}`}
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

          {/* Bulk CSV */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bulk Upload CSV</h3>
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
        <PlatformGridPreviews posts={posts} style={style} bgImage={bgImage} />
      </div>
    </div>
  );
}
