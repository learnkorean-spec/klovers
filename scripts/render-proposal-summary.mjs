#!/usr/bin/env node
/**
 * render-proposal-summary.mjs — renders a content-edit proposal .json as a
 * Markdown before/after table, for the Apply Content Edits workflow's job
 * summary (.github/workflows/apply-content-edits.yml).
 *
 * Deliberately not the same renderer as writeProposal()'s renderProposalMarkdown()
 * in scripts/lib/content-edit.mjs: that one produces the .proposal.md file
 * committed alongside the .json and only prints slug/lang/column/before/after.
 * This one additionally surfaces `reason` and `confidence` when a proposal's
 * edits carry them (scripts/proposals/titles.mjs does) — a workflow approver
 * clicking Approve on a real production write should see the same review
 * detail a human reviewer saw on the PR, not a stripped-down copy.
 *
 * Pure function of the file on disk: no network, no credentials, no writes.
 * That is what lets the `plan` job in the workflow run without any Supabase
 * credential at all.
 */
import { pathToFileURL } from "node:url";
import { readFileSync } from "fs";

const mdCell = (v) => {
  if (v === undefined || v === null || v === "") return "*(none)*";
  const s = String(v).replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
  return s.length > 160 ? s.slice(0, 157) + "…" : s;
};

/** @param {object} proposal - a parsed *.proposal.json */
export function renderProposalSummary(proposal) {
  const { batchId, source, description, editCount, staleCount, edits } = proposal;
  if (!batchId || !Array.isArray(edits)) {
    throw new Error("renderProposalSummary: not a valid proposal (missing batchId or edits[])");
  }

  const hasReason = edits.some((e) => e.reason);
  const hasConfidence = edits.some((e) => e.confidence);

  const lines = [
    `## Proposed content edit — ${batchId}`,
    "",
    `**Source:** \`${source || "(unknown)"}\``,
    `**Description:** ${description || "(none given)"}`,
    `**Edits:** ${editCount ?? edits.length} (${staleCount ?? 0} stale)`,
    "",
  ];

  const stale = edits.filter((e) => e.stale);
  if (stale.length > 0) {
    lines.push(
      "### ⚠️ Stale — the live value no longer matches what this proposal expected",
      "",
      "`apply` refuses to run while any edit below is stale. Re-run the proposal script " +
        "that generated this file to refresh it before dispatching `apply` again.",
      "",
      "| slug | lang | expected before | actual live value |",
      "|---|---|---|---|"
    );
    for (const e of stale) {
      lines.push(`| ${e.slug} | ${e.lang} | ${mdCell(e.before)} | ${mdCell(e.liveValue)} |`);
    }
    lines.push("");
  }

  const header = ["slug", "lang", "before", "after"];
  if (hasReason) header.push("reason");
  if (hasConfidence) header.push("confidence");

  lines.push(
    "### All edits",
    "",
    `| ${header.join(" | ")} |`,
    `|${header.map(() => "---").join("|")}|`
  );
  for (const e of edits) {
    const row = [e.slug, e.lang, mdCell(e.before), mdCell(e.after)];
    if (hasReason) row.push(mdCell(e.reason));
    if (hasConfidence) row.push(mdCell(e.confidence));
    lines.push(`| ${row.join(" | ")} |`);
  }
  lines.push("");

  return lines.join("\n");
}

async function main() {
  const [, , proposalPath] = process.argv;
  if (!proposalPath) {
    console.error("usage: node scripts/render-proposal-summary.mjs <proposal.json>");
    process.exit(1);
  }
  const proposal = JSON.parse(readFileSync(proposalPath, "utf-8"));
  process.stdout.write(renderProposalSummary(proposal));
}

// Only run as a CLI when invoked directly — importing renderProposalSummary
// for the unit test must not also execute main().
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  });
}
