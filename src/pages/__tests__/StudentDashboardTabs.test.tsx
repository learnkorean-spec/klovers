import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";

/**
 * Smoke test for the tabbed student dashboard (13 Nov 2026): the whole page
 * mounts, a brand-new student gets the three-step start instead of the full
 * page, and every tab renders without throwing.
 */

const state = vi.hoisted(() => ({ totalXp: 0, enrolled: false, events: [] as { name: string; params: any }[] }));

vi.mock("@/lib/tracking", () => ({
  track: { custom: (name: string, params: any) => { state.events.push({ name, params }); } },
}));
vi.mock("@/hooks/useSEO", () => ({ useSEO: () => {} }));
vi.mock("@/hooks/useResetGate", () => ({ useResetGate: () => ({ loading: false, resetBlocked: false }) }));
vi.mock("@/components/Header", () => ({ default: () => null }));
vi.mock("@/components/Footer", () => ({ default: () => null }));
vi.mock("@/components/WelcomeModal", () => ({ default: () => null, isOnboardingDone: () => true }));
vi.mock("@/hooks/useGamification", () => {
  const noop = () => {};
  const asyncNoop = async () => {};
  return {
    useGamification: () => ({
      userId: "u1",
      progress: {
        totalXp: state.totalXp, weeklyXp: 0, badges: [], lessonProgress: {},
        streak: { current_streak: 0, longest_streak: 0, last_activity_date: null },
      },
      league: null, loading: false, leaguePromotion: null, newBadges: [], streakCelebration: null,
      awardBadge: asyncNoop, clearLeaguePromotion: noop, clearNewBadges: noop, clearStreakCelebration: noop,
      awardXp: asyncNoop, awardGameXp: asyncNoop, markSectionDone: asyncNoop, fetchProgress: asyncNoop,
    }),
  };
});
vi.mock("@/hooks/useDashboardLearning", () => ({
  useDashboardLearning: () => ({
    data: { todayActivity: [], everClaimedWordOfDay: false, lessons: [], lessonProgress: [], badges: [], milestones: [] },
    loading: false, error: false, retry: () => {}, addTodayActivity: () => {},
  }),
}));
vi.mock("@/integrations/supabase/client", () => {
  const ENROLLMENT = {
    id: "e1", plan_type: "group", duration: 1, sessions_total: 8, sessions_remaining: 6, unit_price: 100,
    amount: 800, currency: "EGP", created_at: "2026-11-01T00:00:00Z", level: "A1", preferred_days: ["sun"], timezone: "Africa/Cairo",
  };
  // A query builder that accepts any chain and resolves to an empty result;
  // only the paid-enrollments read returns a row, and only when `enrolled`.
  const builder = (table: string) => {
    let pendingQuery = false;
    const result = () => ({
      data: table === "enrollments" && state.enrolled && !pendingQuery ? [ENROLLMENT] : [],
      error: null, count: 0,
    });
    const b: any = new Proxy(() => {}, {
      get(_t, prop) {
        if (prop === "then") return (res: (v: unknown) => void) => res(result());
        if (prop === "maybeSingle" || prop === "single") return async () => ({ data: null, error: null });
        if (prop === "or") return () => { pendingQuery = true; return b; };
        return () => b;
      },
    });
    return b;
  };
  return {
    supabase: {
      from: (table: string) => builder(table),
      rpc: () => Promise.resolve({ data: [], error: null }),
      auth: {
        getSession: async () => ({ data: { session: { user: { id: "u1", email: "s@example.com", user_metadata: {} } } }, error: null }),
        getUser: async () => ({ data: { user: { id: "u1", email: "s@example.com", user_metadata: {} } }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      },
      channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() {} }),
      removeChannel: () => {},
      functions: { invoke: async () => ({ data: null, error: null }) },
      storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: "" } }) }) },
    },
  };
});

import StudentDashboard from "../StudentDashboard";

const mount = (path = "/dashboard") =>
  render(<LanguageProvider><MemoryRouter initialEntries={[path]}><StudentDashboard /></MemoryRouter></LanguageProvider>);

beforeEach(() => {
  state.totalXp = 0; state.enrolled = false; state.events = [];
  window.scrollTo = vi.fn() as any;
});
afterEach(() => { cleanup(); localStorage.clear(); sessionStorage.clear(); });

describe("StudentDashboard tabs", () => {
  it("gives a brand-new student three steps, not the full page", async () => {
    mount();
    expect(await screen.findByText("Three steps to begin")).toBeInTheDocument();
    expect(screen.getAllByRole("tab")).toHaveLength(4);
    expect(screen.queryByText("Today's missions")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Explore" })).not.toBeInTheDocument();
    expect(screen.getByText("Is this page clear?")).toBeInTheDocument();
  });

  it("shows the full Today view once the student has started learning", async () => {
    state.totalXp = 40;
    mount();
    expect(await screen.findByRole("heading", { name: "Explore" })).toBeInTheDocument();
    expect(screen.queryByText("Three steps to begin")).not.toBeInTheDocument();
  });

  it("opens every tab without crashing, for an enrolled student", async () => {
    state.enrolled = true; state.totalXp = 40;
    mount();
    await screen.findByRole("heading", { name: "Explore" });
    for (const name of ["Classes", "Progress", "Explore", "Today"]) {
      const tab = screen.getByRole("tab", { name });
      // Radix switches tabs on mousedown, not click.
      fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
      await waitFor(() => expect(tab).toHaveAttribute("aria-selected", "true"));
      expect(screen.getAllByRole("tabpanel")).toHaveLength(1);
    }
    expect(state.events.filter(e => e.name === "dashboard_tab_view").map(e => e.params.tab)).toEqual(["classes", "progress", "explore", "today"]);
  });

  it("opens the tab named in the URL and records the first tap once", async () => {
    state.totalXp = 40;
    mount("/dashboard?tab=explore");
    await waitFor(() => expect(screen.getByRole("tab", { name: "Explore" })).toHaveAttribute("aria-selected", "true"));
    fireEvent.click(screen.getByRole("tab", { name: "Progress" }));
    fireEvent.click(screen.getByRole("tab", { name: "Classes" }));
    const first = state.events.filter(e => e.name === "dashboard_first_click");
    expect(first).toHaveLength(1);
    expect(first[0].params).toMatchObject({ target: "tab_progress", tab: "explore" });
  });
});
