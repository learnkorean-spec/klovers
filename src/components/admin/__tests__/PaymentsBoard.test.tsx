/**
 * The board as Re sees it: the tiles, the order, a failed read, and that a
 * second page of rows is actually fetched (PostgREST stops at 1000 silently).
 * The Supabase client is faked table by table.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

type Rows = Record<string, unknown[]>;
let tables: Rows = {};
let balances: unknown[] = [];
let failTable: string | null = null;
const rangeCalls: Array<[string, number, number]> = [];

vi.mock("@/integrations/supabase/client", () => {
  const from = (table: string) => {
    let lo = 0;
    let hi = Infinity;
    const q: Record<string, unknown> = {};
    for (const m of ["select", "eq", "is", "order"]) q[m] = () => q;
    q.range = (a: number, b: number) => { lo = a; hi = b; rangeCalls.push([table, a, b]); return q; };
    q.then = (res: (v: unknown) => unknown) =>
      Promise.resolve(
        failTable === table
          ? { data: null, error: { message: "boom" } }
          : { data: (tables[table] ?? []).slice(lo, hi + 1), error: null },
      ).then(res);
    return q;
  };
  return { supabase: { from, rpc: () => Promise.resolve({ data: balances, error: null }) } };
});

import PaymentsBoard from "@/components/admin/PaymentsBoard";

const renderBoard = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PaymentsBoard />
    </QueryClientProvider>,
  );

beforeEach(() => {
  failTable = null;
  rangeCalls.length = 0;
  tables = {
    enrollments: [
      { id: "e1", user_id: "u1", payment_status: "PAID", approval_status: "APPROVED", enrollment_status: "active", sessions_remaining: 2, sessions_total: 4, created_at: "2026-11-14" },
    ],
    pkg_group_members: [{ enrollment_id: "e1", user_id: "u1", member_status: "active", group_id: "g1" }],
    pkg_groups: [{ id: "g1", name: "Hangul Friday" }],
    profiles: [{ user_id: "u1", name: "Yasmeen" }],
    teacher_students: [{ id: "s1", full_name: "Menna", user_id: null, subject: "korean" }],
    student_bundles: [{ id: "b1", student_id: "s1", label: "4 classes", paid_on: "2026-10-26", note: null }],
  };
  balances = [{ student_id: "s1", bundle_id: "b1", label: "4 classes", total_classes: 4, remaining_classes: 0 }];
});

describe("PaymentsBoard", () => {
  it("shows the tiles and puts the student with nothing left first", async () => {
    renderBoard();
    await waitFor(() => expect(screen.getByText("طلاب نشطين")).toBeInTheDocument());
    const names = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    const menna = names.findIndex((t) => t.includes("Menna"));
    const yas = names.findIndex((t) => t.includes("Yasmeen"));
    expect(menna).toBeGreaterThanOrEqual(0);
    expect(menna).toBeLessThan(yas);
    expect(screen.getAllByText("مدفوع").length).toBeGreaterThan(0);
  });

  it("says it could not load, with a retry, when a source fails", async () => {
    failTable = "enrollments";
    renderBoard();
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "حاول تاني" })).toBeInTheDocument();
    expect(screen.queryByText("طلاب نشطين")).toBeNull();
  });

  it("reads past the first 1000 rows", async () => {
    tables.enrollments = Array.from({ length: 1001 }, (_, i) => ({
      id: `x${String(i).padStart(4, "0")}`, user_id: `ux${i}`, payment_status: "PENDING_PAYMENT",
      approval_status: "APPROVED", enrollment_status: "active", sessions_remaining: 0, sessions_total: 0, created_at: "2026-11-01",
    }));
    renderBoard();
    await waitFor(() => expect(screen.getByText("طلاب نشطين")).toBeInTheDocument());
    const pages = rangeCalls.filter(([t]) => t === "enrollments").map(([, a]) => a);
    expect(pages).toEqual([0, 1000]);
  });
});
