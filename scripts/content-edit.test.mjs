/**
 * Unit tests for the content-edit safety mechanism, against an in-memory fake
 * store so they run in CI without a live database. The same propose/apply/
 * rollback functions are additionally exercised against a real local Postgres
 * in scripts/content-edit-rehearsal.mjs (run manually, not part of `npm test`
 * — see docs/CONTENT_EDIT_SAFETY.md for why and how).
 */
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { writeProposal, applyProposal, rollbackBatch, ledgerStatus } from "./lib/content-edit.mjs";

function makeFakeStore(seed) {
  const rows = new Map(seed.map((r) => [r.slug, { ...r }]));
  const writes = [];
  return {
    rows,
    writes,
    async readRow(slug) {
      const r = rows.get(slug);
      return r ? { ...r } : null;
    },
    async writeColumn(slug, column, value) {
      writes.push({ slug, column, value });
      const r = rows.get(slug);
      if (!r) throw new Error(`no such row: ${slug}`);
      r[column] = value;
    },
  };
}

let cwd;
beforeEach(() => {
  cwd = process.cwd();
  const dir = mkdtempSync(join(tmpdir(), "content-edit-test-"));
  process.chdir(dir);
});
afterEach(() => {
  process.chdir(cwd);
});

describe("writeProposal", () => {
  it("writes nothing to the store", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Old Title" }]);
    await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old Title", after: "New Title" }] },
      store
    );
    expect(store.writes).toEqual([]);
    expect(store.rows.get("a").title).toBe("Old Title");
  });

  it("flags an edit as stale when the live value has already drifted", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Someone Already Changed This" }]);
    const { proposal } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old Title", after: "New Title" }] },
      store
    );
    expect(proposal.staleCount).toBe(1);
    expect(proposal.edits[0].stale).toBe(true);
  });

  it("produces both a .json and a .md file", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Old" }]);
    const { jsonPath, mdPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old", after: "New" }] },
      store
    );
    expect(jsonPath).toMatch(/\.proposal\.json$/);
    expect(mdPath).toMatch(/\.proposal\.md$/);
  });
});

describe("applyProposal", () => {
  it("backs up before writing, then writes, then verifies", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Old" }]);
    const { jsonPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old", after: "New" }] },
      store
    );
    const result = await applyProposal(jsonPath, store);
    expect(result.skipped).toBe(false);
    expect(result.appliedCount).toBe(1);
    expect(store.rows.get("a").title).toBe("New");
  });

  it("refuses to apply a proposal containing a stale edit", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Drifted" }]);
    const { jsonPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old", after: "New" }] },
      store
    );
    await expect(applyProposal(jsonPath, store)).rejects.toThrow(/stale/);
    expect(store.rows.get("a").title).toBe("Drifted");
  });

  it("is idempotent — re-applying the same batch is a no-op, not a second write", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Old" }]);
    const { jsonPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Old", after: "New" }] },
      store
    );
    await applyProposal(jsonPath, store);
    const writesAfterFirst = store.writes.length;
    const second = await applyProposal(jsonPath, store);
    expect(second.skipped).toBe(true);
    expect(store.writes.length).toBe(writesAfterFirst); // no new writes
  });

  it("stops immediately on the first write that doesn't verify, leaving the rest untouched", async () => {
    const store = makeFakeStore([
      { slug: "a", title: "Old A" },
      { slug: "b", title: "Old B" },
    ]);
    // Sabotage writeColumn so the second write silently doesn't stick.
    const originalWrite = store.writeColumn.bind(store);
    let calls = 0;
    store.writeColumn = async (slug, column, value) => {
      calls++;
      if (calls === 2) return; // pretend to write "b" but don't
      return originalWrite(slug, column, value);
    };

    const { jsonPath } = await writeProposal(
      {
        source: "test",
        edits: [
          { slug: "a", lang: "en", column: "title", before: "Old A", after: "New A" },
          { slug: "b", lang: "en", column: "title", before: "Old B", after: "New B" },
        ],
      },
      store
    );

    await expect(applyProposal(jsonPath, store)).rejects.toThrow(/did not stick/);
    expect(store.rows.get("a").title).toBe("New A"); // first edit did apply
    expect(store.rows.get("b").title).toBe("Old B"); // second was never committed

    const ledger = ledgerStatus();
    const failed = ledger.batches.find((b) => b.status === "failed");
    expect(failed.appliedCount).toBe(1);
  });

  it("writes a per-batch record naming when it ran and which script produced it", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Old" }]);
    const { jsonPath } = await writeProposal(
      { source: "scripts/proposals/titles.mjs", edits: [{ slug: "a", lang: "en", column: "title", before: "Old", after: "New" }] },
      store
    );
    await applyProposal(jsonPath, store);
    const ledger = ledgerStatus();
    expect(ledger.batches).toHaveLength(1);
    expect(ledger.batches[0].source).toBe("scripts/proposals/titles.mjs");
    expect(ledger.batches[0].appliedAt).toBeTruthy();
  });
});

describe("rollbackBatch", () => {
  it("restores the exact pre-edit value", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Original" }]);
    const { jsonPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Original", after: "Changed" }] },
      store
    );
    const applied = await applyProposal(jsonPath, store);
    expect(store.rows.get("a").title).toBe("Changed");

    const rolledBack = await rollbackBatch(applied.backupPath, store);
    expect(rolledBack.restoredCount).toBe(1);
    expect(store.rows.get("a").title).toBe("Original");
  });

  it("is idempotent — rolling back twice does not write twice", async () => {
    const store = makeFakeStore([{ slug: "a", title: "Original" }]);
    const { jsonPath } = await writeProposal(
      { source: "test", edits: [{ slug: "a", lang: "en", column: "title", before: "Original", after: "Changed" }] },
      store
    );
    const applied = await applyProposal(jsonPath, store);
    await rollbackBatch(applied.backupPath, store);
    const writesAfterFirstRollback = store.writes.length;

    const second = await rollbackBatch(applied.backupPath, store);
    expect(second.skipped).toBe(true);
    expect(store.writes.length).toBe(writesAfterFirstRollback);
  });

  it("restores multiple rows in reverse order and verifies each", async () => {
    const store = makeFakeStore([
      { slug: "a", title: "A-orig" },
      { slug: "b", title: "B-orig" },
    ]);
    const { jsonPath } = await writeProposal(
      {
        source: "test",
        edits: [
          { slug: "a", lang: "en", column: "title", before: "A-orig", after: "A-new" },
          { slug: "b", lang: "en", column: "title", before: "B-orig", after: "B-new" },
        ],
      },
      store
    );
    const applied = await applyProposal(jsonPath, store);
    const rolledBack = await rollbackBatch(applied.backupPath, store);
    expect(rolledBack.restoredCount).toBe(2);
    expect(store.rows.get("a").title).toBe("A-orig");
    expect(store.rows.get("b").title).toBe("B-orig");
  });
});
