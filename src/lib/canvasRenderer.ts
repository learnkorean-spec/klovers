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

function renderKloversBold(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, isPortrait: boolean) {
  const PAD = 28 * scale;
  const BORDER = 11 * scale;

  // Yellow background
  ctx.fillStyle = "#FFFF00";
  ctx.fillRect(0, 0, w, h);

  // Thick black border frame
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = BORDER;
  ctx.strokeRect(PAD + BORDER / 2, PAD + BORDER / 2, w - PAD * 2 - BORDER, h - PAD * 2 - BORDER);

  // "한" faint watermark
  ctx.save();
  ctx.font = `900 ${280 * scale}px serif`;
  ctx.fillStyle = "rgba(0,0,0,0.06)";
  ctx.textAlign = "center";
  ctx.fillText("한", w / 2, h * 0.62);
  ctx.restore();

  // K circle badge — top right
  const badgeR = 38 * scale;
  const bx = w - PAD - BORDER - badgeR - 6 * scale;
  const by = PAD + BORDER + badgeR + 6 * scale;
  ctx.fillStyle = "#111111";
  ctx.beginPath(); ctx.arc(bx, by, badgeR, 0, Math.PI * 2); ctx.fill();
  ctx.font = `900 ${26 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("K", bx, by);
  ctx.textBaseline = "alphabetic";

  // Eyebrow label
  const inner = PAD + BORDER + 16 * scale;
  ctx.fillStyle = "#111111";
  ctx.textAlign = "left";
  ctx.font = `700 ${13 * scale}px 'Inter', sans-serif`;
  ctx.fillText("KLOVERS KOREAN ACADEMY", inner, inner + 32 * scale);
  ctx.fillRect(inner, inner + 38 * scale, 54 * scale, 3 * scale);

  // Headline
  const hlY = h * (isPortrait ? 0.34 : 0.28);
  const hlSize = Math.min(96 * scale, (w - inner * 2) / Math.max(...post.mainText.split(" ").map(s => s.length)) * 1.5);
  ctx.font = `900 ${hlSize}px 'Inter', 'Segoe UI', sans-serif`;
  ctx.fillStyle = "#111111";
  wrapText(ctx, post.mainText, inner, hlY, w - inner * 2, hlSize * 1.08, 3);

  // Subtitle
  if (post.subtitle) {
    const stY = hlY + hlSize * 1.08 * Math.min(post.mainText.split(" ").length, 3) + 18 * scale;
    ctx.font = `500 ${16 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "#333333";
    wrapText(ctx, post.subtitle, inner, stY, w - inner * 2, 22 * scale, 3);
  }

  // CTA pill
  const ctaW = 200 * scale;
  const ctaH = 48 * scale;
  const ctaX = inner;
  const ctaY2 = h - PAD - BORDER - 72 * scale;
  ctx.fillStyle = "#111111";
  rRect(ctx, ctaX, ctaY2, ctaW, ctaH, ctaH / 2);
  ctx.fill();
  ctx.font = `bold ${15 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("Register Now →", ctaX + ctaW / 2, ctaY2 + ctaH * 0.64);
  ctx.textAlign = "left";

  // Bottom black strip
  const stripH = 36 * scale;
  ctx.fillStyle = "#111111";
  ctx.fillRect(PAD + BORDER, h - PAD - BORDER - stripH, w - (PAD + BORDER) * 2, stripH);
  ctx.font = `600 ${11 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFFF00";
  ctx.textAlign = "center";
  ctx.fillText("kloversegy.com  •  한국어 배우기", w / 2, h - PAD - BORDER - stripH + stripH * 0.68);
  ctx.textAlign = "left";
}

function renderKloversVarsity(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, _isPortrait: boolean) {
  // Dark bg
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, w, h);

  // Radial glow behind ring
  const cx = w / 2, cy = h * 0.42;
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.52);
  grd.addColorStop(0, "rgba(255,220,0,0.18)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);

  // Championship ring
  const ringR = Math.min(w, h) * 0.28;
  ctx.strokeStyle = "#FFD700";
  ctx.lineWidth = 7 * scale;
  ctx.shadowColor = "#FFD700";
  ctx.shadowBlur = 28 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, ringR, 0, Math.PI * 2); ctx.stroke();

  // Inner ring
  ctx.lineWidth = 2 * scale;
  ctx.shadowBlur = 8 * scale;
  ctx.beginPath(); ctx.arc(cx, cy, ringR * 0.84, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;

  // 8 dot markers on ring
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const dx = cx + Math.cos(angle) * ringR;
    const dy = cy + Math.sin(angle) * ringR;
    ctx.fillStyle = "#FFD700";
    ctx.beginPath(); ctx.arc(dx, dy, 5 * scale, 0, Math.PI * 2); ctx.fill();
  }

  // Big "K" inside ring
  ctx.font = `900 ${ringR * 1.1}px 'Inter', sans-serif`;
  ctx.fillStyle = "#FFD700";
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.shadowColor = "#FFD700"; ctx.shadowBlur = 18 * scale;
  ctx.fillText("K", cx, cy);
  ctx.shadowBlur = 0; ctx.textBaseline = "alphabetic";

  // White headline below ring
  const textTop = cy + ringR + 36 * scale;
  const hlSize = Math.min(62 * scale, w * 0.08);
  ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  wrapText(ctx, post.mainText, w * 0.1, textTop, w * 0.8, hlSize * 1.1, 2);

  // Yellow subtitle lines
  if (post.subtitle) {
    ctx.font = `500 ${15 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFD700";
    wrapText(ctx, post.subtitle, w * 0.1, textTop + hlSize * 2.4, w * 0.8, 22 * scale, 2);
  }

  // Bottom strip
  const stripH = 38 * scale;
  ctx.fillStyle = "#FFD700";
  ctx.fillRect(0, h - stripH, w, stripH);
  ctx.font = `700 ${12 * scale}px 'Inter', sans-serif`;
  ctx.fillStyle = "#0d0d0d";
  ctx.textAlign = "center";
  ctx.fillText("KLOVERS KOREAN ACADEMY  •  kloversegy.com", w / 2, h - stripH + stripH * 0.68);
  ctx.textAlign = "left";
}

function renderKloversSplit(ctx: CanvasRenderingContext2D, post: PostData, w: number, h: number, scale: number, isPortrait: boolean) {
  if (isPortrait) {
    // Portrait: yellow top / black bottom with diagonal cut
    const splitY = h * 0.48;
    const slant = w * 0.12;

    // Yellow top zone
    ctx.fillStyle = "#FFFF00";
    ctx.fillRect(0, 0, w, splitY + slant);

    // Black bottom zone
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.moveTo(0, splitY); ctx.lineTo(w, splitY + slant);
    ctx.lineTo(w, h); ctx.lineTo(0, h);
    ctx.closePath(); ctx.fill();

    // Thin yellow diagonal accent
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(0, splitY + 12 * scale); ctx.lineTo(w, splitY + slant + 12 * scale);
    ctx.stroke();

    // K badge top-left
    const badgeR = 34 * scale;
    ctx.fillStyle = "#111111";
    ctx.beginPath(); ctx.arc(40 * scale, 44 * scale, badgeR, 0, Math.PI * 2); ctx.fill();
    ctx.font = `900 ${22 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "#FFFF00";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", 40 * scale, 44 * scale);
    ctx.textBaseline = "alphabetic";

    // Headline in yellow zone (dark text)
    const hlSize = Math.min(82 * scale, w * 0.12);
    ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "left";
    wrapText(ctx, post.mainText, 36 * scale, h * 0.18, w - 72 * scale, hlSize * 1.08, 2);

    // Subtitle in black zone (white text)
    if (post.subtitle) {
      ctx.font = `500 ${16 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#ffffff";
      wrapText(ctx, post.subtitle, 36 * scale, splitY + slant + 36 * scale, w - 72 * scale, 23 * scale, 3);
    }

    // CTA in black zone
    const ctaW = 190 * scale, ctaH = 46 * scale;
    const ctaY = h - 72 * scale;
    ctx.fillStyle = "#FFFF00";
    rRect(ctx, 36 * scale, ctaY, ctaW, ctaH, ctaH / 2);
    ctx.fill();
    ctx.font = `bold ${14 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center";
    ctx.fillText("Register Now →", 36 * scale + ctaW / 2, ctaY + ctaH * 0.64);
    ctx.textAlign = "left";

    // "KLOVERS" bottom right
    ctx.font = `900 ${11 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(255,255,0,0.4)";
    ctx.textAlign = "right";
    ctx.fillText("KLOVERS", w - 30 * scale, h - 18 * scale);
    ctx.textAlign = "left";

  } else {
    // Landscape/square: yellow left / black right with diagonal
    const splitX = w * 0.5;
    const slant = h * 0.12;

    // Yellow left
    ctx.fillStyle = "#FFFF00";
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(splitX + slant, 0);
    ctx.lineTo(splitX, h); ctx.lineTo(0, h);
    ctx.closePath(); ctx.fill();

    // Black right
    ctx.fillStyle = "#111111";
    ctx.beginPath();
    ctx.moveTo(splitX + slant, 0); ctx.lineTo(w, 0);
    ctx.lineTo(w, h); ctx.lineTo(splitX, h);
    ctx.closePath(); ctx.fill();

    // Yellow diagonal accent
    ctx.strokeStyle = "#FFFF00";
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(splitX + slant + 10 * scale, 0); ctx.lineTo(splitX + 10 * scale, h);
    ctx.stroke();

    // K logo on yellow
    ctx.font = `900 ${90 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "#111111";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("K", splitX * 0.5, h / 2);
    ctx.textBaseline = "alphabetic";

    // Headline on black
    const hlSize = Math.min(52 * scale, h * 0.1);
    const textLeft = splitX + slant + 24 * scale;
    const textW = w - textLeft - 20 * scale;
    ctx.font = `900 ${hlSize}px 'Inter', sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "left";
    wrapText(ctx, post.mainText, textLeft, h * 0.28, textW, hlSize * 1.1, 3);

    if (post.subtitle) {
      ctx.font = `500 ${14 * scale}px 'Inter', sans-serif`;
      ctx.fillStyle = "#FFD700";
      wrapText(ctx, post.subtitle, textLeft, h * 0.62, textW, 20 * scale, 2);
    }

    // "KLOVERS" label on yellow, vertical
    ctx.save();
    ctx.translate(splitX * 0.82, h * 0.72);
    ctx.rotate(-Math.PI / 2);
    ctx.font = `900 ${11 * scale}px 'Inter', sans-serif`;
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.textAlign = "center";
    ctx.fillText("KLOVERS", 0, 0);
    ctx.restore();
  }
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
