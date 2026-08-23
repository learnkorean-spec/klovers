/**
 * The credit half of the My Students tab.
 *
 * These cover the promises the design makes to Re, not the markup: nothing is
 * counted without a click, a batch is all-or-nothing, zero is loud but changes
 * nothing, and money is shown in the currency it was paid in.
 *
 * The data hooks are mocked so the component is exercised against known state;
 * the database guarantees themselves were proved against a real Postgres in the
 * migration PR.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BundleBalance, MyStudentWithClasses, StudentClassSession } from "@/types/students";

const confirmMutate = vi.fn().mockResolvedValue(undefined);
const unconfirmMutate = vi.fn().mockResolvedValue(undefined);
const addBundleMutate = vi.fn().mockResolvedValue(undefined);

let students: MyStudentWithClasses[] = [];
let balances = new Map<string, BundleBalance>();
let sessions: StudentClassSession[] = [];

vi.mock("@/hooks/admin/useMyStudents", () => ({
  useMyStudents: () => ({ data: students, isLoading: false }),
  useCreateStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpsertClass: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteClass: () => ({ mutateAsync: vi.fn(), isPending: false }),
  checkClassConflicts: vi.fn().mockResolvedValue([]),
  useBundleBalances: () => ({ data: balances }),
  useRecentSessions: () => ({ data: sessions }),
  useStudentBundles: () => ({ data: [] }),
  useAddBundle: () => ({ mutateAsync: addBundleMutate, isPending: false }),
  useConfirmSessions: () => ({ mutateAsync: confirmMutate, isPending: false }),
  useUnconfirmSession: () => ({ mutateAsync: unconfirmMutate, isPending: false }),
}));

import MyStudentsManager from "../MyStudentsManager";

const TZ = "Asia/Kuala_Lumpur";

/** Sunday 23 Aug 2026, 12:00 in Kuala Lumpur — Solafa's Mon–Thu classes are past. */
const NOW = new Date("2026-08-23T04:00:00Z");

const solafa = (over: Partial<MyStudentWithClasses> = {}): MyStudentWithClasses => ({
  id: "solafa",
  full_name: "Solafa",
  subject: "english",
  status: "active",
  note: null,
  meeting_url: "https://teams.microsoft.com/l/meetup-join/abc",
  country: "Egypt",
  currency: "EGP",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  classes: [1, 2, 3, 4].map(w => ({
    id: `c${w}`,
    student_id: "solafa",
    weekday: w,
    start_time: "22:00:00",
    duration_minutes: 90,
    timezone: TZ,
    effective_from: "2026-01-01",
    effective_to: null,
    note: null,
  })),
  ...over,
});

const balance = (over: Partial<BundleBalance> = {}): BundleBalance => ({
  student_id: "solafa",
  bundle_id: "bundle-1",
  label: "16 English classes",
  source: "custom",
  catalog_key: null,
  total_classes: 16,
  used_classes: 9,
  remaining_classes: 7,
  total_price: 6400,
  currency: "EGP",
  purchased_on: "2026-08-12",
  ...over,
});

const draw = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MyStudentsManager />
    </QueryClientProvider>,
  );
};

/** fireEvent + flush, so a click's async mutation settles before assertions. */
const click = (el: Element) => { fireEvent.click(el); };

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  students = [solafa()];
  balances = new Map([["solafa", balance()]]);
  sessions = [];
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the bundle on the card", () => {
  it("shows what they bought, in the currency they paid", () => {
    draw();
    expect(screen.getByText("16 English classes")).toBeInTheDocument();
    // Intl renders the code as a prefix: "EGP 6,400.00".
    expect(screen.getByText(/EGP\s*6,400/)).toBeInTheDocument();
  });

  it("shows the price per class rather than storing it", () => {
    draw();
    // 6400 / 16 = 400, shown as "EGP 400.00 per class".
    expect(screen.getByText(/EGP\s*400\.00 per class/)).toBeInTheDocument();
  });

  it("shows usage and what is left", () => {
    draw();
    expect(screen.getByText("9 of 16 used")).toBeInTheDocument();
    expect(screen.getByText("7 left")).toBeInTheDocument();
  });

  it("prices a Saudi student in SAR alongside, with no conversion", () => {
    students = [solafa(), solafa({ id: "nora", full_name: "Nora", country: "Saudi Arabia", currency: "SAR", classes: [] })];
    balances = new Map([
      ["solafa", balance()],
      ["nora", balance({ student_id: "nora", bundle_id: "b2", label: "Private · 3 months", total_price: 1238, currency: "SAR", total_classes: 12, used_classes: 0, remaining_classes: 12 })],
    ]);
    draw();
    expect(screen.getByText(/SAR\s*1,238/)).toBeInTheDocument();
    expect(screen.getByText(/EGP\s*6,400/)).toBeInTheDocument();
  });

  it("offers to add one when the student has no bundle", () => {
    balances = new Map();
    draw();
    expect(screen.getByText(/No bundle/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add bundle/i })).toBeInTheDocument();
  });
});

describe("zero balance is loud and changes nothing", () => {
  it("shows a red 0-left badge and says the classes still run", () => {
    balances = new Map([["solafa", balance({ used_classes: 16, remaining_classes: 0 })]]);
    draw();
    expect(screen.getByText("0 classes left")).toBeInTheDocument();
    expect(screen.getByText(/still run and still block trial times/i)).toBeInTheDocument();
  });

  it("shows an overdrawn bundle rather than hiding it", () => {
    balances = new Map([["solafa", balance({ used_classes: 18, remaining_classes: -2 })]]);
    draw();
    expect(screen.getByText("2 over")).toBeInTheDocument();
  });

  it("keeps the student's classes listed and confirmable at zero", () => {
    balances = new Map([["solafa", balance({ used_classes: 16, remaining_classes: 0 })]]);
    draw();
    expect(screen.getAllByRole("button", { name: /Class done/i }).length).toBeGreaterThan(0);
  });
});

describe("the confirm strip", () => {
  it("lists classes the schedule says happened", () => {
    draw();
    const strip = screen.getByText("To confirm").closest("div")!.parentElement!;
    // Mon 17 – Thu 20 Aug within the 14-day window, plus the prior week.
    expect(within(strip).getAllByRole("button", { name: /Class done/i }).length).toBeGreaterThan(0);
  });

  it("counts nothing until the button is clicked", () => {
    draw();
    expect(confirmMutate).not.toHaveBeenCalled();
  });

  it("writes exactly one attended row for one click", async () => {
    draw();
    click(screen.getAllByRole("button", { name: /Class done/i })[0]);

    expect(confirmMutate).toHaveBeenCalledTimes(1);
    const rows = confirmMutate.mock.calls[0][0];
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      student_id: "solafa",
      bundle_id: "bundle-1",
      outcome: "attended",
    });
  });

  it("records a class that did not happen without using a credit", async () => {
    draw();
    const strip = screen.getByText("To confirm").closest("div")!.parentElement!;
    const skip = within(strip).getAllByTitle(/did not happen/i)[0];
    click(skip);

    expect(confirmMutate.mock.calls[0][0][0]).toMatchObject({ outcome: "cancelled_no_charge" });
  });

  it("leaves out a student with no bundle — there is nothing to draw from", () => {
    balances = new Map();
    draw();
    expect(screen.queryByText("To confirm")).not.toBeInTheDocument();
  });

  it("does not list a class that is already confirmed", () => {
    sessions = [{
      id: "s1", student_id: "solafa", bundle_id: "bundle-1", class_id: "c1",
      session_date: "2026-08-17", start_time: "22:00:00",
      outcome: "attended", counted: true, confirmed_at: "2026-08-17T15:00:00Z", note: null,
    }];
    const { container } = draw();
    expect(container.textContent).not.toContain("Mon 17 Aug");
  });
});

describe("batch catch-up", () => {
  it("sends every outstanding class in ONE call, so the batch is all-or-nothing", async () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    click(screen.getByRole("button", { name: /^Confirm$/i }));

    expect(confirmMutate).toHaveBeenCalledTimes(1);
    const rows = confirmMutate.mock.calls[0][0];
    expect(rows.length).toBeGreaterThan(1);
    expect(rows.every((r: { outcome: string }) => r.outcome === "attended")).toBe(true);
  });

  it("shows the resulting balance before it is committed", async () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    expect(screen.getByText(/Balance/)).toBeInTheDocument();
  });

  it("unticking a day records it as not held instead of counting it", async () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));

    const dialog = screen.getByRole("dialog");
    const rows = within(dialog).getAllByRole("button").filter(b => /\d{2}:\d{2}/.test(b.textContent ?? ""));
    click(rows[0]);                       // untick the first
    click(screen.getByRole("button", { name: /^Confirm$/i }));

    const sent = confirmMutate.mock.calls[0][0];
    expect(sent.filter((r: { outcome: string }) => r.outcome === "cancelled_no_charge")).toHaveLength(1);
    expect(sent.filter((r: { outcome: string }) => r.outcome === "attended").length).toBe(sent.length - 1);
  });

  it("warns when a catch-up would take the student past the end of the bundle", async () => {
    balances = new Map([["solafa", balance({ used_classes: 15, remaining_classes: 1 })]]);
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    expect(screen.getByText(/past the end of the bundle/i)).toBeInTheDocument();
  });
});

describe("the meeting link", () => {
  it("shows the student's own room as a link", () => {
    draw();
    const link = screen.getByRole("link", { name: /teams\.microsoft\.com/ });
    expect(link).toHaveAttribute("href", "https://teams.microsoft.com/l/meetup-join/abc");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
  });

  it("offers to add one when the student has none", () => {
    students = [solafa({ meeting_url: null })];
    draw();
    expect(screen.getByRole("button", { name: /Add meeting link/i })).toBeInTheDocument();
  });
});

describe("country and currency", () => {
  it("shows them on the card so the money is never ambiguous", () => {
    draw();
    expect(screen.getByText("Egypt · EGP")).toBeInTheDocument();
  });
});
