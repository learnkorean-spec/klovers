/**
 * content-edit.mjs — the propose / apply / rollback mechanism Gate 1 Part 3
 * recommended (Option A, docs/SEO_GATE1_REPORT.md) for editing blog_posts.content
 * and other columns in bulk, without ad-hoc SQL against production and without a
 * schema change.
 *
 * There is no revision/history table (that is Option B, deferred). This file IS
 * the safety net: every apply writes a full backup of the rows it is about to
 * touch before it touches them, verifies every write by reading the row back,
 * stops immediately on the first mismatch, and refuses to double-apply a batch
 * it has already applied. Rollback is symmetrical: it restores exactly what the
 * backup recorded and is itself idempotent.
 *
 * Store-agnostic on purpose. Every function here takes a `store` — an object
 * with `readRow(slug)` and `writeColumn(slug, column, value)` — rather than a
 * Supabase client directly. Production uses `content-edit-supabase-store.mjs`,
 * which respects RLS via an admin sign-in. The rehearsal
 * (scripts/content-edit-rehearsal.mjs) and the unit tests use a Postgres-backed
 * and an in-memory store respectively, exercising this exact same code.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { dirname, join } from "path";
import { createHash } from "crypto";

const EDITS_DIR = "content-edits";
const LEDGER_PATH = join(EDITS_DIR, "ledger.json");

const ensureDir = (path) => mkdirSync(dirname(path), { recursive: true });

const sha256 = (obj) =>
  createHash("sha256").update(JSON.stringify(obj)).digest("hex");

const nowIso = () => new Date().toISOString();

/** Safe for a filename: no colons, no fractional seconds. */
const stampForId = (d = new Date()) => d.toISOString().replace(/[:.]/g, "-");

function readLedger() {
  if (!existsSync(LEDGER_PATH)) return { batches: [] };
  return JSON.parse(readFileSync(LEDGER_PATH, "utf-8"));
}

function writeLedger(ledger) {
  ensureDir(LEDGER_PATH);
  writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n");
}

// ── Propose ──────────────────────────────────────────────────────────────

/**
 * Every edit is `{ slug, lang, column, before, after }`. `writeProposal`
 * re-reads the live value of each row from `store` and refuses to trust the
 * caller's `before` blindly — if the live value has already drifted from what
 * the caller thinks it is (someone edited the row since the proposal's source
 * data was read), that edit is flagged `stale` in the .md rather than silently
 * proposed against a value that no longer exists. Writes nothing to the DB.
 */
export async function writeProposal({ source, description, edits }, store) {
  if (!source) throw new Error("writeProposal: source is required (which script generated this)");
  if (!edits?.length) throw new Error("writeProposal: edits must be a non-empty array");

  const batchId = stampForId();
  const checked = [];
  for (const edit of edits) {
    const { slug, lang, column } = edit;
    if (!slug || !lang || !column || edit.after === undefined) {
      throw new Error(`writeProposal: malformed edit ${JSON.stringify(edit)}`);
    }
    const live = await store.readRow(slug);
    const liveValue = live ? live[column] : undefined;
    const stale = live === null || liveValue !== edit.before;
    checked.push({ ...edit, stale, liveValue: stale ? liveValue : undefined });
  }

  const proposal = {
    batchId,
    createdAt: nowIso(),
    source,
    description: description || "",
    editCount: checked.length,
    staleCount: checked.filter((e) => e.stale).length,
    edits: checked,
  };

  const jsonPath = join(EDITS_DIR, "proposals", `${batchId}.proposal.json`);
  ensureDir(jsonPath);
  writeFileSync(jsonPath, JSON.stringify(proposal, null, 2) + "\n");

  const mdPath = join(EDITS_DIR, "proposals", `${batchId}.proposal.md`);
  writeFileSync(mdPath, renderProposalMarkdown(proposal));

  return { batchId, jsonPath, mdPath, proposal };
}

function renderProposalMarkdown(proposal) {
  const lines = [
    `# Proposed content edit — ${proposal.batchId}`,
    "",
    `**Source:** \`${proposal.source}\``,
    `**Created:** ${proposal.createdAt}`,
    `**Description:** ${proposal.description || "(none given)"}`,
    `**Edits:** ${proposal.editCount} (${proposal.staleCount} stale — see below)`,
    "",
    "Nothing has been written to the database. Review this file, delete any row",
    "you do not want applied from the JSON proposal, then run:",
    "",
    "```",
    `npm run content:apply -- content-edits/proposals/${proposal.batchId}.proposal.json`,
    "```",
    "",
  ];

  if (proposal.staleCount > 0) {
    lines.push(
      "## ⚠️ Stale edits — the live value no longer matches what this proposal expected",
      "",
      "Something changed these rows after this proposal's source data was read.",
      "Applying an edit here would overwrite whatever that change was. Re-check",
      "these before approving anything else in this batch.",
      "",
      "| slug | lang | column | expected before | actual live value |",
      "|---|---|---|---|---|"
    );
    for (const e of proposal.edits.filter((e) => e.stale)) {
      lines.push(
        `| ${e.slug} | ${e.lang} | ${e.column} | ${mdCell(e.before)} | ${mdCell(e.liveValue)} |`
      );
    }
    lines.push("");
  }

  lines.push(
    "## All edits",
    "",
    "| slug | lang | column | before | after |",
    "|---|---|---|---|---|"
  );
  for (const e of proposal.edits) {
    lines.push(`| ${e.slug} | ${e.lang} | ${e.column} | ${mdCell(e.before)} | ${mdCell(e.after)} |`);
  }
  lines.push("");

  return lines.join("\n");
}

const mdCell = (v) => {
  if (v === undefined || v === null) return "*(none)*";
  const s = String(v).replace(/\|/g, "\\|").replace(/\n/g, "<br>");
  return s.length > 120 ? s.slice(0, 117) + "…" : s;
};

// ── Apply ────────────────────────────────────────────────────────────────

/**
 * Applies a proposal file. Order per edit, always: back up the current value,
 * write the new value, read it back and confirm it matches exactly. The first
 * mismatch anywhere stops the whole run — everything applied so far stays
 * applied (it is correct), everything after it is left untouched, and the
 * partial result is recorded plainly in both the backup file and the ledger
 * rather than hidden.
 *
 * Idempotency: a batch that has already been fully applied (matched by the
 * hash of its proposal file, not just its batchId) is refused outright — apply
 * again is a no-op that explains why, never a second write.
 */
export async function applyProposal(proposalPath, store, { source } = {}) {
  const proposal = JSON.parse(readFileSync(proposalPath, "utf-8"));
  const proposalHash = sha256(proposal);

  const ledger = readLedger();
  const already = ledger.batches.find(
    (b) => b.batchId === proposal.batchId && b.proposalHash === proposalHash
  );
  if (already?.status === "applied") {
    return {
      skipped: true,
      reason: `batch ${proposal.batchId} was already applied at ${already.appliedAt} — refusing to double-apply`,
    };
  }

  const stale = proposal.edits.filter((e) => e.stale);
  if (stale.length > 0) {
    throw new Error(
      `applyProposal: ${stale.length} edit(s) in this proposal are marked stale ` +
        `(the live value has drifted since the proposal was written). Re-run ` +
        `writeProposal to refresh before applying. Refusing to apply blind.`
    );
  }

  const batchId = proposal.batchId;
  const backupPath = join(EDITS_DIR, "backups", `${batchId}.backup.json`);
  const backup = {
    batchId,
    appliedAt: nowIso(),
    source: source || proposal.source,
    proposalHash,
    proposalPath,
    entries: [],
    status: "in-progress",
  };
  ensureDir(backupPath);
  writeFileSync(backupPath, JSON.stringify(backup, null, 2) + "\n"); // written before ANY write below

  let appliedCount = 0;
  try {
    for (const edit of proposal.edits) {
      const { slug, lang, column, before, after } = edit;

      // Backed up BEFORE the write, every time — this file is the only
      // rollback path (no revisions table exists).
      backup.entries.push({ slug, lang, column, before, after, appliedAt: nowIso() });
      writeFileSync(backupPath, JSON.stringify(backup, null, 2) + "\n");

      await store.writeColumn(slug, column, after);

      const readBack = await store.readRow(slug);
      if (readBack?.[column] !== after) {
        throw new Error(
          `applyProposal: write did not stick for ${slug}.${column} — wrote ` +
            `${JSON.stringify(after)}, read back ${JSON.stringify(readBack?.[column])}. ` +
            `Stopping. ${appliedCount} edit(s) before this one were applied and verified; ` +
            `everything from here on was not attempted.`
        );
      }
      appliedCount++;
    }
    backup.status = "applied";
  } catch (err) {
    backup.status = "failed";
    backup.error = String(err.message || err);
    backup.appliedCount = appliedCount;
    writeFileSync(backupPath, JSON.stringify(backup, null, 2) + "\n");
    ledger.batches.push({
      batchId,
      proposalHash,
      status: "failed",
      appliedAt: backup.appliedAt,
      source: backup.source,
      backupPath,
      appliedCount,
      totalCount: proposal.edits.length,
    });
    writeLedger(ledger);
    throw err;
  }

  writeFileSync(backupPath, JSON.stringify(backup, null, 2) + "\n");
  ledger.batches.push({
    batchId,
    proposalHash,
    status: "applied",
    appliedAt: backup.appliedAt,
    source: backup.source,
    backupPath,
    appliedCount,
    totalCount: proposal.edits.length,
  });
  writeLedger(ledger);

  return { skipped: false, batchId, backupPath, appliedCount, totalCount: proposal.edits.length };
}

// ── Rollback ─────────────────────────────────────────────────────────────

/**
 * Restores every entry in a backup file to its recorded `before` value, in
 * reverse order (undo the most recent write first — matters only if two
 * entries in the same batch touch the same slug+column, which propose/apply
 * never produce today, but reversing costs nothing and removes the question).
 * Verifies every restore the same way apply verifies every write. Idempotent:
 * rolling back an already-rolled-back batch is a no-op, not a second write.
 */
export async function rollbackBatch(backupPath, store) {
  const backup = JSON.parse(readFileSync(backupPath, "utf-8"));
  const ledger = readLedger();
  const entry = ledger.batches.find((b) => b.backupPath === backupPath || b.batchId === backup.batchId);

  if (entry?.rolledBackAt) {
    return {
      skipped: true,
      reason: `batch ${backup.batchId} was already rolled back at ${entry.rolledBackAt} — refusing to roll back twice`,
    };
  }

  let restoredCount = 0;
  for (const e of [...backup.entries].reverse()) {
    await store.writeColumn(e.slug, e.column, e.before);
    const readBack = await store.readRow(e.slug);
    if (readBack?.[e.column] !== e.before) {
      throw new Error(
        `rollbackBatch: restore did not stick for ${e.slug}.${e.column} — wanted ` +
          `${JSON.stringify(e.before)}, read back ${JSON.stringify(readBack?.[e.column])}. ` +
          `Stopping. ${restoredCount} of ${backup.entries.length} entries were restored before this one.`
      );
    }
    restoredCount++;
  }

  if (entry) {
    entry.rolledBackAt = nowIso();
    entry.restoredCount = restoredCount;
  } else {
    ledger.batches.push({
      batchId: backup.batchId,
      backupPath,
      status: "rolled-back-only",
      rolledBackAt: nowIso(),
      restoredCount,
    });
  }
  writeLedger(ledger);

  return { skipped: false, batchId: backup.batchId, restoredCount, totalCount: backup.entries.length };
}

export function ledgerStatus() {
  return readLedger();
}

export const paths = { EDITS_DIR, LEDGER_PATH };
