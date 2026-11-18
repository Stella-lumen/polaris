// Pure declaration rules — no DB imports, unit-testable.
// Signing gate, conflict handling and "x of y" status for engagements.

export type DeclStatus = "SIGNED" | "CONFLICT" | "APPROVED" | "REASSIGNED";

export type SigningRow = {
  declaration_id?: string | null;
  engagement_auditor_id?: string | null;
  status?: string | null;
  signed_at?: Date | string | null;
  confirmation_date?: Date | string | null;
};

/** A signing counts if it's signed, or a disclosed conflict that the
 *  supervisor approved with conditions. An open conflict does NOT count. */
export function isEffective(r: SigningRow): boolean {
  const s = r.status ?? "SIGNED";
  return s === "SIGNED" || s === "APPROVED";
}

/**
 * Can this auditor be allocated work on the engagement?
 * `signedIds` = declaration ids the auditor has effectively signed;
 * `requiredIds` = active (non-disabled, non-deleted) declaration ids.
 * Returns null when clear, or a plain-words reason.
 */
export function allocationBlock(
  auditorName: string,
  signedIds: string[],
  requiredIds: string[],
): string | null {
  const missing = requiredIds.filter((id) => !signedIds.includes(id));
  if (!missing.length) return null;
  const n = missing.length;
  return `${auditorName} cannot be allocated — ${n} declaration${n === 1 ? " is" : "s are"} not signed yet. Ask them to sign under Independence assessment first.`;
}

/** "x of y" status per engagement: signed/total active declarations per auditor. */
export function signingStatus(
  auditorCount: number,
  requiredCount: number,
  effectiveRows: SigningRow[],
): { signed: number; total: number; label: string } {
  const total = auditorCount * requiredCount;
  const signed = effectiveRows.length;
  return {
    signed,
    total,
    label: `${signed} of ${total} declaration${total === 1 ? "" : "s"} signed`,
  };
}

/** Conflict review: supervisor decision is only valid if reviewer ≠ discloser. */
export function canReviewConflict(reviewerUserId: string, discloserUserId: string): string | null {
  if (reviewerUserId === discloserUserId) return "You cannot review your own conflict — another supervisor must decide.";
  return null;
}

/** Annual re-declaration: signed declarations older than `days` need renewal. */
export function needsRedeclaration(signedAt: Date | string | null | undefined, days = 365, now = new Date()): boolean {
  if (!signedAt) return false;
  return now.getTime() - new Date(signedAt).getTime() >= days * 86400000;
}
