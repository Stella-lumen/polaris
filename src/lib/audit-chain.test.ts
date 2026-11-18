import { describe, it, expect } from "vitest";
import { computeFingerprint, verifyChain, type ChainRow } from "./audit-chain";

const row = (i: number, over: Partial<ChainRow> = {}): ChainRow => ({
  id: `row-${i}`,
  timestamp: new Date(`2026-01-0${i}T10:00:00Z`),
  table_name: "Tasks",
  record_id: `task-${i}`,
  operation_type: "UPDATE",
  user_id: "user-1",
  new_values: { status: "open" },
  fingerprint: null,
  ...over,
});

/** Builds a valid chain of n rows. */
const chain = (n: number) => {
  const rows = Array.from({ length: n }, (_, i) => row(i + 1));
  let prev: string | null = null;
  for (const r of rows) {
    r.fingerprint = computeFingerprint({
      prev,
      timestamp: r.timestamp!.toISOString(),
      table: r.table_name!,
      recordId: r.record_id!,
      op: r.operation_type!,
      userId: r.user_id,
      values: JSON.stringify(r.new_values),
    });
    prev = r.fingerprint;
  }
  return rows;
};

describe("audit trail tamper chain", () => {
  it("verifies an intact chain", () => {
    const r = verifyChain(chain(5));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.verified).toBe(5);
  });

  it("detects an edited entry — the change breaks the chain at that row", () => {
    const rows = chain(5);
    rows[2].new_values = { status: "tampered" }; // attacker edits stored content
    const r = verifyChain(rows);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.firstBadIndex).toBe(2);
  });

  it("detects a deleted middle entry — the next row's chain link no longer resolves", () => {
    const rows = chain(5);
    rows.splice(2, 1); // attacker removes a row entirely
    const r = verifyChain(rows);
    expect(r.ok).toBe(false);
  });

  it("detects a rewritten fingerprint", () => {
    const rows = chain(3);
    rows[1].fingerprint = "0".repeat(64);
    expect(verifyChain(rows).ok).toBe(false);
  });

  it("old entries without fingerprints are reported, not silently trusted", () => {
    const rows = [row(1), ...chain(3)];
    const r = verifyChain(rows);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.unprotected).toBe(1);
      expect(r.verified).toBe(3);
    }
  });
});
