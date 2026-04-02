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

  // ─── NO-PHOTO LAYOUTS ─────────────────────────────────────
  const isBrand = !isDark && template !== "minimal";

  // Background fill
  if (template === "gradient") {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, c.bg); grad.addColorStop(1, c.accent);
    ctx.fillStyle = grad;
  } else if (template === "neon") {
    ctx.fillStyle = "#0a0a0a";
  } else if (template === "dark") {
    ctx.fillStyle = "#1a1a1a";
  } else {
    ctx.fillStyle = c.bg;
  }
  ctx.fillRect(0, 0, w, h);

  // Diagonal triangle accent (bottom-right)
  if (isBrand) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.52, h); ctx.lineTo(w, h * 0.42); ctx.lineTo(w, h);
    ctx.closePath(); ctx.fillStyle = "#1a1a1a"; ctx.fill();
    ctx.restore();
  }

  // Korean 한 watermark
  if (isBrand) {
    ctx.save();
    ctx.font = `bold ${h * 0.58}px serif`;
    ctx.fillStyle = "rgba(0,0,0,0.065)";
    ctx.textAlign = "right";
    ctx.fillText("한", w - 18 * scale, h * 0.82);
    ctx.textAlign = "start";
    ctx.restore();
  }

  // Left vertical accent bar
  ctx.fillStyle = isDark ? c.accent : "#1a1a1a";
  ctx.fillRect(38 * scale, 38 * scale, 5 * scale, h * 0.2);

  if (template === "minimal") {
    ctx.strokeStyle = c.text; ctx.lineWidth = 3 * scale;
    const m = 30 * scale; ctx.strokeRect(m, m, w - m * 2, h - m * 2);
  }

  // Neon glow on
  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 24 * scale; }

  // Text layout
  const pad    = 54 * scale;
  const tLeft  = pad;
  const tW     = w - pad * 2;
  const eyeY   = h * 0.2;
  const eyeColor = isDark ? (template === "neon" ? c.accent : "#aaa") : "#1a1a1a";

  // Eyebrow
  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";
  ctx.fillStyle = eyeColor;
  ctx.font = `700 ${14 * scale}px 'Inter', sans-serif`;
  ctx.fillText("KOREAN COURSE", tLeft, eyeY);
  ctx.fillStyle = eyeColor;
  ctx.fillRect(tLeft, eyeY + 9 * scale, 56 * scale, 3 * scale);

  if (template === "neon") { ctx.shadowColor = c.accent; ctx.shadowBlur = 18 * scale; }

  // Main text — BIG & BOLD
  const mSize = Math.min(isPortrait ? 96 * scale : 78 * scale, tW * (isPortrait ? 0.165 : 0.14));
  ctx.font = `900 ${mSize}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.fillStyle = isDark ? "#fff" : "#1a1a1a";
  wrapText(ctx, post.mainText, tLeft, eyeY + 42 * scale, tW, mSize * 1.12, 2);

  ctx.shadowBlur = 0; ctx.shadowColor = "transparent";

  // Subtitle
  if (post.subtitle) {
    const sSize = mSize * 0.44;
    ctx.font = `500 ${sSize}px 'Inter', sans-serif`;
    ctx.fillStyle = isDark ? "#bbb" : "#333";
    wrapText(ctx, post.subtitle, tLeft, eyeY + mSize * 2.4 + 42 * scale, tW, sSize * 1.45, 3);
  }

  // CTA pill button
  const ctaY  = h * (isPortrait ? 0.76 : 0.72);
  const ctaBg = isDark ? c.accent : "#1a1a1a";
  ctx.fillStyle = ctaBg;
  rRect(ctx, tLeft, ctaY, 182 * scale, 44 * scale, 22 * scale);
  ctx.fill();
  ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = isDark ? "#1a1a1a" : "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("Register Now →", tLeft + 91 * scale, ctaY + 29 * scale);
  ctx.textAlign = "start";

  // Bottom black strip with hashtags
  ctx.fillStyle = isDark ? "#111" : "#1a1a1a";
  ctx.fillRect(0, h - 50 * scale, w, 50 * scale);
  ctx.font = `bold ${13 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText(post.extraText || "#LearnKorean #Klovers", w / 2, h - 19 * scale);
  ctx.textAlign = "start";
}
