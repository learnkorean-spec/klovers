/**
 * Turns the prepared legacy workbook (KLOVERS_Master_Legacy_Import_2022_2025.xlsx)
 * into the payload fn_legacy_stage_batch stages for review.
 *
 * Rules (confirmed by Re, see the Import Rules sheet):
 *   - Identity = the Master Student Summary "Student" column, matched EXACTLY
 *     (case/space-insensitive). No fuzzy merging: "Naila" and "Naira" are two
 *     students. A first-name-only student that shares a first name with a
 *     full-name student is flagged, never assigned.
 *   - Present / 1 / In = counted. 0 / O / Absent / Cancel = not counted.
 *     Late = unresolved, never charged. Blank = no record. Anything else =
 *     unknown, flagged.
 *   - A written price always wins. Only when none is written: 50 EGP per
 *     counted session (4 sessions = 200 EGP), marked legacy_default.
 *   - Session charges = counted sessions x price. They are VALUE, not money.
 *     recorded_paid comes only from a payment column.
 *   - #REF! / #VALUE! / #NAME? and other error results are never imported as
 *     numbers.
 *   - No dates are invented. A month keeps its label; its calendar year is the
 *     one the admin picks for that label at import time.
 *   - Yearly totals are stored as yearly totals; no sessions are fabricated
 *     from them.
 */
import type { CellValue, Workbook } from "./xlsxReader";

export const LEGACY_DEFAULT_PRICE = 50;
export const LEGACY_CURRENCY = "EGP";

export const SHEETS = {
  master: "Master Student Summary",
  sessions: "2025 Session Finance",
  finance: "2024 Finance Source",
} as const;

export type IssueCategory =
  | "ambiguous_student"
  | "unknown_attendance_value"
  | "missing_price"
  | "broken_source_formula"
  | "potential_duplicate"
  | "unlinked_account"
  | "finance_conflict"
  | "other";

export type PriceSource = "explicit" | "legacy_default";

export interface StagedStudent {
  name_key: string;
  display_name: string;
  original_names: string[];
  original_student_name: string | null;
  source_sheet: string;
  source_row: number;
}

export interface StagedAggregate {
  source_key: string;
  name_key: string;
  year: number;
  kind: "yearly_total" | "master_check";
  counted_sessions: number;
  session_value: number;
  price_per_session: number | null;
  price_source: PriceSource | "mixed";
  late_unresolved: number;
  recorded_paid: number | null;
  source_sheet: string;
  source_row: number;
}

export interface StagedMonthly {
  source_key: string;
  name_key: string;
  record_kind: "session_month" | "finance_only";
  month_label: string;
  month: number | null;
  year: number | null;
  price_per_class: number | null;
  price_source: PriceSource | null;
  present_count: number | null;
  late_count: number;
  session_charges: number | null;
  source_session_charges: number | null;
  recorded_paid: number | null;
  source_balance: number | null;
  raw_statuses: string[];
  excluded: boolean;
  exclude_reason: string | null;
  original_student_name: string | null;
  origin_file: string | null;
  origin_row: number | null;
  source_sheet: string;
  source_row: number;
}

export interface StagedIssue {
  dedupe_key: string;
  category: IssueCategory;
  name_key: string | null;
  student_label: string | null;
  year: number | null;
  month_label: string | null;
  source_sheet: string | null;
  source_row: number | null;
  problem: string;
  suggested_action: string | null;
}

export interface LegacyPayload {
  students: StagedStudent[];
  aggregates: StagedAggregate[];
  monthly: StagedMonthly[];
  issues: StagedIssue[];
  meta: { duplicates_merged: number; month_labels: string[]; sheets_found: string[] };
}

/** month label (lower-case, trimmed) -> calendar year chosen by the admin. */
export type MonthYearMap = Record<string, number>;

// ── small helpers ───────────────────────────────────────────────────────────

export function nameKey(name: string): string {
  return name.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
}

function cleanName(v: CellValue): string {
  return v === null || v === undefined ? "" : String(v).normalize("NFC").replace(/\s+/g, " ").trim();
}

const ERROR_RE = /^#(REF!|VALUE!|NAME\?|DIV\/0!|N\/A|NULL!|NUM!|SPILL!|CALC!|GETTING_DATA)/i;

export function isFormulaError(v: CellValue): boolean {
  return typeof v === "string" && ERROR_RE.test(v.trim());
}

type NumResult = { value: number | null; problem: null | "error" | "text"; raw: CellValue };

/** A trustworthy number, or null plus the reason it is not one. */
export function num(v: CellValue): NumResult {
  if (v === null || v === undefined || v === "") return { value: null, problem: null, raw: v };
  if (typeof v === "number") return Number.isFinite(v) ? { value: v, problem: null, raw: v } : { value: null, problem: "text", raw: v };
  if (typeof v === "boolean") return { value: null, problem: "text", raw: v };
  const s = v.trim();
  if (isFormulaError(s)) return { value: null, problem: "error", raw: v };
  const n = Number(s.replace(/,/g, ""));
  if (s !== "" && Number.isFinite(n)) return { value: n, problem: null, raw: v };
  return { value: null, problem: "text", raw: v };
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

export function monthKey(label: string): string {
  return label.trim().toLowerCase();
}

export function monthNumber(label: string): number | null {
  return MONTHS[monthKey(label)] ?? null;
}

export type StatusClass = "counted" | "not_counted" | "late" | "blank" | "unknown";

export function classifyStatus(raw: string): StatusClass {
  const s = raw.trim().toLowerCase();
  if (s === "") return "blank";
  if (s === "1" || s === "in" || s === "present") return "counted";
  if (s === "0" || s === "o" || s === "absent" || s === "cancel" || s === "cancelled" || s === "canceled") return "not_counted";
  if (s === "late") return "late";
  return "unknown";
}

function headerIndex(header: CellValue[], ...names: string[]): number {
  const norm = header.map((h) => cleanName(h).toLowerCase());
  for (const n of names) {
    const i = norm.indexOf(n.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function cell(row: CellValue[], i: number): CellValue {
  return i >= 0 ? row[i] ?? null : null;
}

const isBlankRow = (r: CellValue[]) => !r || r.every((c) => c === null || c === "");

// ── main ────────────────────────────────────────────────────────────────────

export function normalizeLegacyWorkbook(wb: Workbook, monthYearMap: MonthYearMap): LegacyPayload {
  const students = new Map<string, StagedStudent>();
  const aggregates: StagedAggregate[] = [];
  const monthly = new Map<string, StagedMonthly>();
  const issues = new Map<string, StagedIssue>();
  let duplicatesMerged = 0;

  const addIssue = (i: StagedIssue) => {
    if (!issues.has(i.dedupe_key)) issues.set(i.dedupe_key, i);
  };
  const label = (key: string | null) => (key ? students.get(key)?.display_name ?? key : null);

  // ── 1. Master Student Summary: identities + yearly totals ────────────────
  const master = wb[SHEETS.master];
  if (!master || master.length === 0) throw new Error(`Sheet "${SHEETS.master}" not found`);
  const mh = master[0];
  const col = {
    student: headerIndex(mh, "Student"),
    originals: headerIndex(mh, "Original name(s)", "Original names", "Original name"),
    s22: headerIndex(mh, "2022 Sessions"), v22: headerIndex(mh, "2022 Value EGP"),
    s23: headerIndex(mh, "2023 Sessions"), v23: headerIndex(mh, "2023 Value EGP"),
    s24: headerIndex(mh, "2024 Sessions"), v24: headerIndex(mh, "2024 Est. Value EGP", "2024 Value EGP"),
    s25: headerIndex(mh, "2025 Sessions"), v25: headerIndex(mh, "2025 Session Charges EGP"),
    p25: headerIndex(mh, "2025 Recorded Paid EGP"), l25: headerIndex(mh, "2025 Late/Unresolved"),
  };
  if (col.student < 0) throw new Error(`"Student" column not found in "${SHEETS.master}"`);

  const master2025 = new Map<string, { sessions: number; charges: number | null; paid: number | null; late: number; row: number }>();

  for (let r = 1; r < master.length; r++) {
    const row = master[r];
    if (isBlankRow(row)) continue;
    const excelRow = r + 1;
    const student = cleanName(cell(row, col.student));
    const originals = cleanName(cell(row, col.originals))
      .split(/\s*\|\s*/)
      .map((s) => s.trim())
      .filter(Boolean);
    const display = student || originals[0] || "";
    if (!display) continue;
    const key = nameKey(display);

    if (students.has(key)) {
      // Two Master rows with the same normalised name: keep the first, flag the second.
      duplicatesMerged++;
      addIssue({
        dedupe_key: `potential_duplicate:master:${excelRow}`,
        category: "potential_duplicate", name_key: key, student_label: display,
        year: null, month_label: null, source_sheet: SHEETS.master, source_row: excelRow,
        problem: `"${display}" appears more than once in the Master sheet (row ${excelRow}).`,
        suggested_action: "Check both rows; figures from the repeated row were not imported.",
      });
      continue;
    }
    students.set(key, {
      name_key: key, display_name: display,
      original_names: Array.from(new Set(originals.length ? originals : [display])),
      original_student_name: originals[0] ?? display,
      source_sheet: SHEETS.master, source_row: excelRow,
    });

    if (!student) {
      addIssue({
        dedupe_key: `ambiguous_student:no_master_name:${key}`,
        category: "ambiguous_student", name_key: key, student_label: display,
        year: null, month_label: null, source_sheet: SHEETS.master, source_row: excelRow,
        problem: `No normalised student name in the Master sheet; only the original spelling "${display}".`,
        suggested_action: "Confirm who this is. If it is another student's spelling, note it here; nothing is merged automatically.",
      });
    }

    for (const [year, sIdx, vIdx] of [[2022, col.s22, col.v22], [2023, col.s23, col.v23], [2024, col.s24, col.v24]] as const) {
      const s = num(cell(row, sIdx));
      const v = num(cell(row, vIdx));
      for (const [what, res] of [["sessions", s], ["value", v]] as const) {
        if (res.problem) {
          addIssue({
            dedupe_key: `${res.problem === "error" ? "broken_source_formula" : "other"}:master:${excelRow}:${year}:${what}`,
            category: res.problem === "error" ? "broken_source_formula" : "other",
            name_key: key, student_label: display, year, month_label: null,
            source_sheet: SHEETS.master, source_row: excelRow,
            problem: `${year} ${what} cell holds "${String(res.raw)}", not a number. Not imported.`,
            suggested_action: "Check the original sheet for the real figure.",
          });
        }
      }
      const sessions = s.value ?? 0;
      if (sessions <= 0) continue;
      const value = sessions * LEGACY_DEFAULT_PRICE;
      aggregates.push({
        source_key: `agg:${key}:${year}:master`, name_key: key, year, kind: "yearly_total",
        counted_sessions: sessions, session_value: value,
        price_per_session: LEGACY_DEFAULT_PRICE, price_source: "legacy_default",
        late_unresolved: 0, recorded_paid: null,
        source_sheet: SHEETS.master, source_row: excelRow,
      });
      if (v.value !== null && v.value !== value) {
        addIssue({
          dedupe_key: `finance_conflict:master:${excelRow}:${year}:value`,
          category: "finance_conflict", name_key: key, student_label: display, year, month_label: null,
          source_sheet: SHEETS.master, source_row: excelRow,
          problem: `${year} value in the sheet is ${v.value} EGP; ${sessions} sessions x ${LEGACY_DEFAULT_PRICE} EGP = ${value} EGP. The recalculated value was stored.`,
          suggested_action: "If a written price exists for this year, record it; otherwise no action.",
        });
      }
    }

    const s25 = num(cell(row, col.s25)).value ?? 0;
    const c25 = num(cell(row, col.v25)).value;
    const p25 = num(cell(row, col.p25)).value;
    const l25 = num(cell(row, col.l25)).value ?? 0;
    if (s25 > 0 || (c25 ?? 0) > 0 || (p25 ?? 0) > 0 || l25 > 0) {
      master2025.set(key, { sessions: s25, charges: c25, paid: p25, late: l25, row: excelRow });
    }
  }

  // Placeholders and first-name-only students.
  const allNames = Array.from(students.values());
  for (const s of allNames) {
    const tokens = s.display_name.split(" ");
    // Digits inside a full name are Franco-Arabic letters ("Sh3ban" = Sha'ban),
    // so only a single token with a digit ("Nab3") counts as a placeholder.
    const placeholder =
      /^[a-z]{1,2}$/i.test(s.display_name) ||
      /^student\s+\S+$/i.test(s.display_name) ||
      (tokens.length === 1 && /\d/.test(s.display_name));
    if (placeholder) {
      addIssue({
        dedupe_key: `ambiguous_student:placeholder:${s.name_key}`,
        category: "ambiguous_student", name_key: s.name_key, student_label: s.display_name,
        year: null, month_label: null, source_sheet: s.source_sheet, source_row: s.source_row,
        problem: `"${s.display_name}" looks like a placeholder or nickname, not a full name.`,
        suggested_action: "Confirm who this is and record it in the resolution note.",
      });
    }
    if (tokens.length === 1 && !placeholder) {
      const first = tokens[0].toLowerCase();
      const others = allNames
        .filter((o) => o.name_key !== s.name_key && o.name_key.split(" ")[0] === first && o.name_key.includes(" "))
        .map((o) => o.display_name);
      if (others.length) {
        addIssue({
          dedupe_key: `ambiguous_student:first_name_only:${s.name_key}`,
          category: "ambiguous_student", name_key: s.name_key, student_label: s.display_name,
          year: null, month_label: null, source_sheet: s.source_sheet, source_row: s.source_row,
          problem: `First name only. Other students share it: ${others.join(", ")}. Kept as a separate student.`,
          suggested_action: "Leave separate unless you know which person this is; nothing is assigned automatically.",
        });
      }
    }
  }

  const ensureStudent = (name: string, sheet: string, row: number): string => {
    const key = nameKey(name);
    if (!students.has(key)) {
      students.set(key, {
        name_key: key, display_name: name, original_names: [name], original_student_name: name,
        source_sheet: sheet, source_row: row,
      });
      addIssue({
        dedupe_key: `other:not_in_master:${key}`,
        category: "other", name_key: key, student_label: name, year: null, month_label: null,
        source_sheet: sheet, source_row: row,
        problem: `"${name}" is not in the Master Student Summary; created from ${sheet}.`,
        suggested_action: "Check the spelling against the Master sheet.",
      });
    }
    return key;
  };
  const addOriginal = (key: string, original: string) => {
    const s = students.get(key);
    if (s && original && !s.original_names.includes(original)) s.original_names.push(original);
  };

  const monthLabels = new Set<string>();
  const yearFor = (lbl: string) => monthYearMap[monthKey(lbl)] ?? null;

  // ── 2. Detailed monthly session + finance rows ───────────────────────────
  const sess = wb[SHEETS.sessions];
  if (sess && sess.length > 1) {
    const h = sess[0];
    const c = {
      month: headerIndex(h, "Month"), srcRow: headerIndex(h, "Source row"),
      student: headerIndex(h, "Student"), original: headerIndex(h, "Original name"),
      price: headerIndex(h, "Price per class EGP", "Price per class"),
      present: headerIndex(h, "Present/count"), late: headerIndex(h, "Late/unresolved"),
      charges: headerIndex(h, "Session charges EGP"), paid: headerIndex(h, "Recorded paid EGP"),
      statuses: headerIndex(h, "Raw statuses"), file: headerIndex(h, "Source file"),
    };
    for (let r = 1; r < sess.length; r++) {
      const row = sess[r];
      if (isBlankRow(row)) continue;
      const excelRow = r + 1;
      const monthLabel = cleanName(cell(row, c.month));
      const studentName = cleanName(cell(row, c.student));
      if (!monthLabel || !studentName) continue;
      monthLabels.add(monthKey(monthLabel));
      const key = ensureStudent(studentName, SHEETS.sessions, excelRow);
      const original = cleanName(cell(row, c.original));
      addOriginal(key, original);
      const originRow = num(cell(row, c.srcRow)).value;
      const sk = `m:${monthKey(monthLabel)}:${originRow ?? `x${excelRow}`}:${key}`;
      const year = yearFor(monthLabel);
      const ctx = { name_key: key, student_label: label(key), year, month_label: monthLabel, source_sheet: SHEETS.sessions, source_row: excelRow };

      const rawStatuses = cleanName(cell(row, c.statuses)).split("|").map((s) => s.trim());
      let counted = 0, late = 0;
      const unknown: string[] = [];
      for (const st of rawStatuses) {
        const k = classifyStatus(st);
        if (k === "counted") counted++;
        else if (k === "late") late++;
        else if (k === "unknown") unknown.push(st);
      }
      const statuses = rawStatuses.filter((s) => s !== "");

      // Spreadsheet total rows ("Remaining Balance (EGP) total") are not students.
      const totalRow = unknown.some((u) => /total/i.test(u));
      if (totalRow) {
        monthly.set(sk, {
          source_key: sk, name_key: key, record_kind: "session_month", month_label: monthLabel,
          month: monthNumber(monthLabel), year, price_per_class: null, price_source: null,
          present_count: 0, late_count: 0, session_charges: 0, source_session_charges: num(cell(row, c.charges)).value,
          recorded_paid: null, source_balance: null, raw_statuses: statuses, excluded: true,
          exclude_reason: "Spreadsheet total row, not a student record",
          original_student_name: original || null, origin_file: cleanName(cell(row, c.file)) || null,
          origin_row: originRow, source_sheet: SHEETS.sessions, source_row: excelRow,
        });
        addIssue({ dedupe_key: `other:total_row:${sk}`, category: "other", ...ctx,
          problem: `Row is a spreadsheet total ("${unknown.find((u) => /total/i.test(u))}"), not attendance. Excluded from all totals.`,
          suggested_action: "No action needed; kept only for traceability." });
        continue;
      }

      for (const u of unknown) {
        addIssue({ dedupe_key: `unknown_attendance_value:${sk}:${u.toLowerCase()}`, category: "unknown_attendance_value", ...ctx,
          problem: `Unknown attendance value "${u}". Not counted.`,
          suggested_action: "Decide whether it was a session; record the decision in the note." });
      }
      if (late > 0) {
        addIssue({ dedupe_key: `unknown_attendance_value:${sk}:late`, category: "unknown_attendance_value", ...ctx,
          problem: `Late x${late}: attendance unresolved. Not counted and not charged.`,
          suggested_action: "Decide whether the late session counts; nothing is charged automatically." });
      }

      const colPresent = num(cell(row, c.present)).value;
      if (colPresent !== null && colPresent !== counted) {
        addIssue({ dedupe_key: `finance_conflict:${sk}:present`, category: "finance_conflict", ...ctx,
          problem: `Present/count column says ${colPresent}; the raw statuses give ${counted}. The raw statuses were used.`,
          suggested_action: "Check the original attendance cells." });
      }

      const price = num(cell(row, c.price));
      if (price.problem === "error") {
        addIssue({ dedupe_key: `broken_source_formula:${sk}:price`, category: "broken_source_formula", ...ctx,
          problem: `Price cell holds "${String(price.raw)}". Not imported as a price.`,
          suggested_action: "Enter the real price in the note if known." });
      }
      const explicit = price.value !== null && price.value > 0;
      const unit = explicit ? price.value! : LEGACY_DEFAULT_PRICE;
      if (!explicit) {
        addIssue({ dedupe_key: `missing_price:${sk}`, category: "missing_price", ...ctx,
          problem: `No written price for this month. ${LEGACY_DEFAULT_PRICE} EGP per counted session applied.`,
          suggested_action: "If a written price exists, note it; the default stays until then." });
      }
      const charges = counted * unit;
      const srcCharges = num(cell(row, c.charges));
      if (srcCharges.problem === "error") {
        addIssue({ dedupe_key: `broken_source_formula:${sk}:charges`, category: "broken_source_formula", ...ctx,
          problem: `Session charges cell holds "${String(srcCharges.raw)}". Recalculated as ${counted} x ${unit} = ${charges} EGP.`,
          suggested_action: "No action needed." });
      } else if (srcCharges.value !== null && srcCharges.value !== charges) {
        addIssue({ dedupe_key: `finance_conflict:${sk}:charges`, category: "finance_conflict", ...ctx,
          problem: `Sheet charges ${srcCharges.value} EGP; ${counted} x ${unit} = ${charges} EGP. The recalculated figure was stored.`,
          suggested_action: "Check the original sheet." });
      }
      const paid = num(cell(row, c.paid));
      if (paid.problem) {
        addIssue({ dedupe_key: `${paid.problem === "error" ? "broken_source_formula" : "other"}:${sk}:paid`,
          category: paid.problem === "error" ? "broken_source_formula" : "other", ...ctx,
          problem: `Paid cell holds "${String(paid.raw)}". Not imported as a payment.`,
          suggested_action: "Check the original payment record." });
      }

      monthly.set(sk, {
        source_key: sk, name_key: key, record_kind: "session_month", month_label: monthLabel,
        month: monthNumber(monthLabel), year, price_per_class: unit,
        price_source: explicit ? "explicit" : "legacy_default",
        present_count: counted, late_count: late, session_charges: charges,
        source_session_charges: srcCharges.value, recorded_paid: paid.value, source_balance: null,
        raw_statuses: statuses, excluded: false, exclude_reason: null,
        original_student_name: original || null, origin_file: cleanName(cell(row, c.file)) || null,
        origin_row: originRow, source_sheet: SHEETS.sessions, source_row: excelRow,
      });
    }
  }

  // ── 3. 2024 finance workbook: payments + stated balances ─────────────────
  const fin = wb[SHEETS.finance];
  if (fin && fin.length > 1) {
    const h = fin[0];
    const c = {
      month: headerIndex(h, "Month"), srcRow: headerIndex(h, "Source row"),
      student: headerIndex(h, "Student"), original: headerIndex(h, "Original name"),
      price: headerIndex(h, "Price per class", "Price per class EGP"),
      paid: headerIndex(h, "Total paid"), balance: headerIndex(h, "Remaining balance"),
    };
    for (let r = 1; r < fin.length; r++) {
      const row = fin[r];
      if (isBlankRow(row)) continue;
      const excelRow = r + 1;
      const monthLabel = cleanName(cell(row, c.month));
      const studentName = cleanName(cell(row, c.student));
      if (!monthLabel || !studentName) continue;
      monthLabels.add(monthKey(monthLabel));
      const key = ensureStudent(studentName, SHEETS.finance, excelRow);
      const original = cleanName(cell(row, c.original));
      addOriginal(key, original);
      const originRow = num(cell(row, c.srcRow)).value;
      const sk = `m:${monthKey(monthLabel)}:${originRow ?? `f${excelRow}`}:${key}`;
      const year = yearFor(monthLabel);
      const ctx = { name_key: key, student_label: label(key), year, month_label: monthLabel, source_sheet: SHEETS.finance, source_row: excelRow };

      const price = num(cell(row, c.price));
      const paid = num(cell(row, c.paid));
      const balance = num(cell(row, c.balance));
      for (const [what, res] of [["Price", price], ["Total paid", paid], ["Remaining balance", balance]] as const) {
        if (res.problem) {
          addIssue({ dedupe_key: `${res.problem === "error" ? "broken_source_formula" : "other"}:${sk}:fin:${what}`,
            category: res.problem === "error" ? "broken_source_formula" : "other", ...ctx,
            problem: `${what} cell holds "${String(res.raw)}", not a number. Not imported.`,
            suggested_action: "Check the original finance sheet." });
        }
      }

      const existing = monthly.get(sk);
      if (existing) {
        // Same month, same source row, same student as a detailed row: one record.
        duplicatesMerged++;
        existing.source_balance = balance.value;
        const conflicts: string[] = [];
        if (price.value !== null && existing.price_source === "explicit" && price.value !== existing.price_per_class)
          conflicts.push(`price ${price.value} vs ${existing.price_per_class}`);
        if (paid.value !== null && existing.recorded_paid !== null && paid.value !== existing.recorded_paid)
          conflicts.push(`paid ${paid.value} vs ${existing.recorded_paid}`);
        if (conflicts.length) {
          addIssue({ dedupe_key: `finance_conflict:${sk}:finance_vs_sessions`, category: "finance_conflict", ...ctx,
            problem: `2024 finance sheet disagrees with the detailed row: ${conflicts.join("; ")}. Detailed row kept.`,
            suggested_action: "Check which figure is right." });
        }
        continue;
      }

      if (price.value === null && !price.problem) {
        addIssue({ dedupe_key: `missing_price:${sk}:fin`, category: "missing_price", ...ctx,
          problem: "No written price on this finance row. No sessions on this row, so no charge depends on it.",
          suggested_action: "No action needed unless the price is known." });
      }
      monthly.set(sk, {
        source_key: sk, name_key: key, record_kind: "finance_only", month_label: monthLabel,
        month: monthNumber(monthLabel), year,
        price_per_class: price.value !== null && price.value > 0 ? price.value : null,
        price_source: price.value !== null && price.value > 0 ? "explicit" : null,
        present_count: null, late_count: 0, session_charges: null, source_session_charges: null,
        recorded_paid: paid.value, source_balance: balance.value, raw_statuses: [],
        excluded: false, exclude_reason: null, original_student_name: original || null,
        origin_file: null, origin_row: originRow, source_sheet: SHEETS.finance, source_row: excelRow,
      });
    }
  }

  // ── 4. Cross-checks ──────────────────────────────────────────────────────
  // Master 2025 totals: kept as a check (never counted), compared with the detail.
  const detailByStudent = new Map<string, { present: number; charges: number; paid: number; late: number }>();
  for (const m of monthly.values()) {
    if (m.excluded || m.record_kind !== "session_month") continue;
    const d = detailByStudent.get(m.name_key) ?? { present: 0, charges: 0, paid: 0, late: 0 };
    d.present += m.present_count ?? 0;
    d.charges += m.session_charges ?? 0;
    d.paid += m.recorded_paid ?? 0;
    d.late += m.late_count;
    detailByStudent.set(m.name_key, d);
  }
  for (const [key, t] of master2025) {
    aggregates.push({
      source_key: `agg:${key}:2025:master_check`, name_key: key, year: 2025, kind: "master_check",
      counted_sessions: t.sessions, session_value: t.charges ?? 0, price_per_session: null,
      price_source: "explicit", late_unresolved: t.late, recorded_paid: t.paid,
      source_sheet: SHEETS.master, source_row: t.row,
    });
    const d = detailByStudent.get(key);
    if (!d || d.present !== t.sessions) {
      addIssue({ dedupe_key: `finance_conflict:master2025:${key}`, category: "finance_conflict", name_key: key,
        student_label: label(key), year: null, month_label: null, source_sheet: SHEETS.master, source_row: t.row,
        problem: `Master "2025" shows ${t.sessions} sessions; the detailed monthly rows give ${d?.present ?? 0}. Only the detailed rows are counted.`,
        suggested_action: "Check the original 2025 file." });
    }
  }

  // A yearly total and monthly detail in the same calendar year may be the same sessions.
  for (const a of aggregates) {
    if (a.kind !== "yearly_total") continue;
    const overlap = Array.from(monthly.values()).filter(
      (m) => m.name_key === a.name_key && m.year === a.year && !m.excluded && (m.present_count ?? 0) > 0,
    );
    if (overlap.length) {
      addIssue({ dedupe_key: `finance_conflict:overlap:${a.name_key}:${a.year}`, category: "finance_conflict",
        name_key: a.name_key, student_label: label(a.name_key), year: a.year, month_label: null,
        source_sheet: SHEETS.master, source_row: a.source_row,
        problem: `${a.year} has both a yearly total (${a.counted_sessions} sessions) and ${overlap.length} monthly record(s). Both are counted; they may be the same sessions.`,
        suggested_action: "Confirm whether the monthly rows are part of the yearly total." });
    }
  }

  // Labels for issues raised before a student's display name was known.
  for (const i of issues.values()) if (i.name_key && !i.student_label) i.student_label = label(i.name_key);

  return {
    students: Array.from(students.values()),
    aggregates,
    monthly: Array.from(monthly.values()),
    issues: Array.from(issues.values()),
    meta: {
      duplicates_merged: duplicatesMerged,
      month_labels: Array.from(monthLabels).sort((a, b) => (monthNumber(a) ?? 13) - (monthNumber(b) ?? 13)),
      sheets_found: Object.keys(wb),
    },
  };
}

/** Month labels found in the detailed sheets, for the year picker before staging. */
export function findMonthLabels(wb: Workbook): string[] {
  const out = new Set<string>();
  for (const name of [SHEETS.sessions, SHEETS.finance]) {
    const sheet = wb[name];
    if (!sheet || sheet.length < 2) continue;
    const i = headerIndex(sheet[0], "Month");
    for (let r = 1; r < sheet.length; r++) {
      const v = cleanName(cell(sheet[r] ?? [], i));
      if (v) out.add(monthKey(v));
    }
  }
  return Array.from(out).sort((a, b) => (monthNumber(a) ?? 13) - (monthNumber(b) ?? 13));
}
