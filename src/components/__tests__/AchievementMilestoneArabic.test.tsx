import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AchievementMilestoneCard } from "../AchievementMilestoneCard";
import { LanguageProvider } from "@/contexts/LanguageContext";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const tier = (id: number, type: string, t: number, name: string, target: number) => ({
  id, user_id: "u", milestone_type: type, milestone_tier: t, milestone_name: name,
  target_value: target, progress_value: 1, is_achieved: false,
});

vi.mock("@/hooks/useMilestones", () => ({
  useMilestones: () => ({
    groupedMilestones: [
      { type: "lessons_completed", tiers: [tier(1, "lessons_completed", 1, "5 Lessons Completed", 5)] },
      { type: "xp_earned", tiers: [tier(2, "xp_earned", 2, "2000 XP Earned", 2000)] },
    ],
    completionPercentage: 0,
    newlyAchieved: null,
  }),
}));

afterEach(() => localStorage.clear());
const draw = () => render(<LanguageProvider><AchievementMilestoneCard /></LanguageProvider>);

describe("AchievementMilestoneCard milestone names", () => {
  it("shows the stored English name in English", () => {
    draw();
    expect(screen.getByText("5 Lessons Completed")).toBeInTheDocument();
    expect(screen.getByText("2000 XP Earned")).toBeInTheDocument();
  });

  it("rebuilds the name in Arabic from type and target", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    const { container } = draw();
    expect(screen.getByText("الدروس المكتملة: 5")).toBeInTheDocument();
    expect(screen.getByText("نقاط الخبرة المكتسبة: 2,000")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Lessons Completed|XP Earned/);
  });
});
