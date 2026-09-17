import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BadgeGrid } from "../GamificationUI";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BADGES } from "@/constants/gamification";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const wrap = (ui: React.ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe("BadgeGrid", () => {
  it("is compact by default: earned as named chips, locked as icon-only items without descriptions", () => {
    const earned = BADGES[0];
    const { container } = wrap(<BadgeGrid earnedBadges={[earned.key]} />);
    const lists = container.querySelectorAll("ul");
    expect(lists).toHaveLength(2);
    expect(lists[0].querySelectorAll("li")).toHaveLength(1);
    expect(lists[1].querySelectorAll("li")).toHaveLength(BADGES.length - 1);
    expect(screen.getByText(`Locked (${BADGES.length - 1})`)).toBeInTheDocument();
    // locked descriptions live only in the accessible label, not as visible text
    expect(container.textContent).not.toContain(BADGES[1].description);
  });

  it("keeps the full card grid when detailed", () => {
    const { container } = wrap(<BadgeGrid earnedBadges={[]} detailed />);
    expect(container.querySelectorAll("ul")).toHaveLength(0);
    expect(container.textContent).toContain(BADGES[1].description);
  });
});
