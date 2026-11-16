import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

import { decodeFrame, encodeAudioEvent, toPcm16 } from "../transcribeKo";

describe("transcribeKo event stream", () => {
  it("encodes an AudioEvent that decodes back to the same headers and bytes", () => {
    const pcm = Uint8Array.from([1, 2, 3, 4, 250, 251]);
    const frame = encodeAudioEvent(pcm);
    const dv = new DataView(frame.buffer);
    expect(dv.getUint32(0)).toBe(frame.length);
    const { headers, payload } = decodeFrame(frame);
    expect(headers).toEqual({
      ":content-type": "application/octet-stream",
      ":event-type": "AudioEvent",
      ":message-type": "event",
    });
    expect([...payload]).toEqual([...pcm]);
  });

  it("an empty AudioEvent (end of speech) is a valid frame", () => {
    const frame = encodeAudioEvent(new Uint8Array(0));
    expect(decodeFrame(frame).payload.length).toBe(0);
  });

  it("resamples 48 kHz floats to 16 kHz little-endian 16-bit PCM", () => {
    const input = new Float32Array(48).fill(0.5);
    const pcm = toPcm16(input, 48000, 16000);
    expect(pcm.length).toBe(16 * 2);
    expect(new DataView(pcm.buffer).getInt16(0, true)).toBe(Math.floor(0.5 * 0x7fff));
  });
});
