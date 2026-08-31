import { describe, it, expect, vi, beforeEach } from "vitest";

// Acceptance condition for G0c, not a nicety.
//
// `logLeadEvent` mirrors every call to the Meta Pixel as a `Lead` conversion
// and to GA4 as `generate_lead`. Both are live and feed ad optimisation that
// real money is spent against. Game events fire orders of magnitude more
// often than a trial signup, so routing them through the mirroring path would
// inject hundreds of fake conversions and corrupt that data silently.
//
// These tests fail the moment a pixel call reappears on a game event.

const insert = vi.fn((_row: Record<string, unknown>) =>
  Promise.resolve({ data: null, error: null }),
);

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn(() => ({ insert })) },
}));

vi.mock("@/lib/leadSession", () => ({
  getSessionId: () => "11111111-1111-4111-8111-111111111111",
  getAttribution: () => ({}),
}));

import { logGameEvent, logLeadEvent } from "@/lib/leadTracking";

describe("logGameEvent never fires a pixel", () => {
  beforeEach(() => {
    insert.mockClear();
    // The real pixels attach these to window. If either is called, the spy
    // records it — that is exactly the regression this file exists to catch.
    (window as unknown as { fbq: unknown }).fbq = vi.fn();
    (window as unknown as { gtag: unknown }).gtag = vi.fn();
  });

  const fbq = () => (window as unknown as { fbq: ReturnType<typeof vi.fn> }).fbq;
  const gtag = () => (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag;

  it.each([
    ["games_page_view", undefined],
    ["game_opened", "match"],
    ["game_started", "hangul"],
    ["game_completed", "flashcard"],
  ] as const)("%s calls neither fbq nor gtag", async (source_type, cta_label) => {
    await logGameEvent({ source_type, cta_label });

    expect(fbq()).not.toHaveBeenCalled();
    expect(gtag()).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledTimes(1);
  });

  it("writes the row shape G0c specifies, with no user_id", async () => {
    await logGameEvent({
      source_type: "game_completed",
      cta_label: "match",
      metadata: { score: 6, totalRounds: 6 },
    });

    const row = insert.mock.calls[0][0] as Record<string, unknown>;
    expect(row.source_type).toBe("game_completed");
    expect(row.cta_label).toBe("match");
    expect(row.metadata).toEqual({ score: 6, totalRounds: 6 });
    expect(row.session_id).toBe("11111111-1111-4111-8111-111111111111");
    // A logged-out visitor is the population G0c exists to measure; the
    // column defaults to null and attachLeadToUser backfills it on signup.
    expect(row).not.toHaveProperty("user_id");
  });

  it("still inserts when the score is zero — an abandon is the signal", async () => {
    await logGameEvent({
      source_type: "game_completed",
      cta_label: "scramble",
      metadata: { score: 0, totalRounds: 10 },
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(fbq()).not.toHaveBeenCalled();
  });

  it("never throws, even when the insert rejects", async () => {
    insert.mockRejectedValueOnce(new Error("network down"));
    await expect(
      logGameEvent({ source_type: "game_opened", cta_label: "time" }),
    ).resolves.toBeUndefined();
  });

  // The control: the lead path is SUPPOSED to mirror. If this ever stops
  // passing, the shared row builder has been wired up wrongly and real
  // conversion tracking is broken — the opposite failure, equally silent.
  it("logLeadEvent DOES still mirror to the pixel", async () => {
    await logLeadEvent({ source_type: "whatsapp", cta_label: "floating_fab" });

    expect(fbq()).toHaveBeenCalledWith("track", "Lead", { content_name: "whatsapp" });
    expect(gtag()).toHaveBeenCalledWith("event", "generate_lead");
    expect(insert).toHaveBeenCalledTimes(1);
  });
});
