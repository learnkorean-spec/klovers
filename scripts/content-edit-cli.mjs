#!/usr/bin/env node
/**
 * content-edit-cli.mjs — apply / rollback / status for the content-edit safety
 * mechanism (scripts/lib/content-edit.mjs). See docs/CONTENT_EDIT_SAFETY.md.
 *
 * There is no `propose` subcommand here on purpose: computing what to propose
 * is specific to each edit (titles, FAQ blocks, internal links, body
 * expansion), so each of those gets its own small script that calls
 * writeProposal() with the edits it computed. apply/rollback/status are fully
 * generic and shared by all of them.
 */
import { applyProposal, rollbackBatch, ledgerStatus } from "./lib/content-edit.mjs";
import { createAdminStore } from "./lib/content-edit-supabase-store.mjs";

const [, , command, target] = process.argv;

async function main() {
  if (command === "status") {
    const ledger = ledgerStatus();
    if (ledger.batches.length === 0) {
      console.log("No batches recorded yet.");
      return;
    }
    for (const b of ledger.batches) {
      const rolledBack = b.rolledBackAt ? ` (rolled back ${b.rolledBackAt})` : "";
      console.log(
        `${b.batchId}  ${b.status}  ${b.appliedCount ?? "-"}/${b.totalCount ?? "-"}  ${b.source || ""}${rolledBack}`
      );
    }
    return;
  }

  if (command === "apply") {
    if (!target) throw new Error("usage: node scripts/content-edit-cli.mjs apply <proposal.json>");
    const store = await createAdminStore();
    const result = await applyProposal(target, store);
    if (result.skipped) {
      console.log(`SKIPPED: ${result.reason}`);
      return;
    }
    console.log(
      `Applied batch ${result.batchId}: ${result.appliedCount}/${result.totalCount} edits. ` +
        `Backup: ${result.backupPath}`
    );
    console.log(
      "\nCommit the backup file and ledger.json now, in their own PR, before doing anything " +
        "else — they are the only rollback path until Option B (a revisions table) exists."
    );
    return;
  }

  if (command === "rollback") {
    if (!target) throw new Error("usage: node scripts/content-edit-cli.mjs rollback <backup.json>");
    const store = await createAdminStore();
    const result = await rollbackBatch(target, store);
    if (result.skipped) {
      console.log(`SKIPPED: ${result.reason}`);
      return;
    }
    console.log(`Rolled back batch ${result.batchId}: ${result.restoredCount}/${result.totalCount} entries restored.`);
    return;
  }

  console.error("usage: node scripts/content-edit-cli.mjs <apply|rollback|status> [file]");
  process.exit(1);
}

main().catch((err) => {
  console.error(`\n${err.message}\n`);
  process.exit(1);
});
