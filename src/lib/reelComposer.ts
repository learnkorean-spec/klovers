// Marketing Reel Composer
// Composes a branded vertical reel by overlaying text slides on a stock video.
//
// Pipeline:
//   1. Load stock MP4 into a hidden <video> element
//   2. Draw frames onto an OffscreenCanvas at target 1080x1920
//   3. Overlay text slides via renderPost() from canvasRenderer (burned-in, 3 phases)
//   4. Capture the canvas stream through MediaRecorder → webm Blob
//
// Output: webm blob suitable for Instagram/TikTok/Facebook upload.

import { renderPost, type PostData, type TemplateName, type ColorTheme } from "./canvasRenderer";

export interface ReelSlideContent {
  mainText: string;
  subtitle: string;
  extraText: string;
}

export interface ComposeReelOptions {
  videoUrl: string;
  slides: [ReelSlideContent, ReelSlideContent, ReelSlideContent];
  template: TemplateName;
  theme: ColorTheme;
  useWhatsApp?: boolean;
  /** Total reel duration in seconds (default 9). Split evenly across 3 slides. */
  totalDuration?: number;
  /** Target width in px (default 1080). Height is always 16:9 portrait = 1920. */
  width?: number;
  height?: number;
  /** Progress callback 0..1 */
  onProgress?: (pct: number) => void;
}

/**
 * Compose a branded reel from a stock video + 3 branded text slides.
 * Returns a webm Blob (VP9 if available, VP8 fallback).
 * Throws if the browser lacks MediaRecorder/CaptureStream support.
 */
export async function composeReel(opts: ComposeReelOptions): Promise<Blob> {
  const {
    videoUrl,
    slides,
    template,
    theme,
    useWhatsApp = false,
    totalDuration = 9,
    width = 1080,
    height = 1920,
    onProgress,
  } = opts;

  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder not supported in this browser");
  }

  // 1. Prepare hidden <video> element
  const videoEl = document.createElement("video");
  videoEl.crossOrigin = "anonymous";
  videoEl.muted = true;
  videoEl.playsInline = true;
  videoEl.loop = true;
  videoEl.src = videoUrl;

  await new Promise<void>((resolve, reject) => {
    videoEl.onloadeddata = () => resolve();
    videoEl.onerror = () => reject(new Error("Failed to load stock video"));
    // Safety timeout
    setTimeout(() => reject(new Error("Video load timeout")), 30000);
  });

  // 2. Prepare canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  // Throwaway overlay canvas for rendering the branded text slide
  const overlayCanvas = document.createElement("canvas");
  overlayCanvas.width = width;
  overlayCanvas.height = height;

  // Pre-render each slide once to an ImageBitmap/Canvas for fast per-frame compositing
  const slideCanvases: HTMLCanvasElement[] = slides.map((slide, idx) => {
    const c = document.createElement("canvas");
    c.width = width;
    c.height = height;
    const post: PostData = {
      id: `reel-slide-${idx}`,
      mainText: slide.mainText,
      subtitle: slide.subtitle,
      extraText: slide.extraText,
    };
    // "story" format = 1080x1920 vertical, matches our reel dims
    renderPost(c, post, template, theme, "story", null, undefined, useWhatsApp);
    return c;
  });

  // 3. MediaRecorder setup
  const fps = 30;
  // Prefer VP9, fall back to VP8
  const mimeCandidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  const mimeType =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";

  const stream = (canvas as HTMLCanvasElement & {
    captureStream: (fps: number) => MediaStream;
  }).captureStream(fps);
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const recordingDone = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = (ev) => reject(new Error(`MediaRecorder error: ${ev}`));
  });

  // 4. Start video playback + recording, run the frame loop
  videoEl.currentTime = 0;
  await videoEl.play().catch(() => {
    // Some browsers only allow play after user gesture — the calling UI
    // should invoke composeReel from inside a click handler.
    throw new Error("Video playback blocked — trigger composeReel from a user gesture");
  });

  recorder.start(100);

  const slideDurationMs = (totalDuration * 1000) / 3;
  const startTs = performance.now();
  const endTs = startTs + totalDuration * 1000;

  // Cover-fit the video into the 1080x1920 canvas
  function drawVideoFrame() {
    const vw = videoEl.videoWidth || 1;
    const vh = videoEl.videoHeight || 1;
    const canvasRatio = width / height;
    const videoRatio = vw / vh;
    let dw: number;
    let dh: number;
    let dx: number;
    let dy: number;
    if (videoRatio > canvasRatio) {
      // video wider → crop sides
      dh = height;
      dw = height * videoRatio;
      dx = (width - dw) / 2;
      dy = 0;
    } else {
      // video taller → crop top/bottom
      dw = width;
      dh = width / videoRatio;
      dx = 0;
      dy = (height - dh) / 2;
    }
    ctx!.drawImage(videoEl, dx, dy, dw, dh);
  }

  function drawOverlay(elapsed: number) {
    const slideIdx = Math.min(2, Math.floor(elapsed / slideDurationMs));
    const slideEl = slideCanvases[slideIdx];

    // Crossfade last 400ms between slides
    const withinSlide = elapsed - slideIdx * slideDurationMs;
    const fadeMs = 400;
    let alpha = 1;
    if (slideIdx < 2 && withinSlide > slideDurationMs - fadeMs) {
      alpha = (slideDurationMs - withinSlide) / fadeMs;
    }

    // Subtle dark gradient to ensure text readability over any video
    const grad = ctx!.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, "rgba(0,0,0,0.15)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.0)");
    grad.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx!.fillStyle = grad;
    ctx!.fillRect(0, 0, width, height);

    ctx!.globalAlpha = alpha;
    ctx!.drawImage(slideEl, 0, 0, width, height);
    ctx!.globalAlpha = 1;

    if (slideIdx < 2 && alpha < 1) {
      const nextEl = slideCanvases[slideIdx + 1];
      ctx!.globalAlpha = 1 - alpha;
      ctx!.drawImage(nextEl, 0, 0, width, height);
      ctx!.globalAlpha = 1;
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    let frameHandle = 0;

    function frame() {
      const now = performance.now();
      if (now >= endTs) {
        cancelAnimationFrame(frameHandle);
        videoEl.pause();
        recorder.stop();
        recordingDone.then(resolve).catch(reject);
        return;
      }
      const elapsed = now - startTs;
      drawVideoFrame();
      drawOverlay(elapsed);
      if (onProgress) onProgress(Math.min(1, elapsed / (totalDuration * 1000)));
      frameHandle = requestAnimationFrame(frame);
    }

    frameHandle = requestAnimationFrame(frame);
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
