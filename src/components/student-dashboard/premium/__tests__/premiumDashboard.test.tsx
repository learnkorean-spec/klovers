import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ContinueLearningCard } from "../ContinueLearningCard";
import { TodaysMissions } from "../TodaysMissions";
import { LearningJourneyMap } from "../LearningJourneyMap";
import { DashboardHero } from "../DashboardHero";
import { CollectionCard } from "../CollectionCard";
import { EggStatusCard } from "../EggStatusCard";
import { journeyStops, missionsFromActivity, xpStatus, type ContinueLesson } from "@/lib/dashboardProgress";

vi.mock("@/lib/tracking", () => ({ track: { custom: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

afterEach(() => { cleanup(); localStorage.clear(); });

const wrap = (ui: React.ReactNode) => render(<LanguageProvider><MemoryRouter>{ui}</MemoryRouter></LanguageProvider>);

const next: ContinueLesson = {
  lesson: { id: 12, book: "korean-1", sort_order: 12, title_en: "Greetings & Introductions", title_ar: "التحيات والتعارف", title_ko: "인사와 소개", topik_level: 1 },
  stepsDone: 4, stepCount: 6, pct: 67, reason: "in_progress", href: "/textbook/korean-1/12",
};

describe("ContinueLearningCard", () => {
  it("shows the real lesson, its progress and ONE continue link", () => {
    wrap(<ContinueLearningCard next={next} loading={false} error={false} onRetry={() => {}} />);
    expect(screen.getByText("Greetings & Introductions")).toBeInTheDocument();
    expect(screen.getByText("4 of 6 steps · 67%")).toBeInTheDocument();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute("href", "/textbook/korean-1/12");
    expect(screen.queryByText(/min\b/)).not.toBeInTheDocument(); // no invented time estimate
  });
  it("offers a retry on error", () => {
    const retry = vi.fn();
    wrap(<ContinueLearningCard next={null} loading={false} error onRetry={retry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalled();
  });
  it("renders in Arabic", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    wrap(<ContinueLearningCard next={next} loading={false} error={false} onRetry={() => {}} />);
    expect(screen.getByText("التحيات والتعارف")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /تابع/ })).toBeInTheDocument();
  });
});

describe("TodaysMissions", () => {
  it("counts done missions and marks them with icon + text, not colour alone", () => {
    wrap(<TodaysMissions missions={missionsFromActivity(["game_match", "grammar"])} loading={false} continueHref="/x" claimLabel="Claim +25 XP" claiming={false} onClaimWord={() => {}} />);
    expect(screen.getByText("2/3 done")).toBeInTheDocument();
    expect(screen.getAllByText("Done")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Claim +25 XP" })).toBeInTheDocument();
  });
  it("never promises a reward other than XP", () => {
    const { container } = wrap(<TodaysMissions missions={missionsFromActivity([])} loading={false} continueHref="/x" claimLabel="Claim" claiming={false} onClaimWord={() => {}} />);
    expect(container.textContent).not.toMatch(/free class|voucher|discount|gift/i);
  });
});

describe("LearningJourneyMap", () => {
  it("marks the current stop for assistive tech", () => {
    const j = journeyStops("l1");
    const { container } = wrap(<LearningJourneyMap stops={j.stops} currentIndex={j.currentIndex} continueHref="/c" />);
    const current = container.querySelector('[aria-current="step"]');
    expect(current?.textContent).toMatch(/Level 1/);
    expect(current?.textContent).toMatch(/you are here/);
    expect(screen.getByText("1 of 7 levels complete")).toBeInTheDocument();
  });
  it("asks for the placement test when the level is unknown", () => {
    const j = journeyStops(null);
    wrap(<LearningJourneyMap stops={j.stops} currentIndex={j.currentIndex} continueHref="/c" />);
    expect(screen.getByRole("link", { name: "Find my level" })).toHaveAttribute("href", "/placement-test");
  });
});

describe("DashboardHero", () => {
  it("shows level, XP to next level, streak and exactly one action", () => {
    wrap(<DashboardHero firstName="Roma" todayLabel="Thursday" xp={xpStatus(185)} streak={2} streakState="active_today" continueHref="/textbook/korean-1/12" continueBook="korean-1" continueLesson={12} hasStarted clubyAwake />);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Roma");
    expect(screen.getByText("185 / 200")).toBeInTheDocument();
    expect(screen.getByText("15 XP to Hangul League")).toBeInTheDocument();
    expect(screen.getByText("2-day streak")).toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "93");
  });
});

describe("CollectionCard", () => {
  it("counts real badges and shows the closest real milestone", () => {
    wrap(<CollectionCard
      earned={[{ badge_key: "game_starter", earned_at: "2026-01-01" }]}
      milestones={[{ milestone_type: "lessons_completed", milestone_tier: 1, milestone_name: "5 Lessons Completed", target_value: 5, progress_value: 2, is_achieved: false }]}
    />);
    expect(screen.getByText("1 / 20 badges")).toBeInTheDocument();
    expect(screen.getByText("Complete 5 lessons")).toBeInTheDocument();
    expect(screen.getByText("3 more to unlock")).toBeInTheDocument();
  });
});

describe("Story: Cluby's egg and the worlds", () => {
  it("hides Cluby in the hero until he has hatched", () => {
    wrap(<DashboardHero firstName="Roma" todayLabel="Thursday" xp={xpStatus(185)} streak={0} streakState="none" continueHref="/x" continueBook={null} continueLesson={null} hasStarted={false} clubyAwake={false} />);
    expect(screen.queryByAltText(/Cluby/)).not.toBeInTheDocument();
  });
  it("shows the egg stage with its three real milestones", () => {
    wrap(<EggStatusCard egg={{ stage: 1, hatchedAt: null }} />);
    expect(screen.getByRole("heading", { name: "The egg cracked!" })).toBeInTheDocument();
    expect(screen.getByText("First word")).toBeInTheDocument();
    expect(screen.getByText("First conversation")).toBeInTheDocument();
  });
  it("introduces a hatched Cluby once, then steps aside", () => {
    wrap(<EggStatusCard egg={{ stage: 3, hatchedAt: "2020-01-01T00:00:00Z" }} />);
    expect(screen.getByRole("heading", { name: "You've already learned enough to wake him" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("heading", { name: /wake him/ })).not.toBeInTheDocument();
    expect(localStorage.getItem("kl_cluby_hatch_seen")).toBe("1");
  });
  it("names the journey stops after the story worlds, with the level underneath", () => {
    const j = journeyStops("level_1");
    wrap(<LearningJourneyMap stops={j.stops} currentIndex={j.currentIndex} continueHref="/x" />);
    expect(screen.getByText("You're in Vocabulary Market")).toBeInTheDocument();
    expect(screen.getAllByText("Conversation Café").length).toBeGreaterThan(0);
    expect(screen.queryByText(/Memory Garden/)).not.toBeInTheDocument();
  });
});
