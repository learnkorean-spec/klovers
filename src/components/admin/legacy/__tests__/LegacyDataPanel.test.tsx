import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Invented rows only.
const TABLES: Record<string, unknown[]> = {
  legacy_student_summary: [
    { id: "s1", display_name: "Naila", name_key: "naila", original_names: ["Naila"], auth_user_id: null, linked_at: null,
      linked_name: null, linked_email: null, years_active: [2022], sessions_2022: 4, sessions_2023: 0, sessions_2024: 0,
      sessions_2025: 0, total_sessions: 4, historical_value: "200.00", recorded_paid: null, late_unresolved: 0, open_issues: 0 },
    { id: "s2", display_name: "Naira", name_key: "naira", original_names: ["Naira"], auth_user_id: "u1", linked_at: "2026-09-28",
      linked_name: "Naira A", linked_email: "naira@example.com", years_active: [2023], sessions_2022: 0, sessions_2023: 3,
      sessions_2024: 0, sessions_2025: 0, total_sessions: 3, historical_value: "150.00", recorded_paid: "300.00", late_unresolved: 0, open_issues: 1 },
  ],
  legacy_year_summary: [
    { year: 2022, unique_students: 1, counted_sessions: 4, historical_value: "200.00", recorded_paid: null, late_unresolved: 0, unresolved_records: 0 },
    { year: 2023, unique_students: 1, counted_sessions: 3, historical_value: "150.00", recorded_paid: "300.00", late_unresolved: 0, unresolved_records: 1 },
  ],
  legacy_issues: [
    { id: "i1", category: "missing_price", status: "open", legacy_student_id: "s2", student_label: "Naira", year: 2023,
      month_label: "July", source_file: "f.xlsx", source_sheet: "2025 Session Finance", source_row: 4,
      problem: "No written price for this month.", suggested_action: null, resolution_note: null, resolved_at: null, created_at: "2026-09-28" },
  ],
  legacy_monthly_records: [],
  legacy_year_aggregates: [],
  legacy_import_batches: [],
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const result = { data: TABLES[table] ?? [], error: null };
    const b: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit", "eq"]) b[m] = () => b;
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(result).then(res, rej);
    return b;
  };
  return { supabase: { from: (t: string) => builder(t), rpc: vi.fn(async () => ({ data: null, error: null })) } };
});

import LegacyDataPanel from "../LegacyDataPanel";

function renderAt(section: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[`/admin?tab=legacy&section=${section}`]}>
        <LegacyDataPanel />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LegacyDataPanel", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the overview cards and keeps value and payments apart", async () => {
    renderAt("overview");
    expect(await screen.findByText("Legacy Students")).toBeTruthy();
    expect(screen.getByText("Historical Session Value")).toBeTruthy();
    expect(screen.getByText("Recorded Payments")).toBeTruthy();
    expect(screen.getByText("Sessions × price, not cash")).toBeTruthy();
    expect(screen.getByText("2025")).toBeTruthy();
  });

  it("lists Naila and Naira as separate students with their account status", async () => {
    renderAt("students");
    expect(await screen.findByRole("button", { name: "Naila" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Naira" })).toBeTruthy();
    expect(screen.getAllByText("Unlinked")).toHaveLength(1);
    expect(screen.getAllByText("Linked")).toHaveLength(1);
  });

  it("shows open issues in the review queue", async () => {
    renderAt("issues");
    expect(await screen.findByText("No written price for this month.")).toBeTruthy();
    expect(screen.getByText("Resolve")).toBeTruthy();
  });
});
