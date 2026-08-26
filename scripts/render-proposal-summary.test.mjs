import { describe, it, expect } from "vitest";
import { renderProposalSummary } from "./render-proposal-summary.mjs";

const baseProposal = () => ({
  batchId: "2026-01-01T00-00-00-000Z",
  source: "scripts/proposals/titles.mjs",
  description: "test batch",
  editCount: 2,
  staleCount: 0,
  edits: [
    { slug: "a", lang: "en", column: "title", before: "Old A", after: "New A", stale: false },
    { slug: "b", lang: "ar", column: "title", before: "Old B", after: "New B", stale: false },
  ],
});

describe("renderProposalSummary", () => {
  it("throws on a malformed proposal instead of rendering something misleading", () => {
    expect(() => renderProposalSummary({})).toThrow(/not a valid proposal/);
  });

  it("renders every edit's before and after value", () => {
    const md = renderProposalSummary(baseProposal());
    expect(md).toContain("Old A");
    expect(md).toContain("New A");
    expect(md).toContain("Old B");
    expect(md).toContain("New B");
  });

  it("omits the reason/confidence columns when no edit carries them", () => {
    const md = renderProposalSummary(baseProposal());
    expect(md).not.toMatch(/\| reason \|/);
    expect(md).not.toMatch(/\| confidence \|/);
  });

  it("adds reason and confidence columns when edits carry them", () => {
    const proposal = baseProposal();
    proposal.edits[0].reason = "stuffed keyword prefix";
    proposal.edits[0].confidence = "high";
    const md = renderProposalSummary(proposal);
    expect(md).toMatch(/\| reason \| confidence \|/);
    expect(md).toContain("stuffed keyword prefix");
    expect(md).toContain("high");
  });

  it("surfaces stale edits in their own flagged section with the live value", () => {
    const proposal = baseProposal();
    proposal.staleCount = 1;
    proposal.edits[0].stale = true;
    proposal.edits[0].liveValue = "Someone Already Changed This";
    const md = renderProposalSummary(proposal);
    expect(md).toMatch(/⚠️ Stale/);
    expect(md).toContain("Someone Already Changed This");
  });

  it("escapes pipe characters so a title cannot break the table structure", () => {
    const proposal = baseProposal();
    proposal.edits[0].after = "Title | With Pipe";
    const md = renderProposalSummary(proposal);
    expect(md).toContain("Title \\| With Pipe");
  });

  it("truncates a very long cell rather than letting it distort the table", () => {
    const proposal = baseProposal();
    proposal.edits[0].after = "x".repeat(300);
    const md = renderProposalSummary(proposal);
    expect(md).toContain("x".repeat(157) + "…");
    expect(md).not.toContain("x".repeat(200));
  });
});
