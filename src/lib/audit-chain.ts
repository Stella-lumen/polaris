import { createHash } from "node:crypto";

/**
 * Tamper-evidence for the audit trail.
 *
 * Every entry's fingerprint is a hash of its own content *plus* the previous
 * entry's fingerprint — a chain. Editing or deleting a middle entry breaks
 * every later link, so "Verify audit trail" can point at the first place the
 * record no longer adds up. Entries written before this feature existed carry
 * no fingerprint and are reported as "predates protection" — never silently
 * trusted, never rewritten.
 */
export function computeFingerprint(input: {
  prev: string | null;
  timestamp: string;
  table: string;
  recordId: string;
  op: string;
  userId: string | null;
  values: string;
}): string {
  return createHash("sha256")
    .update([input.prev ?? "GENESIS", input.timestamp, input.table, input.recordId, input.op, input.userId ?? "system", input.values].join("|"))
    .digest("hex");
}

export type ChainRow = {
  id: string;
  fingerprint: string | null;
  timestamp: Date | null;
  table_name: string | null;
  record_id: string | null;
  operation_type: string | null;
  user_id: string | null;
  new_values: unknown;
};

export type ChainResult =
  | { ok: true; verified: number; unprotected: number }
  | { ok: false; firstBadIndex: number; rowId: string; reason: string; unprotected: number };

/** Rows must be passed oldest-first. */
export function verifyChain(rows: ChainRow[]): ChainResult {
  let prev: string | null = null;
  let unprotected = 0;
  let verified = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r.fingerprint) {
      unprotected++;
      // An unprotected row cannot extend the chain — the next protected row
      // still chains off the last fingerprinted one.
      continue;
    }
    const expected = computeFingerprint({
      prev,
      timestamp: r.timestamp?.toISOString() ?? "",
      table: r.table_name ?? "",
      recordId: r.record_id ?? "",
      op: r.operation_type ?? "",
      userId: r.user_id,
      values: JSON.stringify(r.new_values ?? {}),
    });
    if (expected !== r.fingerprint) {
      return { ok: false, firstBadIndex: i, rowId: r.id, reason: "The entry's contents no longer match its fingerprint — it may have been changed after it was written.", unprotected };
    }
    prev = r.fingerprint;
    verified++;
  }
  return { ok: true, verified, unprotected };
}
