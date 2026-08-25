#!/usr/bin/env node
/**
 * content-edit-rehearsal.mjs — the required demonstration that propose / apply
 * / rollback actually works against a real Postgres database, not just an
 * in-memory fake. Run manually, once, before this mechanism's PR is reviewed
 * (see docs/CONTENT_EDIT_SAFETY.md). Not part of `npm test` — it needs a real
 * Postgres server, which a normal CI run for this repo does not provide.
 *
 * What it does, against a THROWAWAY local database only:
 *   1. Creates a table shaped like blog_posts (slug, title, content, lang).
 *   2. Seeds three rows with known content.
 *   3. propose: computes edits for two of the three rows, confirms nothing
 *      in the database changed.
 *   4. apply: applies the batch, confirms the two rows changed and the third
 *      did not, confirms a backup file exists.
 *   5. Re-runs apply on the same proposal, confirms it is refused as already
 *      applied (idempotency) and that no further write happens.
 *   6. rollback: restores the two rows, confirms all three rows now read
 *      exactly their original seeded content, byte for byte.
 *   7. Re-runs rollback, confirms it is refused as already rolled back.
 *   8. Drops the throwaway table and disconnects.
 *
 * Requires a reachable Postgres server. Defaults to
 * postgres://postgres@localhost:5432/postgres (the standard local superuser
 * connection) — override with CONTENT_EDIT_REHEARSAL_PG_URL if needed.
 */
import pg from "pg";
import { mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { writeProposal, applyProposal, rollbackBatch, ledgerStatus } from "./lib/content-edit.mjs";
import { createPgStore } from "./lib/content-edit-pg-store.mjs";

const { Client } = pg;
const PG_URL = process.env.CONTENT_EDIT_REHEARSAL_PG_URL || "postgres://postgres@localhost:5432/postgres";
const TABLE = "blog_posts_rehearsal";

const assert = (cond, msg) => {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✓ ${msg}`);
};

async function main() {
  console.log(`Connecting to ${PG_URL} ...`);
  const client = new Client({ connectionString: PG_URL });
  await client.connect();

  const workDir = mkdtempSync(join(tmpdir(), "content-edit-rehearsal-"));
  const originalCwd = process.cwd();
  process.chdir(workDir);
  console.log(`Working directory (proposals/backups/ledger land here): ${workDir}\n`);

  try {
    console.log("── 1. Create throwaway table ──────────────────────────────");
    await client.query(`drop table if exists ${TABLE}`);
    await client.query(`
      create table ${TABLE} (
        slug text primary key,
        lang text not null,
        title text not null,
        content text not null
      )
    `);
    console.log(`  ✓ ${TABLE} created\n`);

    console.log("── 2. Seed three rows ─────────────────────────────────────");
    const seed = [
      { slug: "korean-numbers-guide", lang: "en", title: "Korean Numbers: Two Counting Systems", content: "Original body A" },
      { slug: "korean-food-vocabulary", lang: "en", title: "Korean Food Vocabulary: 60 Words", content: "Original body B" },
      { slug: "korean-slang-words", lang: "en", title: "35 Korean Slang Words", content: "Original body C — untouched" },
    ];
    for (const row of seed) {
      await client.query(`insert into ${TABLE} (slug, lang, title, content) values ($1,$2,$3,$4)`, [
        row.slug,
        row.lang,
        row.title,
        row.content,
      ]);
    }
    console.log(`  ✓ ${seed.length} rows seeded\n`);

    const store = createPgStore(client, TABLE);

    console.log("── 3. propose (dry-run) ───────────────────────────────────");
    const { jsonPath, proposal } = await writeProposal(
      {
        source: "scripts/content-edit-rehearsal.mjs",
        description: "Rehearsal: repair two titles, leave the third alone",
        edits: [
          {
            slug: "korean-numbers-guide",
            lang: "en",
            column: "title",
            before: "Korean Numbers: Two Counting Systems",
            after: "Korean Numbers: Native vs Sino-Korean Systems",
          },
          {
            slug: "korean-food-vocabulary",
            lang: "en",
            column: "title",
            before: "Korean Food Vocabulary: 60 Words",
            after: "60 Korean Food Words Every Beginner Needs",
          },
        ],
      },
      store
    );
    assert(proposal.staleCount === 0, "no edits flagged stale against fresh seed data");

    const untouchedBefore = await store.readRow("korean-slang-words");
    assert(untouchedBefore.title === "35 Korean Slang Words", "propose wrote nothing to the database");
    const targetBefore = await store.readRow("korean-numbers-guide");
    assert(
      targetBefore.title === "Korean Numbers: Two Counting Systems",
      "propose left the target row's live value unchanged too"
    );
    console.log();

    console.log("── 4. apply ────────────────────────────────────────────────");
    const applied = await applyProposal(jsonPath, store);
    assert(applied.skipped === false, "apply actually ran (not skipped)");
    assert(applied.appliedCount === 2, "both edits in the batch applied");

    const row1 = await store.readRow("korean-numbers-guide");
    assert(row1.title === "Korean Numbers: Native vs Sino-Korean Systems", "row 1 title updated");
    const row2 = await store.readRow("korean-food-vocabulary");
    assert(row2.title === "60 Korean Food Words Every Beginner Needs", "row 2 title updated");
    const row3 = await store.readRow("korean-slang-words");
    assert(row3.title === "35 Korean Slang Words", "row 3 (not in the batch) is untouched");

    const ledgerAfterApply = ledgerStatus();
    const batchRecord = ledgerAfterApply.batches.find((b) => b.batchId === applied.batchId);
    assert(batchRecord.status === "applied", "ledger records this batch as applied");
    assert(batchRecord.source === "scripts/content-edit-rehearsal.mjs", "ledger records which script ran it");
    assert(!!batchRecord.appliedAt, "ledger records when it ran");
    console.log();

    console.log("── 5. re-apply the same batch (idempotency guard) ─────────");
    const reapplied = await applyProposal(jsonPath, store);
    assert(reapplied.skipped === true, "second apply of the same batch was refused, not re-run");
    const row1AfterReapply = await store.readRow("korean-numbers-guide");
    assert(
      row1AfterReapply.title === "Korean Numbers: Native vs Sino-Korean Systems",
      "re-running apply did not touch the row a second time"
    );
    console.log();

    console.log("── 6. rollback ─────────────────────────────────────────────");
    const rolledBack = await rollbackBatch(applied.backupPath, store);
    assert(rolledBack.skipped === false, "rollback actually ran");
    assert(rolledBack.restoredCount === 2, "both entries restored");

    const restored1 = await store.readRow("korean-numbers-guide");
    assert(
      restored1.title === seed[0].title,
      `row 1 restored byte-for-byte to its original title ("${seed[0].title}")`
    );
    const restored2 = await store.readRow("korean-food-vocabulary");
    assert(
      restored2.title === seed[1].title,
      `row 2 restored byte-for-byte to its original title ("${seed[1].title}")`
    );
    console.log();

    console.log("── 7. re-run rollback (idempotency guard) ─────────────────");
    const reRolledBack = await rollbackBatch(applied.backupPath, store);
    assert(reRolledBack.skipped === true, "second rollback of the same batch was refused, not re-run");
    console.log();

    console.log("REHEARSAL PASSED — every assertion above held.\n");
  } finally {
    await client.query(`drop table if exists ${TABLE}`);
    await client.end();
    process.chdir(originalCwd);
    rmSync(workDir, { recursive: true, force: true });
    console.log(`Throwaway table dropped. Working directory ${workDir} removed.`);
  }
}

main().catch((err) => {
  console.error(`\nREHEARSAL FAILED: ${err.message}\n`);
  process.exit(1);
});
