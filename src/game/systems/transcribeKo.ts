/**
 * Korean speech-to-text through Amazon Transcribe streaming, for phones whose
 * browser has no speech recognition (most iPhones). The edge function
 * `transcribe-url` gives a 5-minute pre-signed WebSocket URL; the microphone
 * is streamed to Amazon as 16 kHz PCM for a few seconds, and the final Korean
 * text comes back. Paid from Klovers' AWS credits; signed-in learners only.
 *
 * Amazon's WebSocket speaks the AWS "event stream" framing, encoded and
 * decoded by hand below (no SDK: it is small, and keeps the bundle light).
 */

/**
 * Off until Amazon Transcribe is enabled on the AWS account: on 16 Nov 2026 the
 * live test reached Amazon but got "SubscriptionRequiredException — the AWS
 * Access Key Id needs a subscription for the service" (Free-plan account;
 * Polly works, Transcribe doesn't). While off, iPhones simply don't show
 * "Say it", exactly as before. Flip to true once a test returns Korean text.
 */
export const TRANSCRIBE_ON = false;

export const canStream = (): boolean =>
  TRANSCRIBE_ON &&
  typeof window !== "undefined" &&
  typeof WebSocket !== "undefined" &&
  !!navigator.mediaDevices?.getUserMedia &&
  !!(window.AudioContext || (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext);

// ---- CRC32 (the event stream's checksums) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** One AudioEvent frame: three string headers + the PCM bytes. */
export function encodeAudioEvent(pcm: Uint8Array): Uint8Array {
  const headers: [string, string][] = [
    [":content-type", "application/octet-stream"],
    [":event-type", "AudioEvent"],
    [":message-type", "event"],
  ];
  const parts: number[] = [];
  for (const [name, value] of headers) {
    const n = enc.encode(name);
    const v = enc.encode(value);
    parts.push(n.length, ...n, 7, (v.length >> 8) & 0xff, v.length & 0xff, ...v);
  }
  const h = Uint8Array.from(parts);
  const total = 12 + h.length + pcm.length + 4;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, total);
  dv.setUint32(4, h.length);
  dv.setUint32(8, crc32(out.subarray(0, 8)));
  out.set(h, 12);
  out.set(pcm, 12 + h.length);
  dv.setUint32(total - 4, crc32(out.subarray(0, total - 4)));
  return out;
}

/** Reads one event-stream frame: its string headers and payload. */
export function decodeFrame(buf: Uint8Array): { headers: Record<string, string>; payload: Uint8Array } {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const total = dv.getUint32(0);
  const hLen = dv.getUint32(4);
  const headers: Record<string, string> = {};
  let p = 12;
  while (p < 12 + hLen) {
    const nLen = buf[p];
    const name = dec.decode(buf.subarray(p + 1, p + 1 + nLen));
    p += 1 + nLen;
    const type = buf[p];
    p += 1;
    if (type !== 7) break; // only string headers are expected here
    const vLen = (buf[p] << 8) | buf[p + 1];
    headers[name] = dec.decode(buf.subarray(p + 2, p + 2 + vLen));
    p += 2 + vLen;
  }
  return { headers, payload: buf.subarray(12 + hLen, total - 4) };
}

/** Float samples at `from` Hz → 16-bit little-endian PCM at `to` Hz. */
export function toPcm16(input: Float32Array, from: number, to: number): Uint8Array {
  const ratio = from / to;
  const n = Math.floor(input.length / ratio);
  const out = new DataView(new ArrayBuffer(n * 2));
  for (let i = 0; i < n; i++) {
    const a = Math.floor(i * ratio);
    const b = Math.min(input.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = a; j < b; j++) sum += input[j];
    const s = Math.max(-1, Math.min(1, b > a ? sum / (b - a) : input[a] ?? 0));
    out.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Uint8Array(out.buffer);
}

export type StreamResult = { heard: string } | { error: "blocked" | "nothing" };

/** Listens up to `maxMs` and returns what Amazon heard (Korean). */
export function listenViaTranscribe(maxMs = 5000): { done: Promise<StreamResult>; stop: () => void } {
  let stopRequested = false;
  let stopNow: () => void = () => {
    stopRequested = true;
  };

  const done = (async (): Promise<StreamResult> => {
    // Ask for the microphone first, inside the tap that started this.
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    } catch {
      return { error: "blocked" };
    }
    const tracksOff = () => stream.getTracks().forEach((t) => t.stop());

    // Loaded only when someone taps "Say it", not with the game.
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase.functions.invoke("transcribe-url");
    if (error || !data?.url) {
      tracksOff();
      return { error: "nothing" };
    }
    const rate: number = data.sampleRate || 16000;

    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    await ctx.resume().catch(() => {});
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);

    const ws = new WebSocket(data.url);
    ws.binaryType = "arraybuffer";
    const finals: string[] = [];
    let partial = "";

    return await new Promise<StreamResult>((resolve) => {
      let settled = false;
      let ended = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        try { proc.disconnect(); src.disconnect(); } catch { /* already */ }
        tracksOff();
        ctx.close().catch(() => {});
        try { ws.close(); } catch { /* already */ }
        const heard = (finals.join(" ") || partial).trim();
        resolve(heard ? { heard } : { error: "nothing" });
      };
      const endAudio = () => {
        if (ended) return;
        ended = true;
        try { proc.disconnect(); } catch { /* already */ }
        tracksOff();
        // An empty AudioEvent tells Amazon the speech is over; the last
        // result follows, then the socket closes.
        if (ws.readyState === WebSocket.OPEN) ws.send(encodeAudioEvent(new Uint8Array(0)));
        setTimeout(finish, 2500);
      };
      stopNow = endAudio;
      if (stopRequested) endAudio();

      proc.onaudioprocess = (e) => {
        if (ended || ws.readyState !== WebSocket.OPEN) return;
        ws.send(encodeAudioEvent(toPcm16(e.inputBuffer.getChannelData(0), ctx.sampleRate, rate)));
      };
      ws.onopen = () => {
        src.connect(proc);
        proc.connect(ctx.destination);
        setTimeout(endAudio, maxMs);
      };
      ws.onmessage = (m) => {
        const { headers, payload } = decodeFrame(new Uint8Array(m.data as ArrayBuffer));
        if (headers[":message-type"] !== "event") return finish();
        if (headers[":event-type"] !== "TranscriptEvent") return;
        try {
          const body = JSON.parse(dec.decode(payload));
          for (const r of body?.Transcript?.Results ?? []) {
            const t = r?.Alternatives?.[0]?.Transcript ?? "";
            if (r.IsPartial) partial = t;
            else if (t) finals.push(t);
          }
        } catch { /* ignore a frame we can't read */ }
      };
      ws.onerror = () => finish();
      ws.onclose = () => finish();
    });
  })();

  return { done, stop: () => stopNow() };
}
