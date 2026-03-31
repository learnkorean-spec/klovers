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

// ─── Types ───────────────────────────────────────────────────────
interface PostData { id: string; mainText: string; subtitle: string; extraText: string; }
type FormatKey = "instagram" | "story" | "facebook" | "tiktok";
type StyleKey  = "bold" | "varsity" | "split";
type FontKey   = "bebas" | "montserrat" | "oswald" | "anton" | "playfair";

interface FormatOption { label: string; w: number; h: number; }
interface FontOption   { key: FontKey; label: string; tag: string; css: string; canvas: string; }

const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post",  w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post",   w: 1200, h: 630  },
  tiktok:    { label: "TikTok Cover",    w: 1080, h: 1920 },
};

// ── 5 research-backed marketing fonts ──
// Bebas Neue   — Nike/UFC energy, urgency & authority. #1 on Instagram for course promos.
// Montserrat   — Duolingo/Coursera trust. Best conversion in ed-tech A/B tests.
// Oswald       — Newspaper headline credibility. Immediate authority signal.
// Anton        — Maximum attention-grab. Used in major ad campaigns worldwide.
// Playfair Dis — Premium/luxury positioning. Raises perceived course value.
const FONTS: FontOption[] = [
  { key: "bebas",      label: "Bebas Neue",       tag: "Athletic · Urgent",   css: "'Bebas Neue', Impact, sans-serif",              canvas: "400 {SIZE}px 'Bebas Neue', Impact, sans-serif" },
  { key: "montserrat", label: "Montserrat",        tag: "Modern · Trusted",    css: "'Montserrat', sans-serif",                      canvas: "900 {SIZE}px 'Montserrat', sans-serif" },
  { key: "oswald",     label: "Oswald",            tag: "Editorial · Bold",    css: "'Oswald', sans-serif",                          canvas: "700 {SIZE}px 'Oswald', sans-serif" },
  { key: "anton",      label: "Anton",             tag: "Impact · Instant",    css: "'Anton', Impact, sans-serif",                   canvas: "400 {SIZE}px 'Anton', Impact, sans-serif" },
  { key: "playfair",   label: "Playfair Display",  tag: "Premium · Elegant",   css: "'Playfair Display', Georgia, serif",            canvas: "900 {SIZE}px 'Playfair Display', Georgia, serif" },
];

const STYLE_META = [
  { key: "bold"    as StyleKey, label: "Bold Frame",     desc: "Border, badge, clean authority" },
  { key: "varsity" as StyleKey, label: "Varsity Badge",  desc: "Athletic ring badge, dark energy" },
  { key: "split"   as StyleKey, label: "Split Card",     desc: "Yellow/black diagonal, dynamic" },
];

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
function cf(font: FontOption, size: number) { return font.canvas.replace("{SIZE}", String(size)); }

// ─── Canvas helpers ───────────────────────────────────────────────
function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+rw-r,y); ctx.quadraticCurveTo(x+rw,y,x+rw,y+r);
  ctx.lineTo(x+rw,y+rh-r); ctx.quadraticCurveTo(x+rw,y+rh,x+rw-r,y+rh);
  ctx.lineTo(x+r,y+rh); ctx.quadraticCurveTo(x,y+rh,x,y+rh-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines=99): number {
  const words = text.split(" "); let line = ""; const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) { lines.push(line.trim()); line = word + " "; }
    else line = test;
  }
  if (line.trim()) lines.push(line.trim());
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
  return y + Math.min(lines.length, maxLines) * lineH;
}

function drawKLogo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, circleFill="#111", letterFill="#FFFF00") {
  ctx.save();
  ctx.fillStyle = circleFill;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = letterFill;
  ctx.font = `900 ${r*1.15}px 'Arial Black', Impact, sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", cx, cy + r*0.04);
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  ctx.restore();
}

// ─── DESIGN 1: Bold Frame ─────────────────────────────────────────
function renderBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, font: FontOption, bgImage: HTMLImageElement|null) {
  const isP = h > w;
  const pad = 40*s, ip = 26*s, fw = 14*s;

  ctx.fillStyle = "#FFFF00"; ctx.fillRect(0,0,w,h);

  if (bgImage) {
    ctx.globalAlpha = 0.15;
    const pR = bgImage.width/bgImage.height; let pw=w, ph=w/pR;
    if (ph<h){ph=h; pw=h*pR;} ctx.drawImage(bgImage,(w-pw)/2,(h-ph)/2,pw,ph);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle="#111"; ctx.lineWidth=fw; ctx.strokeRect(pad,pad,w-pad*2,h-pad*2);

  // K logo badge + KLOVERS
  const lr = 28*s, lcx = pad+ip+lr, lcy = pad+ip+lr;
  drawKLogo(ctx, lcx, lcy, lr);
  ctx.fillStyle="#111"; ctx.font=`900 ${20*s}px 'Arial Black', sans-serif`;
  ctx.textBaseline="middle"; ctx.fillText("KLOVERS", lcx+lr+10*s, lcy);
  ctx.textBaseline="alphabetic";

  // Rule under logo
  ctx.fillRect(pad+ip, pad+ip+lr*2+8*s, w-(pad+ip)*2, 2.5*s);

  // Korean faint watermark
  ctx.save(); ctx.font=`900 ${(isP?400:270)*s}px serif`;
  ctx.fillStyle="rgba(0,0,0,0.055)"; ctx.textAlign="right";
  ctx.fillText("클", w-pad-8*s, h-pad-14*s); ctx.textAlign="left"; ctx.restore();

  const tL=pad+ip, tW=(isP?w*0.86:w*0.72)-pad, tTop=pad+ip+lr*2+22*s;
  const clen=post.mainText.length;
  const mSize=Math.round((clen>22?66:clen>14?84:106)*s);
  ctx.font=cf(font,mSize); ctx.fillStyle="#111";
  const afterM = wrapText(ctx, post.mainText, tL, tTop+mSize, tW, mSize*1.15, 2);

  ctx.fillStyle="#111"; ctx.fillRect(tL, afterM+12*s, 72*s, 4*s);

  if (post.subtitle) {
    const lines=post.subtitle.split("\n"); const sSize=Math.round(34*s);
    ctx.font=`600 ${sSize}px 'Arial', sans-serif`; ctx.fillStyle="#111";
    let sy=afterM+28*s;
    for (const l of lines){ ctx.fillText(l, tL, sy+sSize); sy+=sSize*1.48; }
  }

  // CTA
  const ctaY=h-pad-ip-46*s, ctaH=46*s;
  const ctaLabel="Register Now →";
  ctx.font=`bold ${17*s}px 'Arial Black', sans-serif`;
  const ctaW=ctx.measureText(ctaLabel).width+46*s;
  ctx.fillStyle="#111"; rRect(ctx,tL,ctaY,ctaW,ctaH,ctaH/2); ctx.fill();
  ctx.fillStyle="#FFFF00"; ctx.textAlign="center";
  ctx.fillText(ctaLabel, tL+ctaW/2, ctaY+ctaH*0.64); ctx.textAlign="left";

  if (post.extraText) {
    ctx.font=`${12*s}px 'Arial', sans-serif`; ctx.fillStyle="rgba(0,0,0,0.4)";
    ctx.textAlign="right"; ctx.fillText(post.extraText, w-pad-ip, h-pad-ip-8*s); ctx.textAlign="left";
  }
}

// ─── DESIGN 2: Varsity Badge ──────────────────────────────────────
// Black bg. Right: championship medal ring with K badge inside.
// Left: massive headline + schedule. Feels like athletic achievement = triggers aspiration.
function renderVarsity(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, font: FontOption, bgImage: HTMLImageElement|null) {
  const isP = h > w;

  // Black background
  ctx.fillStyle = "#0d0d0d"; ctx.fillRect(0,0,w,h);

  // Subtle photo behind if provided
  if (bgImage) {
    ctx.globalAlpha = 0.12;
    const pR=bgImage.width/bgImage.height; let pw=w, ph=w/pR;
    if (ph<h){ph=h; pw=h*pR;} ctx.drawImage(bgImage,(w-pw)/2,(h-ph)/2,pw,ph);
    ctx.globalAlpha = 1;
  }

  // ── Championship ring badge ──────────────────────────────
  const bCX = isP ? w*0.73 : w*0.78;
  const bCY = isP ? h*0.38 : h*0.5;
  const bR  = isP ? w*0.33 : h*0.38;

  // Outer glow
  ctx.save();
  ctx.shadowColor = "#FFFF00"; ctx.shadowBlur = 28*s;
  ctx.strokeStyle = "#FFFF00"; ctx.lineWidth = 10*s;
  ctx.beginPath(); ctx.arc(bCX, bCY, bR, 0, Math.PI*2); ctx.stroke();
  ctx.restore();

  // Outer ring (thick)
  ctx.strokeStyle = "#FFFF00"; ctx.lineWidth = 18*s;
  ctx.beginPath(); ctx.arc(bCX, bCY, bR, 0, Math.PI*2); ctx.stroke();

  // Inner ring (thin accent)
  ctx.strokeStyle = "rgba(255,255,0,0.3)"; ctx.lineWidth = 3*s;
  ctx.beginPath(); ctx.arc(bCX, bCY, bR*0.78, 0, Math.PI*2); ctx.stroke();

  // 8 dot markers on the ring
  for (let i=0; i<8; i++) {
    const angle = (i*Math.PI*2)/8 - Math.PI/2;
    const dx = bCX + Math.cos(angle)*bR;
    const dy = bCY + Math.sin(angle)*bR;
    ctx.fillStyle = i===0 ? "#FFFF00" : "#111";
    ctx.strokeStyle = "#FFFF00"; ctx.lineWidth = 2*s;
    ctx.beginPath(); ctx.arc(dx, dy, 9*s, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
  }

  // Inner badge circle (dark)
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath(); ctx.arc(bCX, bCY, bR*0.72, 0, Math.PI*2); ctx.fill();

  // K letter — huge, in selected font
  ctx.save();
  const kSize = Math.round(bR*1.1);
  ctx.font = cf(font, kSize);
  ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", bCX, bCY + bR*0.02); ctx.restore();

  // "KLOVERS" text under K inside badge
  ctx.fillStyle = "rgba(255,255,0,0.55)"; ctx.font=`700 ${Math.round(bR*0.18)}px 'Arial', sans-serif`;
  ctx.textAlign="center";
  ctx.fillText("KLOVERS", bCX, bCY + bR*0.58); ctx.textAlign="left";

  // "KOREAN COURSE" tag pill (top)
  const tagH=32*s, tagW=180*s, tagX=44*s, tagY=44*s;
  ctx.fillStyle="#FFFF00"; rRect(ctx,tagX,tagY,tagW,tagH,tagH/2); ctx.fill();
  ctx.fillStyle="#111"; ctx.font=`bold ${12*s}px 'Arial Black', sans-serif`;
  ctx.textAlign="center"; ctx.fillText("KOREAN COURSE", tagX+tagW/2, tagY+tagH*0.68); ctx.textAlign="left";

  // Left yellow accent vertical bar
  ctx.fillStyle="#FFFF00"; ctx.fillRect(44*s, 90*s, 5*s, isP ? h*0.3 : h*0.55);

  // Main headline (white, huge)
  const tL=62*s, tW=isP ? w*0.64 : w*0.48;
  const clen=post.mainText.length;
  const mSize=Math.round((clen>22?62:clen>14?78:96)*s);
  ctx.font=cf(font,mSize); ctx.fillStyle="#FFFFFF";
  const tTop = isP ? h*0.20 : h*0.14;
  const afterM=wrapText(ctx, post.mainText, tL, tTop+mSize, tW, mSize*1.12, 2);

  // Thin yellow separator
  ctx.fillStyle="#FFFF00"; ctx.fillRect(tL, afterM+10*s, 60*s, 3*s);

  // Schedule subtitle (yellow for times, white for other lines)
  if (post.subtitle) {
    const lines=post.subtitle.split("\n"); const sSize=Math.round(32*s);
    let sy=afterM+22*s;
    for (const line of lines) {
      if (line.startsWith("🔴")) { ctx.fillStyle="#ff5555"; ctx.font=`700 ${sSize}px 'Arial', sans-serif`; }
      else if (line.startsWith("⚡")) { ctx.fillStyle="#FFFF00"; ctx.font=`700 ${sSize}px 'Arial', sans-serif`; }
      else if (line.includes("•") || line.includes("min")) { ctx.fillStyle="#FFFF00"; ctx.font=`600 ${sSize}px 'Arial', sans-serif`; }
      else { ctx.fillStyle="rgba(255,255,255,0.7)"; ctx.font=`400 ${sSize}px 'Arial', sans-serif`; }
      ctx.fillText(line, tL, sy+sSize); sy+=sSize*1.5;
    }
  }

  // CTA — yellow pill
  const ctaY=h-76*s;
  ctx.fillStyle="#FFFF00"; rRect(ctx,tL,ctaY,210*s,50*s,25*s); ctx.fill();
  ctx.fillStyle="#111"; ctx.font=`bold ${17*s}px 'Arial Black', sans-serif`;
  ctx.textAlign="center"; ctx.fillText("Register Now →", tL+105*s, ctaY+32*s); ctx.textAlign="left";

  // Hashtags bottom
  if (post.extraText) {
    ctx.fillStyle="rgba(255,255,0,0.3)"; ctx.font=`${11*s}px 'Arial', sans-serif`;
    ctx.fillText(post.extraText, tL, h-22*s);
  }
}

// ─── DESIGN 3: Split Card ─────────────────────────────────────────
function renderSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, s: number, font: FontOption, bgImage: HTMLImageElement|null) {
  const isP = h > w;

  if (isP) {
    const cutY=h*0.52, slant=w*0.10;
    ctx.fillStyle="#FFFF00"; ctx.fillRect(0,0,w,h);

    if (bgImage) {
      ctx.save(); ctx.beginPath();
      ctx.moveTo(0,0); ctx.lineTo(w,0); ctx.lineTo(w,cutY+slant); ctx.lineTo(0,cutY); ctx.closePath(); ctx.clip();
      ctx.globalAlpha=0.15;
      const pR=bgImage.width/bgImage.height; let pw=w, ph=w/pR;
      if (ph<cutY+slant){ph=cutY+slant; pw=ph*pR;} ctx.drawImage(bgImage,(w-pw)/2,0,pw,ph);
      ctx.globalAlpha=1; ctx.restore();
    }

    ctx.fillStyle="#111"; ctx.beginPath();
    ctx.moveTo(0,cutY); ctx.lineTo(w,cutY+slant); ctx.lineTo(w,h); ctx.lineTo(0,h); ctx.closePath(); ctx.fill();

    // Accent stripe at angle
    ctx.fillStyle="#FFFF00"; ctx.beginPath();
    ctx.moveTo(0,cutY-3*s); ctx.lineTo(w,cutY+slant-3*s);
    ctx.lineTo(w,cutY+slant+5*s); ctx.lineTo(0,cutY+5*s); ctx.closePath(); ctx.fill();

    // Logo + KLOVERS tag top-left
    drawKLogo(ctx, 52*s, 54*s, 26*s);
    ctx.fillStyle="#111"; ctx.font=`900 ${18*s}px 'Arial Black', sans-serif`;
    ctx.textBaseline="middle"; ctx.fillText("KLOVERS", 90*s, 54*s); ctx.textBaseline="alphabetic";

    // KOREAN COURSE tag
    const tw=158*s, th=26*s;
    ctx.fillStyle="#111"; rRect(ctx,52*s,92*s,tw,th,th/2); ctx.fill();
    ctx.fillStyle="#FFFF00"; ctx.font=`bold ${10*s}px 'Arial', sans-serif`;
    ctx.textAlign="center"; ctx.fillText("KOREAN COURSE", 52*s+tw/2, 92*s+th*0.68); ctx.textAlign="left";

    const clen=post.mainText.length;
    const mSize=Math.round((clen>22?70:clen>14?88:110)*s);
    ctx.font=cf(font,mSize); ctx.fillStyle="#111";
    wrapText(ctx, post.mainText, 52*s, h*0.20+mSize, w*0.88, mSize*1.12, 2);

    // Schedule on black zone
    if (post.subtitle) {
      const lines=post.subtitle.split("\n"); const sSize=Math.round(36*s);
      let sy=cutY+slant+28*s;
      for (const l of lines) {
        if (l.startsWith("🔴")) { ctx.fillStyle="#ff5555"; ctx.font=`700 ${sSize}px 'Arial', sans-serif`; }
        else if (l.startsWith("⚡")) { ctx.fillStyle="#FFFF00"; ctx.font=`700 ${sSize}px 'Arial', sans-serif`; }
        else { ctx.fillStyle="#fff"; ctx.font=`400 ${sSize}px 'Arial', sans-serif`; }
        ctx.fillText(l, 52*s, sy+sSize); sy+=sSize*1.52;
      }
    }

    const ctaY=h-68*s;
    ctx.fillStyle="#FFFF00"; rRect(ctx,52*s,ctaY,210*s,50*s,25*s); ctx.fill();
    ctx.fillStyle="#111"; ctx.font=`bold ${17*s}px 'Arial Black', sans-serif`;
    ctx.textAlign="center"; ctx.fillText("Register Now →", 52*s+105*s, ctaY+32*s); ctx.textAlign="left";

    if (post.extraText) {
      ctx.fillStyle="rgba(255,255,255,0.28)"; ctx.font=`${11*s}px 'Arial', sans-serif`;
      ctx.textAlign="center"; ctx.fillText(post.extraText, w/2, h-18*s); ctx.textAlign="left";
    }
  } else {
    // Landscape
    const cutX=w*0.5, slant=h*0.07;
    ctx.fillStyle="#FFFF00"; ctx.fillRect(0,0,w,h);
    if (bgImage) {
      ctx.save(); ctx.beginPath();
      ctx.moveTo(0,0); ctx.lineTo(cutX+slant,0); ctx.lineTo(cutX,h); ctx.lineTo(0,h); ctx.closePath(); ctx.clip();
      ctx.globalAlpha=0.12;
      const pR=bgImage.width/bgImage.height; let ph=h, pw=h*pR;
      ctx.drawImage(bgImage,0,0,pw,ph); ctx.globalAlpha=1; ctx.restore();
    }
    ctx.fillStyle="#111"; ctx.beginPath();
    ctx.moveTo(cutX,0); ctx.lineTo(w,0); ctx.lineTo(w,h); ctx.lineTo(cutX+slant,h); ctx.closePath(); ctx.fill();

    drawKLogo(ctx,48*s,48*s,24*s);
    ctx.fillStyle="#111"; ctx.font=`900 ${17*s}px 'Arial Black', sans-serif`;
    ctx.textBaseline="middle"; ctx.fillText("KLOVERS", 84*s, 48*s); ctx.textBaseline="alphabetic";

    const clen=post.mainText.length;
    const mSize=Math.round((clen>22?54:clen>14?68:84)*s);
    ctx.font=cf(font,mSize); ctx.fillStyle="#111";
    wrapText(ctx, post.mainText, 48*s, h*0.26+mSize, cutX*0.86, mSize*1.12, 2);

    ctx.fillStyle="#111"; rRect(ctx,48*s,h-54*s,190*s,46*s,23*s); ctx.fill();
    ctx.fillStyle="#FFFF00"; ctx.font=`bold ${15*s}px 'Arial Black', sans-serif`;
    ctx.textAlign="center"; ctx.fillText("Register Now →", 48*s+95*s, h-54*s+29*s); ctx.textAlign="left";

    const rL=cutX+slant+26*s, rW=w-rL-26*s;
    if (post.subtitle) {
      const lines=post.subtitle.split("\n"); const sSize=Math.round(32*s); let sy=h*0.18;
      for (const l of lines) {
        ctx.fillStyle=l.startsWith("🔴")?"#ff5555":l.startsWith("⚡")?"#FFFF00":"#fff";
        ctx.font=`${l.startsWith("🔴")||l.startsWith("⚡")?"700":"400"} ${sSize}px 'Arial', sans-serif`;
        wrapText(ctx,l,rL,sy+sSize,rW,sSize*1.38,2); sy+=sSize*1.62;
      }
    }
    if (post.extraText) {
      ctx.fillStyle="rgba(255,255,255,0.25)"; ctx.font=`${11*s}px 'Arial', sans-serif`;
      ctx.fillText(post.extraText, rL, h-22*s);
    }
  }
}

// ─── Renderer dispatcher ─────────────────────────────────────────
function renderPost(canvas: HTMLCanvasElement, post: PostData, format: FormatKey, style: StyleKey, font: FontOption, bgImage: HTMLImageElement|null) {
  const fmt=FORMATS[format]; const ctx=canvas.getContext("2d")!;
  const w=canvas.width, h=canvas.height, s=w/1080;
  ctx.clearRect(0,0,w,h);
  if      (style==="bold")    renderBold(ctx,post,w,h,s,font,bgImage);
  else if (style==="varsity") renderVarsity(ctx,post,w,h,s,font,bgImage);
  else                        renderSplit(ctx,post,w,h,s,font,bgImage);
}

// ─── Style picker with live 240px thumbnails ─────────────────────
function StylePicker({ style, font, onStyle, post, bgImage }: {
  style: StyleKey; font: FontOption; onStyle: (s: StyleKey) => void;
  post: PostData; bgImage: HTMLImageElement|null;
}) {
  const refs = useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(() => {
    STYLE_META.forEach((sm,i) => {
      const c=refs.current[i]; if(!c) return;
      c.width=240; c.height=240;
      renderPost(c,post,"instagram",sm.key,font,bgImage);
    });
  },[post,font,bgImage]);
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Style</h3>
      <div className="grid grid-cols-3 gap-2">
        {STYLE_META.map((sm,i) => (
          <button key={sm.key} onClick={() => onStyle(sm.key)}
            className={`rounded-xl overflow-hidden border-2 transition-all text-left ${style===sm.key?"border-primary ring-2 ring-primary/30":"border-border hover:border-muted-foreground/40"}`}
          >
            <canvas ref={el=>{refs.current[i]=el;}} className="w-full aspect-square" />
            <div className="px-2 py-1.5">
              <p className="text-[11px] font-semibold text-foreground">{sm.label}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{sm.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Font picker ─────────────────────────────────────────────────
function FontPicker({ value, onChange }: { value: FontKey; onChange: (k: FontKey) => void }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Font</h3>
      <div className="space-y-1.5">
        {FONTS.map(f => (
          <button key={f.key} onClick={() => onChange(f.key)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${value===f.key?"border-primary bg-accent":"border-border hover:border-muted-foreground/30"}`}
          >
            <span style={{ fontFamily: f.css, fontWeight: 700, fontSize: "15px" }} className="text-foreground">
              {f.label}
            </span>
            <span className={`text-[10px] rounded-full px-2 py-0.5 ${value===f.key?"bg-primary text-primary-foreground":"bg-muted text-muted-foreground"}`}>
              {f.tag}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Platform grid previews ───────────────────────────────────────
function PlatformGridPreviews({ posts, style, font, bgImage }: { posts: PostData[]; style: StyleKey; font: FontOption; bgImage: HTMLImageElement|null }) {
  const igR=useRef<(HTMLCanvasElement|null)[]>([]);
  const fbR=useRef<(HTMLCanvasElement|null)[]>([]);
  const stR=useRef<(HTMLCanvasElement|null)[]>([]);
  const ttR=useRef<(HTMLCanvasElement|null)[]>([]);
  useEffect(()=>{
    posts.slice(0,9).forEach((p,i)=>{
      const ig=igR.current[i]; if(ig){ig.width=300;ig.height=300;renderPost(ig,p,"instagram",style,font,bgImage);}
      const fb=fbR.current[i]; if(fb){fb.width=360;fb.height=189;renderPost(fb,p,"facebook",style,font,bgImage);}
      const st=stR.current[i]; if(st){st.width=180;st.height=320;renderPost(st,p,"story",style,font,bgImage);}
      const tt=ttR.current[i]; if(tt){tt.width=180;tt.height=320;renderPost(tt,p,"tiktok",style,font,bgImage);}
    });
  },[posts,style,font,bgImage]);
  const d=posts.slice(0,9); if(!d.length) return null;
  const cols=Math.min(3,d.length);
  return (
    <Tabs defaultValue="instagram" className="w-full">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="instagram" className="text-xs gap-1.5"><Grid3X3 className="h-3.5 w-3.5"/>Instagram</TabsTrigger>
        <TabsTrigger value="facebook"  className="text-xs gap-1.5"><Monitor className="h-3.5 w-3.5"/>Facebook</TabsTrigger>
        <TabsTrigger value="stories"   className="text-xs gap-1.5"><Smartphone className="h-3.5 w-3.5"/>Stories</TabsTrigger>
        <TabsTrigger value="tiktok"    className="text-xs gap-1.5"><Smartphone className="h-3.5 w-3.5"/>TikTok</TabsTrigger>
      </TabsList>
      <TabsContent value="instagram">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="bg-card border rounded-t-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-sm">K</div>
            <div><p className="text-xs font-bold text-foreground">klovers_academy</p><p className="text-[10px] text-muted-foreground">{d.length} posts</p></div>
          </div>
          <div className="grid gap-0.5 rounded-b-xl overflow-hidden border border-t-0 bg-border" style={{gridTemplateColumns:`repeat(${cols},1fr)`,maxWidth:cols*160}}>
            {d.map((p,i)=><canvas key={p.id} ref={el=>{igR.current[i]=el;}} className="w-full aspect-square"/>)}
          </div>
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="facebook">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="space-y-3 max-w-md mx-auto">
            {d.slice(0,3).map((p,i)=>(
              <div key={p.id} className="bg-card border rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 p-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center font-bold text-[10px]">K</div>
                  <div><p className="text-[10px] font-semibold text-foreground">KLovers Academy</p><p className="text-[9px] text-muted-foreground">Sponsored · 🌐</p></div>
                </div>
                <canvas ref={el=>{fbR.current[i]=el;}} className="w-full aspect-[1200/630]"/>
                <div className="flex justify-between px-2.5 py-1.5 border-t text-[9px] text-muted-foreground"><span>👍 Like</span><span>💬 Comment</span><span>↗ Share</span></div>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="stories">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {d.slice(0,6).map((p,i)=>(
              <div key={p.id} className="shrink-0 space-y-1">
                <div className="w-20 rounded-xl overflow-hidden border-2 border-primary shadow-md">
                  <canvas ref={el=>{stR.current[i]=el;}} className="w-full aspect-[9/16]"/>
                </div>
                <p className="text-[9px] text-muted-foreground text-center truncate w-20">{p.mainText.slice(0,14)}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </TabsContent>
      <TabsContent value="tiktok">
        <Card className="rounded-2xl"><CardContent className="p-4">
          <div className="grid gap-0.5 rounded-xl overflow-hidden border bg-border mx-auto" style={{gridTemplateColumns:`repeat(${cols},1fr)`,maxWidth:cols*100}}>
            {d.map((p,i)=><canvas key={p.id} ref={el=>{ttR.current[i]=el;}} className="w-full aspect-[9/16]"/>)}
          </div>
        </CardContent></Card>
      </TabsContent>
    </Tabs>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function CreatorHub() {
  const [posts, setPosts] = useState<PostData[]>([
    { id: uid(), mainText: "Korean Level 1",           subtitle: "Friday • 6:00 PM\n60 min / session",  extraText: "#LearnKorean  #Klovers  #KoreanCourse" },
    { id: uid(), mainText: "Invite a Friend",          subtitle: "Join Korean Level 1\nEvery Friday",   extraText: "#Klovers  #LearnKorean  #KoreanCourse" },
    { id: uid(), mainText: "20% OFF",                  subtitle: "First Month\nCode: SAVE20",           extraText: "#KoreanCourse  #Klovers  #Discount" },
    { id: uid(), mainText: "Refer a Friend",           subtitle: "Get 1 Free Class\nShare your link",   extraText: "#Klovers  #LearnKorean  #KoreanAcademy" },
    { id: uid(), mainText: "Why Learn Korean?",        subtitle: "5 Reasons to Start Today",            extraText: "#KoreanLanguage  #Motivation" },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [format,    setFormat]    = useState<FormatKey>("instagram");
  const [style,     setStyle]     = useState<StyleKey>("varsity");
  const [fontKey,   setFontKey]   = useState<FontKey>("bebas");
  const [bgImage,   setBgImage]   = useState<HTMLImageElement|null>(null);
  const [fontsReady,setFontsReady]= useState(false);
  const [importing, setImporting] = useState(false);
  const [zipping,   setZipping]   = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activePost = posts[activeIdx] || posts[0];
  const font = FONTS.find(f=>f.key===fontKey) || FONTS[0];

  // Wait for Google Fonts to be ready before first render
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  const redraw = useCallback(() => {
    if (!fontsReady) return;
    const canvas = canvasRef.current; if (!canvas || !activePost) return;
    const fmt = FORMATS[format];
    const maxPreview = 540;
    canvas.width  = maxPreview;
    canvas.height = Math.round(maxPreview*(fmt.h/fmt.w));
    renderPost(canvas, activePost, format, style, font, bgImage);
  }, [activePost, format, style, font, bgImage, fontsReady]);

  useEffect(() => { redraw(); }, [redraw]);

  function updatePost(field: keyof PostData, value: string) {
    setPosts(prev => prev.map((p,i) => i===activeIdx ? {...p,[field]:value} : p));
  }
  function addPost() { const n:PostData={id:uid(),mainText:"",subtitle:"",extraText:"#LearnKorean  #Klovers"}; setPosts(p=>[...p,n]); setActiveIdx(posts.length); }
  function removePost(idx:number) { if(posts.length<=1) return; setPosts(p=>p.filter((_,i)=>i!==idx)); setActiveIdx(Math.max(0,activeIdx>=idx?activeIdx-1:activeIdx)); }
  function handleBgUpload(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return;
    const img=new Image(); img.onload=()=>setBgImage(img); img.src=URL.createObjectURL(file);
  }

  async function importFromSchedule() {
    setImporting(true);
    try {
      const {data:pkgGroups}=await supabase.from("pkg_groups").select("id,name,capacity,package_id").eq("is_active",true);
      if(!pkgGroups?.length){toast({title:"No active groups found"});return;}
      const packageIds=[...new Set(pkgGroups.map(g=>g.package_id))];
      const {data:packages}=await supabase.from("schedule_packages").select("id,level,day_of_week,start_time,duration_min").in("id",packageIds);
      const {data:members}=await supabase.from("pkg_group_members").select("group_id").eq("member_status","active");
      const pkgMap=new Map((packages||[]).map(p=>[p.id,p]));
      const counts=new Map<string,number>();
      (members||[]).forEach(m=>counts.set(m.group_id,(counts.get(m.group_id)||0)+1));

      const newPosts:PostData[]=[];

      for(const g of pkgGroups){
        const pkg=pkgMap.get(g.package_id); if(!pkg) continue;
        const seatsLeft=g.capacity-(counts.get(g.id)||0); if(seatsLeft<=0) continue;
        const level=getLevelLabel(pkg.level);
        const [hh,mm]=pkg.start_time.split(":");
        const h=parseInt(hh),ampm=h>=12?"PM":"AM",h12=h%12||12;
        const time=`${h12}:${mm} ${ampm}`;
        const day=DAY_NAMES[pkg.day_of_week]||"";
        const urgencyLine=seatsLeft<=3?`\n🔴 Only ${seatsLeft} seats left!`:seatsLeft<=6?`\n⚡ ${seatsLeft} seats left`:"";

        // 📢 Empty Slot post
        newPosts.push({
          id:uid(), mainText:level,
          subtitle:`${day} • ${time}\n${pkg.duration_min} min / session${urgencyLine}`,
          extraText:seatsLeft<=5?"#LastSeats  #Klovers  #KoreanCourse":"#LearnKorean  #Klovers  #KoreanCourse",
        });

        // 👋 Invite Student post
        newPosts.push({
          id:uid(), mainText:`Join ${level}`,
          subtitle:`Every ${day} • ${time}\n${pkg.duration_min} min sessions`,
          extraText:"#Klovers  #LearnKorean  #KoreanCourse",
        });
      }

      // 🏷️ Discount post
      newPosts.push({
        id:uid(), mainText:"20% OFF",
        subtitle:"First Month\nCode: SAVE20",
        extraText:"#KoreanCourse  #Klovers  #Discount",
      });

      // 🤝 Referral post
      newPosts.push({
        id:uid(), mainText:"Refer a Friend",
        subtitle:"Get 1 Free Class\nShare your link",
        extraText:"#Klovers  #LearnKorean  #KoreanAcademy",
      });

      if(!newPosts.length){toast({title:"All groups are full"});return;}
      setPosts(newPosts); setActiveIdx(0);
      toast({title:`Generated ${newPosts.length} posts`,description:"📢 Empty Slots · 👋 Invite · 🏷️ Discount · 🤝 Referral"});
    } catch(err:any){toast({title:"Import error",description:err.message,variant:"destructive"});}
    finally{setImporting(false);}
  }

  function handleDownload() {
    const fmt=FORMATS[format]; const dl=document.createElement("canvas"); dl.width=fmt.w; dl.height=fmt.h;
    renderPost(dl,activePost,format,style,font,bgImage);
    const a=document.createElement("a"); a.download=`klovers-${style}-${fontKey}-${format}-${Date.now()}.png`;
    a.href=dl.toDataURL("image/png"); a.click();
    toast({title:"Downloaded!",description:`${fmt.w}×${fmt.h}`});
  }

  async function downloadZip(platform:"instagram"|"tiktok"|"all") {
    setZipping(true);
    try {
      const {default:JSZip}=await import("jszip");
      const zip=new JSZip();
      const sizes:FormatKey[]=platform==="instagram"?["instagram","story"]:platform==="tiktok"?["tiktok"]:["instagram","story","facebook","tiktok"];
      posts.forEach((p,pi)=>{
        const slug=(p.mainText||`post-${pi+1}`).replace(/[^a-z0-9]+/gi,"-").toLowerCase().slice(0,30);
        sizes.forEach(size=>{
          const fmt=FORMATS[size]; const c=document.createElement("canvas"); c.width=fmt.w; c.height=fmt.h;
          renderPost(c,p,size,style,font,bgImage);
          zip.file(`${slug}-${size}.png`,c.toDataURL("image/png").split(",")[1],{base64:true});
        });
      });
      const blob=await zip.generateAsync({type:"blob"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download=`klovers-${style}-${fontKey}-${platform}-${Date.now()}.zip`; a.click();
      URL.revokeObjectURL(url);
      toast({title:"ZIP downloaded!",description:`${posts.length} posts × ${sizes.length} sizes`});
    }catch(err:any){toast({title:"ZIP error",description:err.message,variant:"destructive"});}
    finally{setZipping(false);}
  }

  function handleBulkUpload(e:React.ChangeEvent<HTMLInputElement>) {
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader();
    reader.onload=ev=>{
      const lines=(ev.target?.result as string).split("\n").filter(l=>l.trim());
      const newPosts:PostData[]=lines.map(line=>{const p=line.split(",").map(s=>s.trim());return{id:uid(),mainText:p[0]||"",subtitle:p[1]||"",extraText:p[2]||"#LearnKorean #Klovers"};});
      if(newPosts.length){setPosts(p=>[...p,...newPosts]);toast({title:`Imported ${newPosts.length} posts`});}
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
              <Button size="sm" variant="ghost" disabled={activeIdx===0} onClick={()=>setActiveIdx(activeIdx-1)}><ChevronLeft className="h-4 w-4"/></Button>
              <span className="text-sm font-medium text-foreground">{activeIdx+1} / {posts.length}</span>
              <Button size="sm" variant="ghost" disabled={activeIdx>=posts.length-1} onClick={()=>setActiveIdx(activeIdx+1)}><ChevronRight className="h-4 w-4"/></Button>
            </div>
          </div>
          <div className="flex justify-center">
            <canvas ref={canvasRef} className="rounded-xl border shadow-lg max-w-full" style={{maxHeight:560}}/>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">{FORMATS[format].w}×{FORMATS[format].h} — {FORMATS[format].label}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={handleDownload}><Download className="h-4 w-4 mr-2"/>Download</Button>
            <Button variant="outline" onClick={()=>downloadZip("instagram")} disabled={zipping}>{zipping?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<FileDown className="h-4 w-4 mr-2"/>}Instagram ZIP</Button>
            <Button variant="outline" onClick={()=>downloadZip("tiktok")} disabled={zipping}>{zipping?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<FileDown className="h-4 w-4 mr-2"/>}TikTok ZIP</Button>
            {posts.length>1&&<Button variant="outline" onClick={()=>downloadZip("all")} disabled={zipping}>{zipping?<Loader2 className="h-4 w-4 mr-2 animate-spin"/>:<FileDown className="h-4 w-4 mr-2"/>}All ZIP ({posts.length})</Button>}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="space-y-5 overflow-y-auto max-h-[82vh] pr-1">

          {/* Import from Schedule */}
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Auto-generate all post types</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">📢 Empty Slots · 👋 Invite · 🏷️ Discount · 🤝 Referral</p>
            </div>
            <Button size="sm" onClick={importFromSchedule} disabled={importing}>
              {importing?<Loader2 className="h-4 w-4 mr-1.5 animate-spin"/>:<Wand2 className="h-4 w-4 mr-1.5"/>}{importing?"Loading…":"Import"}
            </Button>
          </div>

          <StylePicker style={style} font={font} onStyle={setStyle} post={activePost} bgImage={bgImage}/>
          <FontPicker value={fontKey} onChange={setFontKey}/>

          {/* Format */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Format</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FORMATS) as [FormatKey,FormatOption][]).map(([key,val])=>(
                <button key={key} onClick={()=>setFormat(key)} className={`p-2.5 rounded-lg border text-left transition-colors ${format===key?"border-primary bg-accent":"border-border hover:border-muted-foreground/30"}`}>
                  <span className="text-xs font-medium text-foreground block">{val.label}</span>
                  <span className="text-[10px] text-muted-foreground">{val.w}×{val.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Photo */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Photo (optional)</h3>
            {bgImage?(
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border aspect-square w-full max-w-[160px] mx-auto shadow-md">
                  <img src={bgImage.src} alt="Uploaded" className="w-full h-full object-cover"/>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center py-1"><span className="text-[10px] text-yellow-300 font-medium">Photo active</span></div>
                </div>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center gap-1 border border-border rounded-md py-1.5 cursor-pointer hover:border-muted-foreground/40 text-xs text-muted-foreground">
                    <Upload className="h-3.5 w-3.5"/>Change<input type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
                  </label>
                  <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={()=>setBgImage(null)}>Remove</Button>
                </div>
              </div>
            ):(
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-border rounded-xl p-5 cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground"/>
                <p className="text-xs font-medium text-foreground">Upload photo</p>
                <p className="text-[10px] text-muted-foreground">Adds photo overlay to your post</p>
                <input type="file" accept="image/*" className="hidden" onChange={handleBgUpload}/>
              </label>
            )}
          </div>

          {/* Text Fields */}
          <div><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Main Text</h3>
            <Textarea value={activePost.mainText} onChange={e=>updatePost("mainText",e.target.value)} className="text-sm min-h-[68px]" placeholder="Korean Level 1"/></div>
          <div><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Subtitle</h3>
            <Textarea value={activePost.subtitle} onChange={e=>updatePost("subtitle",e.target.value)} className="text-sm min-h-[60px]" placeholder={"Friday • 6:00 PM\n60 min / session"}/></div>
          <div><h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hashtags</h3>
            <Input value={activePost.extraText} onChange={e=>updatePost("extraText",e.target.value)} className="text-sm" placeholder="#LearnKorean  #Klovers"/></div>

          {/* Posts List */}
          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Posts ({posts.length})</h3>
              <Button size="sm" variant="outline" onClick={addPost}><Plus className="h-3 w-3 mr-1"/>Add</Button>
            </div>
            <div className="space-y-1 max-h-44 overflow-y-auto">
              {posts.map((p,i)=>(
                <div key={p.id} className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-xs transition-colors ${i===activeIdx?"bg-accent text-accent-foreground":"hover:bg-muted text-foreground"}`} onClick={()=>setActiveIdx(i)}>
                  <span className="flex-1 truncate">{p.mainText||`Post ${i+1}`}</span>
                  {posts.length>1&&<Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={e=>{e.stopPropagation();removePost(i);}}><Trash2 className="h-3 w-3"/></Button>}
                </div>
              ))}
            </div>
          </div>

          {/* Bulk CSV */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Bulk Upload CSV</h3>
            <label className="flex flex-col items-center gap-1 border-2 border-dashed border-border rounded-lg p-3 cursor-pointer hover:border-muted-foreground/40 transition-colors">
              <Upload className="h-4 w-4 text-muted-foreground"/>
              <span className="text-[10px] text-muted-foreground">Upload CSV or TXT</span>
              <input type="file" accept=".csv,.txt" className="hidden" onChange={handleBulkUpload}/>
            </label>
            <p className="text-[10px] text-muted-foreground mt-1">main text, subtitle, extra (one per line)</p>
          </div>
        </div>
      </div>

      {/* Platform Grid Preview */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <Grid3X3 className="h-4 w-4"/>Platform Grid Preview
          <Badge variant="outline" className="text-[10px]">{posts.length} posts</Badge>
        </h2>
        <PlatformGridPreviews posts={posts} style={style} font={font} bgImage={bgImage}/>
      </div>
    </div>
  );
}
