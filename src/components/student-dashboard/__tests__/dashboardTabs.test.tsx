import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DashboardTabBar, isDashTab } from "../DashboardTabBar";
import { NewStudentStart } from "../NewStudentStart";
import { ExploreDoors } from "../ExploreDoors";
import { ClarityPulse } from "../ClarityPulse";

vi.mock("@/lib/tracking", () => ({ track: { custom: vi.fn() } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

afterEach(() => { cleanup(); localStorage.clear(); });

const wrap = (ui: React.ReactNode) => render(<LanguageProvider><MemoryRouter>{ui}</MemoryRouter></LanguageProvider>);

const TabsHarness = () => {
  const [tab, setTab] = useState("today");
  return (
    <Tabs value={tab} onValueChange={setTab}>
      <DashboardTabBar />
      <TabsContent value="today">today panel</TabsContent>
      <TabsContent value="classes">classes panel</TabsContent>
      <TabsContent value="progress">progress panel</TabsContent>
      <TabsContent value="explore">explore panel</TabsContent>
    </Tabs>
  );
};

describe("DashboardTabBar", () => {
  it("offers exactly four tabs and shows one panel at a time", () => {
    wrap(<TabsHarness />);
    expect(screen.getAllByRole("tab").map(t => t.textContent)).toEqual(["Today", "Classes", "Progress", "Explore"]);
    expect(screen.getByRole("tab", { name: "Today" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("today panel")).toBeInTheDocument();
    expect(screen.queryByText("classes panel")).not.toBeInTheDocument();
  });
  it("only accepts its own tab names from the URL", () => {
    expect(isDashTab("classes")).toBe(true);
    expect(isDashTab("admin")).toBe(false);
    expect(isDashTab(null)).toBe(false);
  });
  it("renders in Arabic", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    wrap(<TabsHarness />);
    expect(screen.getByRole("tab", { name: "اليوم" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "حصصي" })).toBeInTheDocument();
  });
});

describe("NewStudentStart", () => {
  it("shows three steps and highlights the placement test first", () => {
    wrap(<NewStudentStart levelLabel={null} lessonHref="/textbook/korean-1/1" />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Take the test" })).toHaveAttribute("href", "/placement-test");
    expect(screen.getByRole("link", { name: "Start the lesson" })).toHaveAttribute("href", "/textbook/korean-1/1");
    expect(screen.getByRole("link", { name: "Book the trial" })).toHaveAttribute("href", "/free-trial");
  });
  it("marks the level step done once the test has been taken", () => {
    wrap(<NewStudentStart levelLabel="A1" lessonHref="/textbook" />);
    expect(screen.queryByRole("link", { name: "Take the test" })).not.toBeInTheDocument();
    expect(screen.getByText("Your level: A1")).toBeInTheDocument();
    expect(screen.getByText("Done")).toBeInTheDocument();
  });
});

describe("ExploreDoors", () => {
  it("links to the world, the exchange and the book audio", () => {
    const seeAll = vi.fn();
    wrap(<ExploreDoors onSeeAll={seeAll} />);
    expect(screen.getAllByRole("link").map(a => a.getAttribute("href"))).toEqual(["/world", "/exchange/app", "/a0"]);
    fireEvent.click(screen.getByRole("button", { name: "See all" }));
    expect(seeAll).toHaveBeenCalled();
  });
});

describe("ClarityPulse", () => {
  it("records one answer and never asks again", () => {
    const onVote = vi.fn();
    const { unmount } = wrap(<ClarityPulse onVote={onVote} />);
    fireEvent.click(screen.getByRole("button", { name: "A bit confusing" }));
    expect(onVote).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status")).toHaveTextContent("Thank you");
    unmount();
    wrap(<ClarityPulse onVote={onVote} />);
    expect(screen.queryByText("Is this page clear?")).not.toBeInTheDocument();
  });
});

describe("ExchangeAnnouncement", () => {
  it("links to the exchange app and stays hidden once dismissed", async () => {
    const { default: ExchangeAnnouncement } = await import("@/components/exchange/ExchangeAnnouncement");
    const { unmount } = wrap(<ExchangeAnnouncement isAr={false} surface="korean_dashboard" />);
    expect(screen.getByText("Language exchange is open")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Find a partner" })).toHaveAttribute("href", "/exchange/app");
    fireEvent.click(screen.getByRole("button", { name: "Hide this announcement" }));
    expect(screen.queryByText("Language exchange is open")).not.toBeInTheDocument();
    unmount();
    wrap(<ExchangeAnnouncement isAr={false} surface="korean_dashboard" />);
    expect(screen.queryByText("Language exchange is open")).not.toBeInTheDocument();
  });
  it("renders in Arabic", async () => {
    const { default: ExchangeAnnouncement } = await import("@/components/exchange/ExchangeAnnouncement");
    wrap(<ExchangeAnnouncement isAr surface="english_dashboard" />);
    expect(screen.getByText("تبادل اللغة متاح الآن")).toBeInTheDocument();
  });
});
