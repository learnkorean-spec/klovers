import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeaderboardCard } from "../LeaderboardCard";
import { LanguageProvider } from "@/contexts/LanguageContext";
import type { LeaderboardEntry } from "@/hooks/useLeaderboard";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const board = (meRank: number): LeaderboardEntry[] =>
  Array.from({ length: 30 }, (_, i) => ({
    user_id: `u${i + 1}`,
    name: i + 1 === meRank ? "Me Student" : `Student ${i + 1}`,
    avatar_url: null,
    value: 1000 - i,
    rank: i + 1,
    isCurrentUser: i + 1 === meRank,
  }));

let data = board(12);
vi.mock("@/hooks/useLeaderboard", () => ({
  useLeaderboard: () => ({
    xpLeaderboard: data,
    streakLeaderboard: data,
    weeklyLeaderboard: data,
    currentUserXpRank: data.find((e) => e.isCurrentUser)?.rank ?? null,
    currentUserStreakRank: null,
    loading: false,
  }),
}));

const renderCard = () => render(<LanguageProvider><LeaderboardCard /></LanguageProvider>);

describe("LeaderboardCard", () => {
  it("shows only the top 5 plus the student's own row", () => {
    data = board(12);
    renderCard();
    expect(screen.getByText("Student 5")).toBeInTheDocument();
    expect(screen.queryByText("Student 6")).not.toBeInTheDocument();
    expect(screen.queryByText("Student 30")).not.toBeInTheDocument();
    expect(screen.getByText("Me Student")).toBeInTheDocument();
  });

  it("does not repeat the student when she is already in the top 5", () => {
    data = board(3);
    renderCard();
    expect(screen.getAllByText("Me Student")).toHaveLength(1);
    expect(screen.queryByText("Student 6")).not.toBeInTheDocument();
  });
});
