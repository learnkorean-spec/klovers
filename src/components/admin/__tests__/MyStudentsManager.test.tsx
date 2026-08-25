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
import { render, screen, within, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { BundleBalance, MyStudentWithClasses, StudentBundle, StudentClassSession } from "@/types/students";

const confirmMutate = vi.fn().mockResolvedValue(undefined);
const unconfirmMutate = vi.fn().mockResolvedValue(undefined);
const addBundleMutate = vi.fn().mockResolvedValue(undefined);
const updateBundleMutate = vi.fn().mockResolvedValue(undefined);
const deleteBundleMutate = vi.fn().mockResolvedValue(undefined);
const upsertClassMutate = vi.fn().mockResolvedValue(undefined);

let students: MyStudentWithClasses[] = [];
let balances = new Map<string, BundleBalance>();
let sessions: StudentClassSession[] = [];
/** Per-student full bundle history for tests that need more than one bundle,
 * multiple statuses, or a specific coverage_start/review state. Most tests
 * never set this -- see useAllBundles below, which synthesises one bundle
 * per entry in `balances` when it is empty, so the ~40 tests written before
 * coverage_start existed keep working unchanged. */
let studentBundles: Map<string, StudentBundle[]> = new Map();

/** A StudentBundle from the BundleBalance shape older tests already build,
 * with a coverage_start far enough in the past to resolve any session date
 * those tests use, and marked reviewed so no test gets a surprise badge. */
const syntheticBundle = (studentId: string, b: BundleBalance): StudentBundle => ({
  id: b.bundle_id,
  student_id: studentId,
  source: b.source,
  catalog_key: b.catalog_key,
  label: b.label,
  total_classes: b.total_classes,
  total_price: b.total_price,
  currency: b.currency,
  purchased_on: b.purchased_on,
  coverage_start: "2000-01-01",
  coverage_start_confirmed_at: "2026-01-01T00:00:00Z",
  status: "active",
  voided_reason: null,
  voided_at: null,
  note: null,
});

vi.mock("@/hooks/admin/useMyStudents", () => ({
  useMyStudents: () => ({ data: students, isLoading: false }),
  useCreateStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpdateStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useDeleteStudent: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useUpsertClass: () => ({ mutateAsync: upsertClassMutate, isPending: false }),
  useDeleteClass: () => ({ mutateAsync: vi.fn(), isPending: false }),
  checkClassConflicts: vi.fn().mockResolvedValue([]),
  useBundleBalances: () => ({ data: balances }),
  useRecentSessions: () => ({ data: sessions }),
  useAllStudentSessions: (studentId: string | null) => ({
    data: sessions.filter(s => s.student_id === studentId),
    isLoading: false,
  }),
  useStudentBundles: (studentId: string | null) => ({
    data: studentId
      ? studentBundles.get(studentId) ?? (balances.has(studentId) ? [syntheticBundle(studentId, balances.get(studentId)!)] : [])
      : [],
  }),
  useAllBundles: () => ({
    data: studentBundles.size > 0
      ? studentBundles
      : new Map([...balances.entries()].map(([sid, b]) => [sid, [syntheticBundle(sid, b)]])),
  }),
  useBundleEdits: () => ({ data: [] }),
  useAddBundle: () => ({ mutateAsync: addBundleMutate, isPending: false }),
  useUpdateBundle: () => ({ mutateAsync: updateBundleMutate, isPending: false }),
  useDeleteBundle: () => ({ mutateAsync: deleteBundleMutate, isPending: false }),
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

const studentBundle = (over: Partial<StudentBundle> = {}): StudentBundle => ({
  id: "bundle-1",
  student_id: "solafa",
  source: "custom",
  catalog_key: null,
  label: "16 English classes",
  total_classes: 16,
  total_price: 6400,
  currency: "EGP",
  purchased_on: "2026-08-12",
  coverage_start: "2026-08-12",
  coverage_start_confirmed_at: "2026-08-12T00:00:00Z",
  status: "active",
  voided_reason: null,
  voided_at: null,
  note: null,
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
  upsertClassMutate.mockResolvedValue(undefined);
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  students = [solafa()];
  balances = new Map([["solafa", balance()]]);
  sessions = [];
  studentBundles = new Map();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("the bundle on the card", () => {
  it("shows what they bought, in the currency they paid", () => {
    draw();
    // Prefixed with its bundle number ("Bundle 1 — ...") — see numbering below.
    expect(screen.getByText(/16 English classes/)).toBeInTheDocument();
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

describe("currency and country cannot be mistyped", () => {
  it("offers currency as a dropdown in the bundle dialog, not a text field", () => {
    balances = new Map();
    draw();
    click(screen.getByRole("button", { name: /Add bundle/i }));

    const dialog = screen.getByRole("dialog");
    // The old free-text field was a textbox; Classes, Total price and the
    // optional name are the only ones that should remain.
    const textboxNames = within(dialog).getAllByRole("textbox")
      .map(el => el.getAttribute("id"));
    expect(textboxNames).not.toContain("bundle-currency");
    expect(textboxNames).toContain("bundle-classes");
    expect(textboxNames).toContain("bundle-price");
  });

  it("preselects the currency implied by the student's country", () => {
    balances = new Map();
    draw();
    click(screen.getByRole("button", { name: /Add bundle/i }));

    // Solafa is Egypt/EGP, so the dropdown opens on EGP rather than blank —
    // which is what caught the near-miss on her bundle.
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByText("EGP").length).toBeGreaterThan(0);
  });

  it("offers country as a searchable combobox in the student dialog", () => {
    const { baseElement } = draw();
    click(screen.getByRole("button", { name: /Add student/i }));

    const country = baseElement.querySelector("#student-country")!;
    expect(country).toBeTruthy();
    expect(country.getAttribute("role")).toBe("combobox");

    // No free-text country or currency field left to mistype into.
    const ids = within(screen.getByRole("dialog"))
      .getAllByRole("textbox").map(el => el.getAttribute("id"));
    expect(ids).not.toContain("student-country");
    expect(ids).not.toContain("student-currency");
  });

  it("filters the country list as you type", () => {
    const { baseElement } = draw();
    click(screen.getByRole("button", { name: /Add student/i }));
    click(baseElement.querySelector("#student-country")!);

    const search = screen.getByPlaceholderText(/Search countries/i);
    fireEvent.change(search, { target: { value: "egy" } });

    expect(screen.getByText("Egypt")).toBeInTheDocument();
    expect(screen.queryByText("Indonesia")).not.toBeInTheDocument();
  });

  it("shows each country's currency in the list, so the implication is visible", () => {
    const { baseElement } = draw();
    click(screen.getByRole("button", { name: /Add student/i }));
    click(baseElement.querySelector("#student-country")!);

    fireEvent.change(screen.getByPlaceholderText(/Search countries/i), { target: { value: "Saudi" } });
    const row = screen.getByText("Saudi Arabia").closest("[cmdk-item]")!;
    expect(row.textContent).toContain("SAR");
  });
});

describe("the class start date", () => {
  it("is shown on the class row itself, not only inside the dialog", () => {
    draw();
    // Solafa's fixture classes all carry effective_from: "2026-01-01".
    expect(screen.getAllByText(/since Thu 1 Jan/i).length).toBeGreaterThan(0);
  });

  it("prefills the dialog with the class's own start date when editing", () => {
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);
    const input = screen.getByLabelText("Start date") as HTMLInputElement;
    expect(input.value).toBe("2026-01-01");
  });

  it("saves whatever start date Re sets, past or future", async () => {
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);
    const input = screen.getByLabelText("Start date") as HTMLInputElement;

    fireEvent.change(input, { target: { value: "2026-09-01" } });   // future
    click(screen.getByRole("button", { name: "Save" }));

    // saveClass awaits checkClassConflicts before it ever calls upsertClass,
    // so the mutate call lands a microtask after the click, not inside it.
    await waitFor(() => expect(upsertClassMutate).toHaveBeenCalledTimes(1));
    expect(upsertClassMutate.mock.calls[0][0]).toMatchObject({ effective_from: "2026-09-01" });
  });

  it("defaults a new class's start date to today", () => {
    draw();
    click(screen.getByRole("button", { name: /Add a class/i }));
    const input = screen.getByLabelText("Start date") as HTMLInputElement;
    // NOW is 2026-08-23 in Asia/Kuala_Lumpur.
    expect(input.value).toBe("2026-08-23");
  });

  it("does not offer to apply the date elsewhere when the student has only one class", () => {
    students = [solafa({ classes: [solafa().classes[0]] })];
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("offers to apply the date to the student's other classes, off by default", () => {
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);
    expect(screen.getByText(/other 3 classes too/i)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("leaves the other classes alone when the checkbox is not ticked", async () => {
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-09-01" } });
    click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(upsertClassMutate).toHaveBeenCalledTimes(1));
    expect(upsertClassMutate).toHaveBeenCalledTimes(1);
  });

  it("applies the corrected date to every other class when ticked, keeping each one's own time", async () => {
    draw();
    click(screen.getAllByRole("button", { name: "Edit class" })[0]);   // c1, Monday
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-17" } });
    click(screen.getByRole("checkbox"));
    click(screen.getByRole("button", { name: "Save" }));

    // c1 itself, plus c2/c3/c4 (Tue/Wed/Thu) — 4 calls total.
    await waitFor(() => expect(upsertClassMutate).toHaveBeenCalledTimes(4));
    for (const call of upsertClassMutate.mock.calls) {
      expect(call[0].effective_from).toBe("2026-08-17");
    }
    const otherIds = upsertClassMutate.mock.calls.map(c => c[0].id).sort();
    expect(otherIds).toEqual(["c1", "c2", "c3", "c4"]);
    // Each other class keeps its own weekday — the checkbox moves the date, not the schedule.
    const c2Call = upsertClassMutate.mock.calls.find(c => c[0].id === "c2")![0];
    expect(c2Call).toMatchObject({ weekday: 2, start_time: "22:00", duration_minutes: 90 });
  });

  it("ACCEPTANCE — after Re sets the real start date, Catch up shows the 4 real occurrences and ticking moves the badge to 4 used / 12 left", () => {
    // Reproduces the actual bug: all 4 weekly classes carry the seed
    // migration's effective_from (22 Aug 2026), which is AFTER every
    // occurrence in the 14-day window, so nothing survives the filter.
    const wronglyDated = solafa({
      classes: [1, 2, 3, 4].map(w => ({
        id: `c${w}`, student_id: "solafa", weekday: w,
        start_time: "22:00:00", duration_minutes: 90, timezone: TZ,
        effective_from: "2026-08-22", effective_to: null, note: null,
      })),
    });
    students = [wronglyDated];
    draw();
    expect(screen.queryByText("To confirm")).not.toBeInTheDocument();

    // Re corrects it via the dialog (simulating what the Start date field
    // now lets her do) — these classes genuinely started the week of 17 Aug,
    // so only that week's 4 occurrences should appear, not the week before.
    const corrected = solafa({
      classes: wronglyDated.classes.map(c => ({ ...c, effective_from: "2026-08-17" })),
    });
    students = [corrected];
    const { unmount } = draw();

    const strip = screen.getByText("To confirm").closest("div")!.parentElement!;
    // Mon 17 - Thu 20 Aug, all four, now inside the window.
    expect(within(strip).getAllByRole("button", { name: /Class done/i })).toHaveLength(4);

    for (const btn of within(strip).getAllByRole("button", { name: /Class done/i })) {
      click(btn);
    }
    expect(confirmMutate).toHaveBeenCalledTimes(4);
    unmount();

    // The resulting balance the card would show once those 4 are counted.
    balances = new Map([["solafa", balance({ used_classes: 4, remaining_classes: 12 })]]);
    draw();
    expect(screen.getByText("4 of 16 used")).toBeInTheDocument();
    expect(screen.getByText("12 left")).toBeInTheDocument();
  });
});

describe("the catch-up queue has no expiry", () => {
  // One Sunday 09:00 class since 3 May 2026. Against NOW (Sun 23 Aug, noon),
  // this produces exactly 17 unconfirmed Sundays: the 9 from 28 Jun onward sit
  // inside the 60-day recent window, the 8 before that sit behind "show older".
  // Chosen so the split is exact and independently countable, not approximate.
  const sundayStudent = (over: Partial<MyStudentWithClasses> = {}): MyStudentWithClasses => solafa({
    id: "sunday-student",
    full_name: "Sunday Student",
    classes: [{
      id: "sun-1", student_id: "sunday-student", weekday: 0,
      start_time: "09:00:00", duration_minutes: 60, timezone: TZ,
      effective_from: "2026-05-03", effective_to: null, note: null,
    }],
    ...over,
  });

  beforeEach(() => {
    students = [sundayStudent()];
    balances = new Map([["sunday-student", balance({ student_id: "sunday-student" })]]);
  });

  it("counts the full backlog on the Catch up button, not a recent slice", () => {
    draw();
    expect(screen.getByRole("button", { name: "Catch up (17)" })).toBeInTheDocument();
  });

  it("shows the recent window by default and offers the rest behind a count, never silently", () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));

    const dialog = screen.getByRole("dialog");
    // 9 recent rows rendered; the older 8 are named, not hidden without a count.
    expect(within(dialog).getAllByRole("button").filter(b => /\d{2}:\d{2}/.test(b.textContent ?? ""))).toHaveLength(9);
    expect(within(dialog).getByText("8 older unconfirmed classes — show them")).toBeInTheDocument();
  });

  it("reveals the older rows on request, and only then can they be confirmed", () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    click(screen.getByText("8 older unconfirmed classes — show them"));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getAllByRole("button").filter(b => /\d{2}:\d{2}/.test(b.textContent ?? ""))).toHaveLength(17);
    expect(within(dialog).queryByText(/older unconfirmed/)).not.toBeInTheDocument();

    click(within(dialog).getByRole("button", { name: /^Confirm$/i }));
    expect(confirmMutate).toHaveBeenCalledTimes(1);
    expect(confirmMutate.mock.calls[0][0]).toHaveLength(17);
  });

  it("never writes off a row that was never shown — confirming the default view only touches what was rendered", () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    // Confirm immediately, without expanding "show older".
    click(screen.getByRole("button", { name: /^Confirm$/i }));

    expect(confirmMutate).toHaveBeenCalledTimes(1);
    const rows = confirmMutate.mock.calls[0][0];
    // Exactly the 9 visible rows — the 8 older ones are untouched, not recorded
    // as cancelled_no_charge, and stay in the queue for a later visit.
    expect(rows).toHaveLength(9);
    expect(rows.every((r: { outcome: string }) => r.outcome === "attended")).toBe(true);
  });

  it("D3 — states exactly what Confirm will write, naming the not-held date rather than only counting it", () => {
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));

    const dialog = screen.getByRole("dialog");
    const rows = within(dialog).getAllByRole("button").filter(b => /\d{2}:\d{2}/.test(b.textContent ?? ""));
    click(rows[0]);   // untick the most recent (Sun 23 Aug)

    // Text is split across <strong> tags, so match on the normalised whole
    // paragraph rather than a single text node.
    const summary = dialog.textContent!.replace(/\s+/g, " ");
    expect(summary).toContain("8 classes will be recorded as held");
    expect(summary).toContain("1 will be recorded as NOT held (no credit used): Sun 23 Aug");
  });

  it("only claims nothing is waiting when the whole queue is empty, not just the visible page", () => {
    // A student with a bundle but zero classes: the queue really is empty.
    students = [sundayStudent({ id: "empty", full_name: "Empty Student", classes: [] })];
    balances = new Map([["empty", balance({ student_id: "empty" })]]);
    draw();
    click(screen.getByRole("button", { name: /Catch up/i }));
    expect(screen.getByText("Nothing waiting — every class is confirmed.")).toBeInTheDocument();
  });
});

describe("bundle numbering and negative balance in history", () => {
  it("numbers bundles per student ordered by coverage_start, oldest first", () => {
    studentBundles = new Map([["solafa", [
      studentBundle({ id: "b1", coverage_start: "2026-01-01", status: "completed" }),
      studentBundle({ id: "b2", coverage_start: "2026-06-01", status: "active", label: "Renewal" }),
    ]]]);
    balances = new Map([["solafa", balance({ bundle_id: "b2", label: "Renewal" })]]);
    draw();
    click(screen.getByRole("button", { name: /^History$/i }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(/Bundle 1 —/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Bundle 2 —/)).toBeInTheDocument();
  });

  it("surfaces a negative balance on a superseded bundle, not only the active one", () => {
    // The exact real-world case this shipped for: a 4-class bundle overran to
    // -1 after being superseded, invisible anywhere except a direct query.
    const overrun = studentBundle({ id: "b1", coverage_start: "2026-01-01", status: "completed", total_classes: 4, label: "Overrun bundle" });
    const active = studentBundle({ id: "b2", coverage_start: "2026-06-01", status: "active", label: "Current bundle" });
    studentBundles = new Map([["solafa", [overrun, active]]]);
    balances = new Map([["solafa", balance({ bundle_id: "b2", label: "Current bundle" })]]);
    sessions = Array.from({ length: 5 }, (_, i) => ({
      id: `s${i}`, student_id: "solafa", bundle_id: "b1", class_id: null,
      session_date: `2026-0${i + 1}-15`, start_time: "22:00:00",
      outcome: "attended" as const, counted: true, confirmed_at: "2026-01-15T00:00:00Z", note: null,
    }));
    draw();
    click(screen.getByRole("button", { name: /^History$/i }));
    expect(within(screen.getByRole("dialog")).getByText("1 over")).toBeInTheDocument();
  });
});

describe("the unreviewed coverage_start marker", () => {
  it("shows on the active bundle's card when coverage_start_confirmed_at is null", () => {
    studentBundles = new Map([["solafa", [studentBundle({ coverage_start_confirmed_at: null })]]]);
    draw();
    // Scoped to the card itself -- an unconfirmed bundle also warns on every
    // to-confirm row drawing against it, which is a separate assertion below.
    const card = screen.getByText(/16 English classes/).closest("div")!.parentElement!;
    expect(within(card).getByText(/start date not reviewed/i)).toBeInTheDocument();
  });

  it("does not show once the bundle has been reviewed", () => {
    studentBundles = new Map([["solafa", [studentBundle({ coverage_start_confirmed_at: "2026-08-12T00:00:00Z" })]]]);
    draw();
    expect(screen.queryByText(/start date not reviewed/i)).not.toBeInTheDocument();
  });

  it("shows on a to-confirm row too, so a session is never silently charged against an unreviewed window", () => {
    studentBundles = new Map([["solafa", [studentBundle({ coverage_start_confirmed_at: null })]]]);
    draw();
    const strip = screen.getByText("To confirm").closest("div")!.parentElement!;
    expect(within(strip).getAllByText(/start date not reviewed/i).length).toBeGreaterThan(0);
  });
});

describe("edit bundle", () => {
  it("prefills the dialog with the bundle's own dates and saves through useUpdateBundle, marking it reviewed", async () => {
    studentBundles = new Map([["solafa", [studentBundle()]]]);
    draw();
    click(screen.getByRole("button", { name: /^History$/i }));
    click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Edit$/i }));

    expect(screen.getByLabelText("Purchased on")).toHaveValue("2026-08-12");
    expect(screen.getByLabelText("Covers from")).toHaveValue("2026-08-12");
    fireEvent.change(screen.getByLabelText("Covers from"), { target: { value: "2026-07-01" } });
    click(screen.getByRole("button", { name: /Save changes/i }));

    await waitFor(() => expect(updateBundleMutate).toHaveBeenCalledTimes(1));
    expect(updateBundleMutate.mock.calls[0][0]).toMatchObject({ id: "bundle-1", coverage_start: "2026-07-01" });
    // Saving the dialog is what "reviewed" means here, regardless of what changed.
    expect(updateBundleMutate.mock.calls[0][0].coverage_start_confirmed_at).toBeTruthy();
  });
});

describe("delete vs void", () => {
  it("offers Delete when a bundle has zero sessions, and confirming calls useDeleteBundle", async () => {
    studentBundles = new Map([["solafa", [studentBundle()]]]);
    sessions = [];
    draw();
    click(screen.getByRole("button", { name: /^History$/i }));
    click(within(screen.getByRole("dialog")).getByRole("button", { name: /^Delete$/i }));

    click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(deleteBundleMutate).toHaveBeenCalledWith("bundle-1"));
  });

  it("offers Void instead of Delete once a bundle has sessions, and requires a reason", async () => {
    studentBundles = new Map([["solafa", [studentBundle()]]]);
    sessions = [{
      id: "s1", student_id: "solafa", bundle_id: "bundle-1", class_id: null,
      session_date: "2026-08-17", start_time: "22:00:00",
      outcome: "attended", counted: true, confirmed_at: "2026-08-17T15:00:00Z", note: null,
    }];
    draw();
    click(screen.getByRole("button", { name: /^History$/i }));
    const historyDialog = screen.getByRole("dialog");
    expect(within(historyDialog).queryByRole("button", { name: /^Delete$/i })).not.toBeInTheDocument();
    click(within(historyDialog).getByRole("button", { name: /^Void$/i }));

    const voidButton = screen.getByRole("button", { name: /Void bundle/i });
    expect(voidButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "created by mistake" } });
    expect(voidButton).not.toBeDisabled();
    click(voidButton);

    await waitFor(() => expect(updateBundleMutate).toHaveBeenCalledTimes(1));
    expect(updateBundleMutate.mock.calls[0][0]).toMatchObject({
      id: "bundle-1", status: "cancelled", voided_reason: "created by mistake",
    });
  });
});
