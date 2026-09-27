/**
 * Minimal .xlsx reader for the one-time legacy import.
 *
 * Reads cell VALUES only (cached results for formula cells), which is exactly
 * what the import needs: an error result such as #REF! comes back as the string
 * "#REF!", so the normaliser can refuse it instead of trusting it.
 *
 * Deliberately string-based rather than DOMParser-based so the same code runs
 * in the browser (Import tab) and in Vitest/Node without a DOM. Handles the
 * namespace-prefixed XML some writers emit (<x:row>, <x:c>) as well as the
 * usual unprefixed form. Uses jszip, which is already a dependency.
 */
import JSZip from "jszip";

export type CellValue = string | number | boolean | null;
export type SheetRows = CellValue[][];
export type Workbook = Record<string, SheetRows>;

const P = "(?:[A-Za-z0-9_]+:)?"; // optional namespace prefix

function decodeXml(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function attr(tag: string, name: string): string | null {
  const m = new RegExp(`\\s${name}="([^"]*)"`).exec(tag);
  return m ? decodeXml(m[1]) : null;
}

/** All text of <t> elements inside a fragment (rich-text runs concatenated). */
function textOf(fragment: string): string {
  const re = new RegExp(`<${P}t(?:\\s[^>]*)?>([\\s\\S]*?)</${P}t>`, "g");
  let out = "";
  let m: RegExpExecArray | null;
  while ((m = re.exec(fragment))) out += decodeXml(m[1]);
  return out;
}

/** "AB12" -> 27 (0-based column index). */
export function columnIndex(ref: string): number {
  const letters = /^([A-Z]+)/.exec(ref.toUpperCase())?.[1] ?? "A";
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseSharedStrings(xml: string | null): string[] {
  if (!xml) return [];
  const out: string[] = [];
  const re = new RegExp(`<${P}si(?:\\s[^>]*)?>([\\s\\S]*?)</${P}si>`, "g");
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(textOf(m[1]));
  return out;
}

export function parseSheetXml(xml: string, shared: string[]): SheetRows {
  const rows: SheetRows = [];
  const rowRe = new RegExp(`<${P}row(\\s[^>]*)?(?:/>|>([\\s\\S]*?)</${P}row>)`, "g");
  const cellRe = new RegExp(`<${P}c(\\s[^>]*?)(?:/>|>([\\s\\S]*?)</${P}c>)`, "g");
  const valRe = new RegExp(`<${P}v(?:\\s[^>]*)?>([\\s\\S]*?)</${P}v>`);
  let rm: RegExpExecArray | null;
  let nextRow = 0;
  while ((rm = rowRe.exec(xml))) {
    const rAttr = attr(rm[1] ?? "", "r");
    const rowIdx = rAttr ? parseInt(rAttr, 10) - 1 : nextRow;
    nextRow = rowIdx + 1;
    const cells: CellValue[] = [];
    const body = rm[2] ?? "";
    let cm: RegExpExecArray | null;
    let nextCol = 0;
    cellRe.lastIndex = 0;
    while ((cm = cellRe.exec(body))) {
      const tag = cm[1] ?? "";
      const inner = cm[2] ?? "";
      const ref = attr(tag, "r");
      const col = ref ? columnIndex(ref) : nextCol;
      nextCol = col + 1;
      const t = attr(tag, "t");
      const raw = valRe.exec(inner)?.[1];
      let value: CellValue = null;
      if (t === "inlineStr") value = textOf(inner);
      else if (raw === undefined) value = null;
      else if (t === "s") value = shared[parseInt(raw, 10)] ?? null;
      else if (t === "str" || t === "e") value = decodeXml(raw);
      else if (t === "b") value = raw === "1";
      else {
        const n = Number(raw);
        value = Number.isFinite(n) ? n : decodeXml(raw);
      }
      cells[col] = value;
    }
    for (let i = 0; i < cells.length; i++) if (cells[i] === undefined) cells[i] = null;
    rows[rowIdx] = cells;
  }
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  return rows;
}

function resolveTarget(target: string): string {
  const t = target.replace(/^\//, "");
  return t.startsWith("xl/") ? t : `xl/${t}`;
}

/** Read every sheet of an .xlsx file into arrays of cell values, keyed by sheet name. */
export async function readXlsx(data: ArrayBuffer | Uint8Array): Promise<Workbook> {
  const zip = await JSZip.loadAsync(data);
  const read = async (path: string) => (zip.file(path) ? await zip.file(path)!.async("string") : null);

  const workbookXml = await read("xl/workbook.xml");
  const relsXml = await read("xl/_rels/workbook.xml.rels");
  if (!workbookXml || !relsXml) throw new Error("Not an .xlsx workbook");

  const rels = new Map<string, string>();
  const relRe = new RegExp(`<${P}Relationship(\\s[^>]*)/?>`, "g");
  let m: RegExpExecArray | null;
  while ((m = relRe.exec(relsXml))) {
    const id = attr(m[1], "Id");
    const target = attr(m[1], "Target");
    if (id && target) rels.set(id, resolveTarget(target));
  }

  const shared = parseSharedStrings(await read("xl/sharedStrings.xml"));
  const out: Workbook = {};
  const sheetRe = new RegExp(`<${P}sheet(\\s[^>]*)/?>`, "g");
  while ((m = sheetRe.exec(workbookXml))) {
    const name = attr(m[1], "name");
    const rid = /\s(?:[A-Za-z0-9_]+:)?id="([^"]*)"/.exec(m[1])?.[1];
    const path = rid ? rels.get(rid) : undefined;
    if (!name || !path) continue;
    const xml = await read(path);
    out[name] = xml ? parseSheetXml(xml, shared) : [];
  }
  return out;
}

/** Lower-case hex SHA-256 of the file, used to recognise a re-upload. */
export async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
