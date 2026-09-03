/**
 * Regression tests for the array-column bug found on 2026-09-03 by the first
 * proposal to touch a non-scalar column (keyword-focus, `blog_posts.keywords`,
 * a Postgres text[]).
 *
 * Symptom: 79 edits, 79 of them reported stale, with the plan table printing
 * the "expected before" and "actual live value" cells as byte-identical.
 * Cause: every comparison in content-edit.mjs was `!==`, which compares array
 * REFERENCES. Two arrays holding the same strings are never `===`.
 *
 * The staleness symptom was the visible half. The dangerous half was
 * applyProposal's read-back check, which would have thrown "write did not
 * stick" on a write that had in fact stuck — aborting a batch with a row
 * already changed and the ledger recording appliedCount 0.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import {
  valuesEqual,
  writeProposal,
  applyProposal,
  rollbackBatch,
} from "./lib/content-edit.mjs";

/** In-memory store with the same shape the Supabase store exposes. Returns a
 * FRESH array on every read, exactly as a database driver does — which is the
 * whole point: a store that handed back the same array object would have
 * hidden this bug. */
function makeStore(rows) {
  const data = new Map(Object.entries(rows));
  return {
    async readRow(slug) {
      const row = data.get(slug);
      if (!row) return null;
      return JSON.parse(JSON.stringify(row));
    },
    async writeColumn(slug, column, value) {
      const row = data.get(slug);
      if (!row) throw new Error(`no such row ${slug}`);
      row[column] = JSON.parse(JSON.stringify(value));
    },
    _raw: data,
  };
}

describe("valuesEqual", () => {
  it("treats arrays with identical contents as equal", () => {
    expect(valuesEqual(["a", "b"], ["a", "b"])).toBe(true);
  });

  it("is order-sensitive — keyword order is meaningful", () => {
    expect(valuesEqual(["a", "b"], ["b", "a"])).toBe(false);
  });

  it("distinguishes different lengths", () => {
    expect(valuesEqual(["a"], ["a", "b"])).toBe(false);
  });

  it("handles empty arrays", () => {
    expect(valuesEqual([], [])).toBe(true);
    expect(valuesEqual([], null)).toBe(false);
  });

  it("keeps strict behaviour for scalars", () => {
    expect(valuesEqual("x", "x")).toBe(true);
    expect(valuesEqual("x", "y")).toBe(false);
    expect(valuesEqual(null, null)).toBe(true);
    expect(valuesEqual(null, undefined)).toBe(false);
    expect(valuesEqual("1", 1)).toBe(false);
  });

  it("does not confuse an array with a scalar", () => {
    expect(valuesEqual(["a"], "a")).toBe(false);
  });
});

describe("array columns end to end", () => {
  let cwd;
  let dir;

  beforeEach(() => {
    cwd = process.cwd();
    dir = mkdtempSync(join(tmpdir(), "content-edit-arr-"));
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    rmSync(dir, { recursive: true, force: true });
  });

  const rows = () => ({
    "post-a": { slug: "post-a", keywords: ["korean grammar", "particles"] },
    "post-b": { slug: "post-b", keywords: ["korean grammar", "verb tense"] },
  });

  const edits = [
    { slug: "post-a", lang: "en", column: "keywords", before: ["korean grammar", "particles"], after: ["particles"] },
    { slug: "post-b", lang: "en", column: "keywords", before: ["korean grammar", "verb tense"], after: ["verb tense"] },
  ];

  it("does not mark an unchanged array column stale", async () => {
    const store = makeStore(rows());
    const { proposal } = await writeProposal(
      { source: "test", description: "array staleness", edits },
      store
    );
    expect(proposal.staleCount).toBe(0);
  });

  it("still detects a genuinely drifted array column", async () => {
    const store = makeStore(rows());
    await store.writeColumn("post-a", "keywords", ["something else entirely"]);
    const { proposal } = await writeProposal(
      { source: "test", description: "array staleness", edits },
      store
    );
    expect(proposal.staleCount).toBe(1);
    expect(proposal.edits.find((e) => e.slug === "post-a").stale).toBe(true);
    expect(proposal.edits.find((e) => e.slug === "post-b").stale).toBe(false);
  });

  it("applies an array-column batch and verifies the read-back", async () => {
    const store = makeStore(rows());
    const { jsonPath } = await writeProposal(
      { source: "test", description: "array apply", edits },
      store
    );
    const result = await applyProposal(jsonPath, store);
    expect(result.skipped).toBe(false);
    expect(result.appliedCount).toBe(2);
    expect((await store.readRow("post-a")).keywords).toEqual(["particles"]);
    expect((await store.readRow("post-b")).keywords).toEqual(["verb tense"]);
  });

  it("rolls an array-column batch back to the exact original arrays", async () => {
    const store = makeStore(rows());
    const { jsonPath, batchId } = await writeProposal(
      { source: "test", description: "array rollback", edits },
      store
    );
    await applyProposal(jsonPath, store);

    const backupPath = join("content-edits", "backups", `${batchId}.backup.json`);
    const backup = JSON.parse(readFileSync(backupPath, "utf-8"));
    expect(backup.status).toBe("applied");

    const result = await rollbackBatch(backupPath, store);
    expect(result.restoredCount).toBe(2);
    expect((await store.readRow("post-a")).keywords).toEqual(["korean grammar", "particles"]);
    expect((await store.readRow("post-b")).keywords).toEqual(["korean grammar", "verb tense"]);
  });

  it("still fails loudly when an array write genuinely does not stick", async () => {
    const store = makeStore(rows());
    const { jsonPath } = await writeProposal(
      { source: "test", description: "array apply", edits },
      store
    );
    store.writeColumn = async () => {}; // swallow the write
    await expect(applyProposal(jsonPath, store)).rejects.toThrow(/did not stick/);
  });
});
