// Shared canvas renderer — used by both CreatorHub and MarketingGeneratorPage

export interface PostData {
  id: string;
  mainText: string;
  subtitle: string;
  extraText: string;
}

export type TemplateName = "classic" | "character" | "minimal" | "gradient" | "neon" | "dark" | "editorial" | "klovers_bold" | "klovers_varsity" | "klovers_split";
export type ColorTheme = "yellow" | "midnight" | "coral" | "forest" | "lavender" | "sunset" | "ocean" | "mono";
export type FormatKey = "instagram" | "story" | "facebook" | "tiktok";

export interface FormatOption { label: string; w: number; h: number; }

export const FORMATS: Record<FormatKey, FormatOption> = {
  instagram: { label: "Instagram Post", w: 1080, h: 1080 },
  story:     { label: "Stories / Reels", w: 1080, h: 1920 },
  facebook:  { label: "Facebook Post", w: 1200, h: 630 },
  tiktok:    { label: "TikTok Cover", w: 1080, h: 1920 },
};

export const THEME_COLORS: Record<ColorTheme, { bg: string; text: string; accent: string; label: string; dot: string }> = {
  yellow:   { bg: "#FFFF00", text: "#1a1a1a", accent: "#333",    label: "Classic Yellow", dot: "#FFFF00" },
  midnight: { bg: "#1a1a2e", text: "#e0e0e0", accent: "#9b87f5", label: "Midnight",       dot: "#9b87f5" },
  coral:    { bg: "#ff6b6b", text: "#fff",    accent: "#ffeaa7", label: "Coral Reef",     dot: "#ff6b6b" },
  forest:   { bg: "#2d6a4f", text: "#d8f3dc", accent: "#95d5b2", label: "Forest",         dot: "#2d6a4f" },
  lavender: { bg: "#e8d5f5", text: "#2d1b4e", accent: "#9b59b6", label: "Lavender",       dot: "#e8d5f5" },
  sunset:   { bg: "#ff7f50", text: "#fff",    accent: "#ffe0b2", label: "Sunset",         dot: "#ff7f50" },
  ocean:    { bg: "#0077b6", text: "#caf0f8", accent: "#90e0ef", label: "Ocean",          dot: "#0077b6" },
  mono:     { bg: "#f5f5f5", text: "#222",    accent: "#888",    label: "Monochrome",     dot: "#ccc" },
};

export const TEMPLATE_META: { key: TemplateName; label: string; desc: string; isKlovers?: boolean }[] = [
  { key: "klovers_bold",    label: "⚡ Bold",    desc: "Yellow frame + K badge",        isKlovers: true },
  { key: "klovers_varsity", label: "🏆 Varsity", desc: "Dark + championship ring glow", isKlovers: true },
  { key: "klovers_split",   label: "⚡ Split",   desc: "Yellow & black diagonal cut",   isKlovers: true },
  { key: "classic",   label: "Classic Yellow", desc: "Bold yellow background" },
  { key: "character", label: "Character Art",  desc: "Illustrated overlay" },
  { key: "minimal",   label: "Minimal",        desc: "Clean with border inset" },
  { key: "gradient",  label: "Gradient",       desc: "Smooth color blend" },
  { key: "neon",      label: "Neon",           desc: "Dark with glow effects" },
  { key: "dark",      label: "Dark",           desc: "Elegant dark theme" },
  { key: "editorial", label: "Editorial",      desc: "Magazine-style layout" },
];

// ─── Canvas Helpers ───

export function rRect(ctx: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + rw - r, y);
  ctx.quadraticCurveTo(x + rw, y, x + rw, y + r);
  ctx.lineTo(x + rw, y + rh - r);
  ctx.quadraticCurveTo(x + rw, y + rh, x + rw - r, y + rh);
  ctx.lineTo(x + r, y + rh);
  ctx.quadraticCurveTo(x, y + rh, x, y + rh - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines = 99) {
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
  lines.slice(0, maxLines).forEach((l, i) => ctx.fillText(l, x, y + i * lineH));
}

// ─── Klovers Brand Designs ───────────────────────────────────────────────────

// Design 1 — Bold Yellow Poster: clean yellow bg, black top/bottom bars, centered headline
function renderKloversBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, _isPortrait: boolean) {
  const S = scale;
  const barH = 72 * S;
  const pad = 64 * S;

  // Yellow background
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, w, h);

  // Black top + bottom bars
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Top bar text
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${13 * S}px 'Inter', sans-serif`;
  ctx.fillText("KLOVERS  ·  한국어 학원", w / 2, barH / 2);

  // Bottom bar text
  ctx.font = `500 ${12 * S}px 'Inter', sans-serif`;
  ctx.fillText("kloversegy.com", w / 2, h - barH / 2);

  // Headline — auto-size, centered
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const maxW = w - pad * 2;
  const longestWord = Math.max(...post.mainText.split(/\s+/).map(wd => wd.length));
  const fontSize = Math.min(w * 0.13, (maxW * 0.92) / (longestWord * 0.52));
  ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = "#111111";

  // Vertically center the text block in the content area
  const contentTop = barH;
  const contentH = h - barH * 2;
  const estLines = Math.min(3, Math.ceil(post.mainText.replace(/\n/g, " ").length / 10));
  const mainH = estLines * fontSize * 1.08;
  const subH = post.subtitle ? 26 * S * 2 : 0;
  const gap = post.subtitle ? 18 * S : 0;
  const blockH = mainH + gap + subH;
  const startY = contentTop + (contentH - blockH) / 2 + fontSize * 0.8;

  wrapText(ctx, post.mainText, w / 2, startY, maxW, fontSize * 1.08, 3);

  if (post.subtitle) {
    ctx.font = `400 ${18 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#333333";
    wrapText(ctx, post.subtitle, w / 2, startY + mainH + gap, maxW * 0.85, 26 * S, 3);
  }

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// Design 2 — Dark Minimal: black bg, yellow accent bar, white headline, yellow subtitle
function renderKloversVarsity(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, _isPortrait: boolean) {
  const S = scale;
  const pad = 72 * S;
  const accentW = 8 * S;

  // Black background
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, h);

  // Yellow left accent bar
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, accentW, h);

  // "KLOVERS" label top-left
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = `700 ${13 * S}px 'Inter', sans-serif`;
  ctx.fillText("KLOVERS  ·  한국어 학원", pad, 68 * S);

  // Yellow underline under label
  ctx.fillRect(pad, 75 * S, 56 * S, 2 * S);

  // Headline — white, large, left-aligned
  const maxW = w - pad - 48 * S;
  const longestWord = Math.max(...post.mainText.split(/\s+/).map(wd => wd.length));
  const fontSize = Math.min(w * 0.12, (maxW * 0.92) / (longestWord * 0.52));
  ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  wrapText(ctx, post.mainText, pad, h * 0.35, maxW, fontSize * 1.08, 3);

  if (post.subtitle) {
    ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFF00";
    wrapText(ctx, post.subtitle, pad, h * 0.35 + fontSize * 2.6, maxW, 26 * S, 3);
  }

  // Bottom: website
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = `500 ${12 * S}px 'Inter', sans-serif`;
  ctx.fillText("kloversegy.com", pad, h - 40 * S);
}

// Design 3 — Split: top half black with white headline, bottom half yellow with CTA
function renderKloversSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, _isPortrait: boolean) {
  const S = scale;
  const midY = h / 2;
  const pad = 64 * S;
  const divH = 5 * S;

  // Top half: black
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, midY);

  // Bottom half: yellow
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, midY, w, midY);

  // White divider line
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, midY - divH / 2, w, divH);

  // Top area: small "KLOVERS" label
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
  ctx.fillText("KLOVERS  ·  한국어 학원", w / 2, 38 * S);

  // Top area: main headline, white, centered
  const maxW = w - pad * 2;
  const longestWord = Math.max(...post.mainText.split(/\s+/).map(wd => wd.length));
  const fontSize = Math.min(w * 0.12, (maxW * 0.9) / (longestWord * 0.52));
  ctx.font = `900 ${fontSize}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFFFF";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const hlY = 38 * S + (midY - 38 * S) / 2 - fontSize * 0.5 + fontSize * 0.8;
  wrapText(ctx, post.mainText, w / 2, hlY, maxW, fontSize * 1.08, 2);

  // Bottom area: subtitle, black, centered
  if (post.subtitle) {
    ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    wrapText(ctx, post.subtitle, w / 2, midY + 52 * S, maxW * 0.85, 26 * S, 3);
  }

  // CTA pill — bottom half
  const ctaW = 210 * S, ctaH = 52 * S;
  const ctaX = (w - ctaW) / 2;
  const ctaY = h - 90 * S;
  ctx.fillStyle = "#111111";
  rRect(ctx, ctaX, ctaY, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${15 * S}px 'Inter', sans-serif`;
  ctx.fillText("Register Now  →", ctaX + ctaW / 2, ctaY + ctaH / 2);

  // "kloversegy.com" very bottom
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText("kloversegy.com", w / 2, h - 18 * S);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// ─── Mascot image cache (loaded once from /klovers-mascot.png) ───
let _mascot: HTMLImageElement | null = null;
let _mascotLoaded = false;
export function preloadMascot() {
  if (_mascotLoaded) return;
  _mascotLoaded = true;
  const img = new Image();
  img.onload = () => { _mascot = img; };
  img.onerror = () => {};
  img.src = "/klovers-mascot.png";
}

// ─── Main Canvas Renderer ───

export function renderPost(
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
  const isPortrait = h > w;
  const isDark = template === "neon" || template === "dark";

  ctx.clearRect(0, 0, w, h);

  // ─── Klovers brand designs ────────────────────────────────
  if (template === "klovers_bold")    { renderKloversBold(ctx, post, w, h, scale, isPortrait);    return; }
  if (template === "klovers_varsity") { renderKloversVarsity(ctx, post, w, h, scale, isPortrait); return; }
  if (template === "klovers_split")   { renderKloversSplit(ctx, post, w, h, scale, isPortrait);   return; }

  // ─── PHOTO SPLIT LAYOUT ───────────────────────────────────
  if (bgImage) {
    if (isPortrait) {
      // Portrait: photo top 44%, theme-colour text zone bottom 56%
      const splitY = h * 0.44;
      const slant = w * 0.07;

      // Clip & draw photo in top zone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let pw = w, ph = w / pR;
      if (ph < splitY + slant) { ph = splitY + slant; pw = ph * pR; }
      const px = (w - pw) / 2;
      ctx.drawImage(bgImage, px, 0, pw, ph);
      const fadeGrad = ctx.createLinearGradient(0, splitY * 0.5, 0, splitY + slant);
      fadeGrad.addColorStop(0, "rgba(0,0,0,0)");
      fadeGrad.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = fadeGrad; ctx.fill();
      ctx.restore();

      // Theme-colour bottom zone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
      ctx.lineTo(w, h); ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = c.bg; ctx.fill();
      ctx.restore();

      // Black diagonal accent strip
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, splitY - 5 * scale); ctx.lineTo(w, splitY + slant - 5 * scale);
      ctx.lineTo(w, splitY + slant); ctx.lineTo(0, splitY);
      ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
      ctx.restore();

      // Text zone
      const tLeft = 40 * scale;
      const tTop  = splitY + slant + 26 * scale;
      const tW    = w - 80 * scale;

      ctx.fillStyle = "#1a1a1a";
      ctx.font = `700 ${14 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KOREAN COURSE", tLeft, tTop + 16 * scale);
      ctx.fillRect(tLeft, tTop + 24 * scale, 52 * scale, 3 * scale);

      const mSize = Math.min(82 * scale, tW * 0.2);
      ctx.font = `900 ${mSize}px 'Inter', 'Segoe UI', sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      wrapText(ctx, post.mainText, tLeft, tTop + 56 * scale, tW, mSize * 1.12, 2);

      if (post.subtitle) {
        const sSize = mSize * 0.46;
        ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, tLeft, tTop + mSize * 2.4 + 56 * scale, tW, sSize * 1.45, 3);
      }

      // CTA button
      const ctaY = h - 72 * scale;
      ctx.fillStyle = "#1a1a1a";
      rRect(ctx, tLeft, ctaY, 174 * scale, 42 * scale, 21 * scale);
      ctx.fill();
      ctx.font = `bold ${14 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("Register Now →", tLeft + 87 * scale, ctaY + 28 * scale);
      ctx.textAlign = "start";

      // Hashtags
      if (post.extraText) {
        ctx.fillStyle = "#1a1a1a88";
        ctx.font = `${12 * scale}px 'Inter', sans-serif`;
        ctx.fillText(post.extraText, tLeft, h - 22 * scale);
      }

    } else {
      // Landscape/Square: photo left 47%, theme-colour right 53%
      const splitX = w * 0.47;
      const slant  = h * 0.05;

      // Clip & draw photo on left
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
      ctx.lineTo(splitX, h); ctx.lineTo(0, h);
      ctx.closePath(); ctx.clip();
      const pR = bgImage.width / bgImage.height;
      let ph = h, pw = h * pR;
      if (pw < splitX + slant) { pw = splitX + slant; ph = pw / pR; }
      ctx.drawImage(bgImage, 0, (h - ph) / 2, pw, ph);
      ctx.restore();

      // Black diagonal separator
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(splitX - 4 * scale, 0); ctx.lineTo(splitX + slant - 4 * scale, h);
      ctx.lineTo(splitX + slant, h); ctx.lineTo(splitX, 0);
      ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
      ctx.restore();

      // Theme-colour right zone
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(splitX, 0); ctx.lineTo(w, 0);
      ctx.lineTo(w, h); ctx.lineTo(splitX + slant, h);
      ctx.closePath(); ctx.fillStyle = c.bg; ctx.fill();
      ctx.restore();

      // Text zone
      const tLeft = splitX + slant + 28 * scale;
      const tW    = w - tLeft - 28 * scale;
      const tTop  = h * 0.13;

      ctx.fillStyle = "#1a1a1a";
      ctx.font = `700 ${13 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KOREAN COURSE", tLeft, tTop);
      ctx.fillRect(tLeft, tTop + 8 * scale, 48 * scale, 3 * scale);

      const mSize = Math.min(62 * scale, tW * 0.2);
      ctx.font = `900 ${mSize}px 'Inter', 'Segoe UI', sans-serif`;
      ctx.fillStyle = "#1a1a1a";
      wrapText(ctx, post.mainText, tLeft, tTop + 32 * scale, tW, mSize * 1.15, 2);

      if (post.subtitle) {
        const sSize = mSize * 0.46;
        ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
        ctx.fillStyle = "#333";
        wrapText(ctx, post.subtitle, tLeft, h * 0.62, tW, sSize * 1.45, 3);
      }

      // K logo + KLOVERS
      const logoY = h - 38 * scale;
      ctx.fillStyle = "#1a1a1a";
      ctx.beginPath();
      ctx.arc(tLeft + 16 * scale, logoY, 15 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center";
      ctx.fillText("K", tLeft + 16 * scale, logoY + 5 * scale);
      ctx.textAlign = "start";
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${12 * scale}px 'Inter', sans-serif`;
      ctx.fillText("KLOVERS", tLeft + 38 * scale, logoY + 5 * scale);
    }
    return;
  }

  // ─── NO-PHOTO LAYOUTS — 7 distinct brand-aligned designs ─────

  const S = scale;
  const pad = 68 * S;
  const maxW = w - pad * 2;
  const longestWord = Math.max(...post.mainText.split(/\s+/).map(wd => wd.length));
  const autoFont = (max: number) => Math.min(max * S, (maxW * 0.9) / (longestWord * 0.52));

  // ── 1. CLASSIC — white bg, yellow top panel, black headline ──
  if (template === "classic") {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
    // Yellow top band (38%)
    const bandH = h * 0.38;
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, bandH);
    // "KLOVERS" in band, top-left
    ctx.fillStyle = "#111111"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${13 * S}px 'Inter', sans-serif`;
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 52 * S);
    ctx.fillRect(pad, 59 * S, 52 * S, 2 * S);
    // Big headline spanning band into white
    const fs = autoFont(isPortrait ? 108 : 84);
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    wrapText(ctx, post.mainText, pad, bandH * 0.42 + fs * 0.8, maxW, fs * 1.08, 3);
    // Subtitle (white zone)
    if (post.subtitle) {
      ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#444444";
      wrapText(ctx, post.subtitle, pad, bandH + 42 * S, maxW, 26 * S, 3);
    }
    // CTA
    const ctaY = h - 112 * S;
    ctx.fillStyle = "#111111"; rRect(ctx, pad, ctaY, 210 * S, 52 * S, 26 * S); ctx.fill();
    ctx.fillStyle = "#FFFF00"; ctx.font = `700 ${15 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Register Now  →", pad + 105 * S, ctaY + 26 * S);
    // Website bottom
    ctx.fillStyle = "#999999"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText("kloversegy.com", pad, h - 28 * S);
    ctx.textAlign = "left"; return;
  }

  // ── 2. CHARACTER — mascot left, text right (or full if no mascot) ──
  if (template === "character") {
    const mascot = _mascot;
    if (mascot) {
      // Mascot on right (transparent-bg PNG), text on left
      ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, h);
      // Black left strip
      const stripW = w * 0.52;
      ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, stripW, h);
      // Draw mascot right side (PNG with transparency — fits in right 48%)
      const imgW = w * 0.5, imgH = imgW * (mascot.height / mascot.width);
      ctx.drawImage(mascot, w * 0.5, (h - imgH) / 2, imgW, imgH);
      // Text on black left
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
      ctx.fillText("KLOVERS  ·  한국어 학원", 48 * S, 58 * S);
      const fs = autoFont(isPortrait ? 90 : 68);
      ctx.font = `900 ${fs}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFFFF";
      wrapText(ctx, post.mainText, 48 * S, h * 0.34, stripW - 64 * S, fs * 1.08, 3);
      if (post.subtitle) {
        ctx.font = `400 ${16 * S}px 'Inter', sans-serif`;
        ctx.fillStyle = "#FFFF00";
        wrapText(ctx, post.subtitle, 48 * S, h * 0.34 + fs * 2.8, stripW - 64 * S, 24 * S, 3);
      }
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
      ctx.fillText("kloversegy.com", 48 * S, h - 38 * S);
    } else {
      // No mascot — cream bg, speech bubble style
      ctx.fillStyle = "#FFFDE7"; ctx.fillRect(0, 0, w, h);
      // Top black bar
      ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, w, 68 * S);
      ctx.fillStyle = "#FFFF00"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = `700 ${13 * S}px 'Inter', sans-serif`;
      ctx.fillText("KLOVERS  ·  한국어 학원", w / 2, 34 * S);
      // Large 한 character, styled
      ctx.fillStyle = "rgba(255,230,0,0.25)"; ctx.font = `900 ${280 * S}px serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("한", w / 2, h * 0.52);
      // Headline
      const fs = autoFont(isPortrait ? 96 : 76);
      ctx.font = `900 ${fs}px 'Inter', sans-serif`;
      ctx.fillStyle = "#111111"; ctx.textBaseline = "alphabetic";
      wrapText(ctx, post.mainText, w / 2, h * 0.35, maxW, fs * 1.08, 3);
      if (post.subtitle) {
        ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
        ctx.fillStyle = "#555555";
        wrapText(ctx, post.subtitle, w / 2, h * 0.35 + fs * 2.6, maxW, 25 * S, 3);
      }
      ctx.fillStyle = "#111111"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
      ctx.fillText("kloversegy.com", w / 2, h - 28 * S);
    }
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic"; return;
  }

  // ── 3. MINIMAL — white bg, single yellow underline, clean type ──
  if (template === "minimal") {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
    // Yellow underline accent under brand label
    ctx.fillStyle = "#111111"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 56 * S);
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(pad, 64 * S, w - pad * 2, 4 * S);
    // Headline
    const fs = autoFont(isPortrait ? 104 : 82);
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    wrapText(ctx, post.mainText, pad, h * 0.36, maxW, fs * 1.08, 3);
    if (post.subtitle) {
      ctx.font = `300 ${17 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#666666";
      wrapText(ctx, post.subtitle, pad, h * 0.36 + fs * 2.6, maxW, 25 * S, 3);
    }
    // Thin yellow bottom rule + site
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(pad, h - 60 * S, w - pad * 2, 3 * S);
    ctx.fillStyle = "#111111"; ctx.font = `500 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillText("kloversegy.com", pad, h - 26 * S);
    ctx.textAlign = "left"; return;
  }

  // ── 4. GRADIENT — black bg, large yellow "K", bold white headline ──
  if (template === "gradient") {
    ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, w, h);
    // Big decorative "K" watermark (brand color, faded)
    ctx.save();
    ctx.fillStyle = "rgba(255,255,0,0.08)";
    ctx.font = `900 ${h * 0.72}px 'Inter', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", w / 2, h / 2);
    ctx.restore();
    // Yellow top accent bar
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, 0, w, 10 * S);
    // Label
    ctx.fillStyle = "#FFFF00"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 52 * S);
    // White headline
    const fs = autoFont(isPortrait ? 108 : 84);
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    wrapText(ctx, post.mainText, pad, h * 0.36, maxW, fs * 1.08, 3);
    if (post.subtitle) {
      ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      wrapText(ctx, post.subtitle, pad, h * 0.36 + fs * 2.8, maxW, 26 * S, 3);
    }
    // CTA
    const ctaY = h - 108 * S;
    ctx.fillStyle = "#FFFF00"; rRect(ctx, pad, ctaY, 210 * S, 52 * S, 26 * S); ctx.fill();
    ctx.fillStyle = "#111111"; ctx.font = `700 ${15 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Register Now  →", pad + 105 * S, ctaY + 26 * S);
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("kloversegy.com", pad, h - 28 * S);
    return;
  }

  // ── 5. NEON — black bg, yellow glow headline, line accents ──
  if (template === "neon") {
    ctx.fillStyle = "#0a0a0a"; ctx.fillRect(0, 0, w, h);
    // Horizontal yellow lines (decorative)
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, h * 0.14, w, 2 * S);
    ctx.fillRect(0, h * 0.86, w, 2 * S);
    // Label
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFF00";
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 58 * S);
    // Glow headline
    const fs = autoFont(isPortrait ? 104 : 82);
    ctx.save();
    ctx.shadowColor = "#FFFF00"; ctx.shadowBlur = 24 * S;
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    wrapText(ctx, post.mainText, pad, h * 0.35, maxW, fs * 1.08, 3);
    ctx.restore();
    if (post.subtitle) {
      ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      wrapText(ctx, post.subtitle, pad, h * 0.35 + fs * 2.6, maxW, 26 * S, 3);
    }
    // Yellow CTA
    const ctaY = h - 106 * S;
    ctx.fillStyle = "#FFFF00"; rRect(ctx, pad, ctaY, 210 * S, 52 * S, 26 * S); ctx.fill();
    ctx.fillStyle = "#111111"; ctx.font = `700 ${15 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Register Now  →", pad + 105 * S, ctaY + 26 * S);
    ctx.fillStyle = "rgba(255,255,0,0.35)"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("kloversegy.com", pad, h - 28 * S);
    return;
  }

  // ── 6. DARK — black bg, yellow right panel, white text left ──
  if (template === "dark") {
    ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, w, h);
    // Yellow right panel (32% width)
    const panelX = w * 0.68;
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(panelX, 0, w - panelX, h);
    // "K" big in yellow panel
    ctx.fillStyle = "#111111"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = `900 ${(w - panelX) * 1.1}px 'Inter', sans-serif`;
    ctx.fillText("K", panelX + (w - panelX) / 2, h / 2);
    // "KLOVERS" vertical text in panel
    ctx.save();
    ctx.translate(panelX + (w - panelX) / 2, h * 0.88);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `700 ${10 * S}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText("KLOVERS KOREAN ACADEMY", 0, 0);
    ctx.restore();
    // Label + headline on dark left
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#FFFF00"; ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 54 * S);
    ctx.fillRect(pad, 62 * S, 48 * S, 2 * S);
    const fs = autoFont(isPortrait ? 96 : 72);
    const textMaxW = panelX - pad - 20 * S;
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    wrapText(ctx, post.mainText, pad, h * 0.35, textMaxW, fs * 1.08, 3);
    if (post.subtitle) {
      ctx.font = `400 ${16 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFFF00";
      wrapText(ctx, post.subtitle, pad, h * 0.35 + fs * 2.8, textMaxW, 25 * S, 3);
    }
    ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
    ctx.fillText("kloversegy.com", pad, h - 38 * S);
    return;
  }

  // ── 7. EDITORIAL — magazine grid: black header zone, yellow body ──
  if (template === "editorial") {
    ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, w, h);
    // Black top zone (42%)
    const topH = h * 0.42;
    ctx.fillStyle = "#111111"; ctx.fillRect(0, 0, w, topH);
    // Yellow accent strip
    ctx.fillStyle = "#FFFF00"; ctx.fillRect(0, topH, w, 8 * S);
    // Top zone: label + headline in white
    ctx.fillStyle = "#FFFF00"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.font = `700 ${12 * S}px 'Inter', sans-serif`;
    ctx.fillText("KLOVERS  ·  한국어 학원", pad, 50 * S);
    const fs = autoFont(isPortrait ? 96 : 74);
    ctx.font = `900 ${fs}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    wrapText(ctx, post.mainText, pad, topH * 0.32 + fs * 0.8, maxW, fs * 1.08, 2);
    // Bottom zone: subtitle + CTA on white
    if (post.subtitle) {
      ctx.font = `400 ${17 * S}px 'Inter', sans-serif`;
      ctx.fillStyle = "#333333";
      wrapText(ctx, post.subtitle, pad, topH + 52 * S, maxW, 26 * S, 3);
    }
    const ctaY = h - 108 * S;
    ctx.fillStyle = "#111111"; rRect(ctx, pad, ctaY, 210 * S, 52 * S, 26 * S); ctx.fill();
    ctx.fillStyle = "#FFFF00"; ctx.font = `700 ${15 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("Register Now  →", pad + 105 * S, ctaY + 26 * S);
    ctx.fillStyle = "#999999"; ctx.font = `500 ${11 * S}px 'Inter', sans-serif`;
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("kloversegy.com", pad, h - 26 * S);
    return;
  }
}
