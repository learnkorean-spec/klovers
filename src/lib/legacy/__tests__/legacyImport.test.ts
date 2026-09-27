import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { readXlsx, type CellValue, type Workbook } from "../xlsxReader";
import {
  LEGACY_DEFAULT_PRICE, SHEETS, classifyStatus, findMonthLabels, normalizeLegacyWorkbook,
} from "../normalizeLegacyWorkbook";

// ── fixtures (invented names — no real student data in the repo) ────────────

const MASTER_HEADER = [
  "Student", "Original name(s)", "2022 Sessions", "2022 Value EGP", "2023 Sessions", "2023 Value EGP",
  "2024 Sessions", "2024 Est. Value EGP", "2025 Sessions", "2025 Session Charges EGP",
  "2025 Recorded Paid EGP", "2025 Late/Unresolved", "Total Counted Sessions", "Total Session Value EGP", "Account/Auth",
];
const SESS_HEADER = [
  "Month", "Source row", "Student", "Original name", "Price per class EGP", "Price source", "Present/count",
  "Late/unresolved", "Session charges EGP", "Recorded paid EGP", "Raw statuses", "Source file",
];
const FIN_HEADER = ["Month", "Source row", "Student", "Original name", "Price per class", "Total paid", "Remaining balance", "Treatment"];

function fixture(): Workbook {
  return {
    [SHEETS.master]: [
      MASTER_HEADER,
      ["Naila", "Naila", 4, 200, 0, 0, 0, 0, 0, 0, 0, 0, 4, 200, "NULL"],
      ["Naira", "Naira", 0, 0, 3, 150, 0, 0, 0, 0, 0, 0, 3, 150, "NULL"],
      ["Mona Adel", "Mona adel | Mona Adel", 0, 0, 0, 0, 2, 100, 3, 600, 600, 1, 5, 700, "NULL"],
      ["Mona", "Mona", 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 1, 50, "NULL"],
      ["Tarek Sh3ban", "Tarek Sh3ban", 0, 0, 2, 100, 0, 0, 0, 0, 0, 0, 2, 100, "NULL"],
      ["Nab3", "Nab3", 0, 0, 1, "#REF!", 0, 0, 0, 0, 0, 0, 1, 50, "NULL"],
    ] as CellValue[][],
    [SHEETS.sessions]: [
      SESS_HEADER,
      ["July", 3, "Mona Adel", "Mona adel", 200, "explicit", 3, 0, 600, 600, "Present | Present | Present | cancel", "old.xlsx"],
      ["July", 4, "Naila", "Naila", null, "", 0, 1, 0, 0, "Late | Absent", "old.xlsx"],
      ["July", 9, "Mona Adel", "Mona adel", 50, "explicit", 0, 0, 0, 0, "Remaining Balance (EGP) total", "old.xlsx"],
      ["october", 5, "Naira", "Naira", null, "", 2, 0, 100, "#VALUE!", "1 | In | Maybe", "old.xlsx"],
    ] as CellValue[][],
    [SHEETS.finance]: [
      FIN_HEADER,
      ["July", 3, "Mona Adel", "Mona", 200, 600, 0, "Historical"],
      ["Feb", 22, "Naila", "Naila", null, 300, "O", "Historical"],
    ] as CellValue[][],
  };
}

const MAP = { july: 2024, october: 2024, feb: 2024 };

describe("classifyStatus", () => {
  it("follows the confirmed legacy rules", () => {
    for (const s of ["1", "In", "Present", " present "]) expect(classifyStatus(s)).toBe("counted");
    for (const s of ["0", "O", "o", "Absent", "Cancel", "cancel"]) expect(classifyStatus(s)).toBe("not_counted");
    expect(classifyStatus("Late")).toBe("late");
    expect(classifyStatus("")).toBe("blank");
    expect(classifyStatus("Maybe")).toBe("unknown");
  });
});

describe("normalizeLegacyWorkbook", () => {
  const p = normalizeLegacyWorkbook(fixture(), MAP);
  const student = (k: string) => p.students.find((s) => s.name_key === k);
  const monthly = (k: string) => p.monthly.find((m) => m.source_key === k)!;

  it("keeps Naila and Naira as two students and never fuzzy-merges", () => {
    expect(student("naila")).toBeTruthy();
    expect(student("naira")).toBeTruthy();
    expect(p.students).toHaveLength(6);
    expect(p.issues.some((i) => i.category === "potential_duplicate" && /nai/.test(i.name_key ?? ""))).toBe(false);
  });

  it("flags a first-name-only student that shares a first name, without assigning her", () => {
    const i = p.issues.find((x) => x.dedupe_key === "ambiguous_student:first_name_only:mona");
    expect(i?.problem).toContain("Mona Adel");
    expect(student("mona")).toBeTruthy();
  });

  it("treats Franco-Arabic digits in a full name as a name, and a one-word name with a digit as a placeholder", () => {
    expect(p.issues.some((i) => i.dedupe_key === "ambiguous_student:placeholder:tarek sh3ban")).toBe(false);
    expect(p.issues.some((i) => i.dedupe_key === "ambiguous_student:placeholder:nab3")).toBe(true);
  });

  it("uses the written price and never overwrites it with 50", () => {
    const m = monthly("m:july:3:mona adel");
    expect(m.price_per_class).toBe(200);
    expect(m.price_source).toBe("explicit");
    expect(m.present_count).toBe(3);
    expect(m.session_charges).toBe(600);
  });

  it("uses exactly 50 EGP per counted session when no price is written", () => {
    const m = monthly("m:october:5:naira");
    expect(m.price_source).toBe("legacy_default");
    expect(m.price_per_class).toBe(LEGACY_DEFAULT_PRICE);
    expect(m.present_count).toBe(2);
    expect(m.session_charges).toBe(100);
    for (const a of p.aggregates.filter((x) => x.kind === "yearly_total")) {
      expect(a.session_value).toBe(a.counted_sessions * LEGACY_DEFAULT_PRICE);
      expect(a.price_source).toBe("legacy_default");
    }
  });

  it("never charges Late and raises it for review", () => {
    const m = monthly("m:july:4:naila");
    expect(m.late_count).toBe(1);
    expect(m.present_count).toBe(0);
    expect(m.session_charges).toBe(0);
    expect(p.issues.some((i) => i.dedupe_key === "unknown_attendance_value:m:july:4:naila:late")).toBe(true);
  });

  it("flags unknown attendance values and does not count them", () => {
    expect(p.issues.some((i) => i.category === "unknown_attendance_value" && i.problem.includes("Maybe"))).toBe(true);
  });

  it("does not import broken formula results as financial facts", () => {
    expect(monthly("m:october:5:naira").recorded_paid).toBeNull();
    expect(p.issues.some((i) => i.category === "broken_source_formula" && i.problem.includes("#VALUE!"))).toBe(true);
    expect(p.issues.some((i) => i.category === "broken_source_formula" && i.problem.includes("#REF!"))).toBe(true);
  });

  it("excludes spreadsheet total rows from every total", () => {
    const m = monthly("m:july:9:mona adel");
    expect(m.excluded).toBe(true);
    expect(m.exclude_reason).toMatch(/total row/i);
  });

  it("keeps attendance and payment apart: paid comes only from payment columns", () => {
    const m = monthly("m:july:4:naila");
    expect(m.recorded_paid).toBe(0);
    const fin = monthly("m:feb:22:naila");
    expect(fin.record_kind).toBe("finance_only");
    expect(fin.present_count).toBeNull();
    expect(fin.session_charges).toBeNull();
    expect(fin.recorded_paid).toBe(300);
    expect(fin.source_balance).toBeNull(); // "O" is not a number
  });

  it("merges a finance row that duplicates a detailed row instead of adding it twice", () => {
    expect(p.monthly.filter((m) => m.source_key === "m:july:3:mona adel")).toHaveLength(1);
    expect(monthly("m:july:3:mona adel").source_balance).toBe(0);
    expect(p.meta.duplicates_merged).toBe(1);
  });

  it("stores the master 2025 total as a check only, never as counted sessions", () => {
    const a = p.aggregates.find((x) => x.name_key === "mona adel" && x.year === 2025);
    expect(a?.kind).toBe("master_check");
  });

  it("never invents dates: only the chosen year and the month label are kept", () => {
    for (const m of p.monthly) {
      expect(Object.keys(m)).not.toContain("session_date");
      expect(m.year === null || m.year === 2024).toBe(true);
    }
    const unmapped = normalizeLegacyWorkbook(fixture(), {});
    expect(unmapped.monthly.every((m) => m.year === null)).toBe(true);
  });

  it("is deterministic: the same input gives the same keys", () => {
    const again = normalizeLegacyWorkbook(fixture(), MAP);
    expect(again.monthly.map((m) => m.source_key)).toEqual(p.monthly.map((m) => m.source_key));
    expect(again.issues.map((i) => i.dedupe_key)).toEqual(p.issues.map((i) => i.dedupe_key));
    expect(new Set(p.issues.map((i) => i.dedupe_key)).size).toBe(p.issues.length);
  });

  it("lists the month labels for the year picker", () => {
    expect(findMonthLabels(fixture())).toEqual(["feb", "july", "october"]);
  });
});

describe("readXlsx", () => {
  it("reads shared, inline, numeric and error cells, with or without a namespace prefix", async () => {
    const zip = new JSZip();
    zip.file("xl/workbook.xml",
      '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' +
      '<sheet name="One" sheetId="1" r:id="rId1"/><sheet name="Two &amp; more" sheetId="2" r:id="rId2"/></sheets></workbook>');
    zip.file("xl/_rels/workbook.xml.rels",
      '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Target="/xl/worksheets/sheet2.xml"/></Relationships>');
    zip.file("xl/sharedStrings.xml", '<sst><si><t>Student</t></si><si><r><t>Mo</t></r><r><t>na</t></r></si></sst>');
    zip.file("xl/worksheets/sheet1.xml",
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="inlineStr"><is><t>x &lt; y</t></is></c></row>' +
      '<row r="3"><c r="A3" t="s"><v>1</v></c><c r="B3"><v>12.5</v></c><c r="C3" t="e"><f>A1/0</f><v>#REF!</v></c></row></sheetData></worksheet>');
    zip.file("xl/worksheets/sheet2.xml",
      '<x:worksheet xmlns:x="main"><x:sheetData><x:row r="1"><x:c r="A1" t="str"><x:v>Month</x:v></x:c><x:c r="B1" s="2"/><x:c r="C1"><x:v>7</x:v></x:c></x:row></x:sheetData></x:worksheet>');
    const wb = await readXlsx(await zip.generateAsync({ type: "uint8array" }));
    expect(Object.keys(wb)).toEqual(["One", "Two & more"]);
    expect(wb.One[0]).toEqual(["Student", null, "x < y"]);
    expect(wb.One[1]).toEqual([]);
    expect(wb.One[2]).toEqual(["Mona", 12.5, "#REF!"]);
    expect(wb["Two & more"][0]).toEqual(["Month", null, 7]);
  });
});
