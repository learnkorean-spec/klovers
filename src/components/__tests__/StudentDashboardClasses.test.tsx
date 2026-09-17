import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StudentPrimaryAction, { type PrimarySession } from "../StudentPrimaryAction";
import UpcomingSessionsCard from "../UpcomingSessionsCard";
import { LanguageProvider } from "@/contexts/LanguageContext";

vi.mock("@/lib/leadTracking", () => ({ trackAndOpenWhatsApp: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const session: PrimarySession = {
  session_id: "class-1", session_date: "2026-09-17", start_time: "10:00:00",
  duration_min: 60, timezone: "UTC", group_name: "Korean beginners", level: "1",
  attendance_status: null,
};
const enrollment = { id: "package-1", sessions_total: 1, sessions_remaining: 0, plan_type: "group" };
const zoomUrl = "https://zoom.us/j/example";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-17T08:00:00Z"));
  localStorage.setItem("klovers_user_timezone", "UTC");
});
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

function primary(nextSession: PrimarySession | null = session, completed = false) {
  return render(<LanguageProvider><MemoryRouter>
    <StudentPrimaryAction enrollments={[enrollment]} attendanceDates={completed ? [{ date: "2026-09-16" }] : []}
      nextSession={nextSession} zoomUrl={zoomUrl} pendingEnrollments={[]} checklistItems={[]} />
  </MemoryRouter></LanguageProvider>);
}

describe("dashboard class access", () => {
  it("shows Join Class before noon on the day of class", () => {
    primary();
    expect(screen.getByRole("link", { name: "Join Class" })).toHaveAttribute("href", zoomUrl);
    expect(screen.getByText("Today!")).toBeInTheDocument();
  });
  it("keeps a scheduled class accessible after the package is used up", () => {
    primary(session, true);
    expect(screen.getByRole("link", { name: "Join Class" })).toBeInTheDocument();
    expect(screen.queryByText("Package Completed")).not.toBeInTheDocument();
    expect(screen.getByText(/Your package balance is 0/)).toBeInTheDocument();
  });
  it("still offers renewal when a completed package has no upcoming class", () => {
    primary(null, true);
    expect(screen.getByText("Package Completed")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Renew Package" })).toBeInTheDocument();
  });
  it("offers the schedule, not Join, for tomorrow's class", () => {
    primary({ ...session, session_date: "2026-09-18" });
    expect(screen.queryByRole("link", { name: "Join Class" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Manage Schedule" })).toHaveLength(1);
  });
  it("keeps later classes visible without duplicating the primary Join action", () => {
    render(<LanguageProvider><MemoryRouter><UpcomingSessionsCard sessions={[session, { ...session, session_id: "class-2", session_date: "2026-09-18", group_name: "Second group" }]}
      zoomUrl={zoomUrl} showJoinAction={false} /></MemoryRouter></LanguageProvider>);
    expect(screen.getByText(/Second group/)).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("retains a same-day class link when the upcoming card is used standalone", () => {
    render(<LanguageProvider><MemoryRouter><UpcomingSessionsCard sessions={[session]} zoomUrl={zoomUrl} /></MemoryRouter></LanguageProvider>);
    expect(screen.getByRole("link")).toHaveAttribute("href", zoomUrl);
  });
  it("shows the next class fully in Arabic (no min / AM / PM, level label localized)", () => {
    localStorage.setItem("k-lovers-lang", "ar");
    const { container } = primary();
    const text = container.textContent ?? "";
    expect(screen.getByRole("link", { name: "انضم إلى الحصة" })).toHaveAttribute("href", zoomUrl);
    expect(text).toContain("دقيقة");
    expect(text).toMatch(/10:00 ص/);
    expect(text).not.toMatch(/\bmin\b|\bAM\b|\bPM\b/);
  });
});
