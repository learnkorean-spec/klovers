import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const rpc = vi.fn();
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...a: unknown[]) => rpc(...a), functions: { invoke: vi.fn() } },
}));

import FacebookPostsPanel from "../FacebookPostsPanel";

const wrap = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <FacebookPostsPanel />
    </QueryClientProvider>,
  );

const row = (over: Record<string, unknown> = {}) => ({
  post_id: "1_1",
  posted_at: "2026-11-20T10:00:00Z",
  message: "احجز حصتك المجانية https://kloversegy.com/free-trial?utm_content=post1",
  permalink_url: "https://facebook.com/1_1",
  utm_content: "post1",
  reach: 812,
  media_views: 1204,
  reactions: 30,
  comments: 4,
  shares: 2,
  insights_error: null,
  fetched_at: "2026-11-20T18:00:00Z",
  sessions: 9,
  bookings: 2,
  ...over,
});

describe("FacebookPostsPanel", () => {
  beforeEach(() => rpc.mockReset());

  it("shows reach, visits and bookings for a post", async () => {
    rpc.mockResolvedValue({ data: [row()], error: null });
    wrap();
    await waitFor(() => expect(screen.getByText("812")).toBeInTheDocument());
    expect(screen.getByText("1,204")).toBeInTheDocument();
    expect(screen.getByText("post1")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "td.font-semibold" })).toBeInTheDocument();
  });

  it("says what to fix when Facebook refuses insights", async () => {
    rpc.mockResolvedValue({
      data: [row({ reach: null, media_views: null, insights_error: "200: Requires read_insights permission" })],
      error: null,
    });
    wrap();
    await waitFor(() => expect(screen.getByText(/read_insights permission on the Page token/)).toBeInTheDocument());
  });

  it("explains itself instead of crashing when the migration is not applied", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "function public.fb_post_performance() does not exist" } });
    wrap();
    await waitFor(() => expect(screen.getByText(/Reach tracking is not set up yet/)).toBeInTheDocument());
  });
});
