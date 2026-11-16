import { describe, expect, it, vi } from "vitest";
import { isSpeaking, speak, speakFor } from "../reactions";

/** A person's mouth and hands move for as long as their line is heard. */
describe("speaking time", () => {
  it("follows the recording's real length once it is known", () => {
    const now = vi.spyOn(performance, "now");
    now.mockReturnValue(1000);
    speak("m-jihoon", 10); // the estimate: 500 + 10 × 190 ms
    expect(isSpeaking("m-jihoon", 3300)).toBe(true);
    speakFor("m-jihoon", 1.2); // the file says 1.2 s
    expect(isSpeaking("m-jihoon", 2100)).toBe(true);
    expect(isSpeaking("m-jihoon", 2300)).toBe(false);
    now.mockRestore();
  });
});
