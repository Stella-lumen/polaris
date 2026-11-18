// Pure delegation rules — no DB imports, unit-testable.
// A delegation lets a delegate PREPARE work on the principal's behalf,
// within a scope and date window. A delegate can never approve anything.

export type DelegationScope =
  | "AUDIT_PLANS"
  | "WORKING_PAPERS"
  | "REPORTS"
  | "RISK_ASSESSMENTS"
  | "ENGAGEMENT";

export const SCOPE_LABELS: Record<string, string> = {
  AUDIT_PLANS: "Audit plans",
  WORKING_PAPERS: "Working papers",
  REPORTS: "Reports",
  RISK_ASSESSMENTS: "Risk assessments",
  ENGAGEMENT: "One engagement",
};

export type DelegationRow = {
  status?: string | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
  scope_kind?: string | null;
  engagement_id?: string | null;
};

export type DelegationState = "active" | "not-yet-active" | "expired" | "revoked";

/** Where the delegation stands right now. */
export function delegationState(d: DelegationRow, now = new Date()): DelegationState {
  const s = d.status ?? "ACTIVE";
  if (s === "REVOKED") return "revoked";
  if (s === "EXPIRED") return "expired";
  if (d.end_date && new Date(d.end_date).getTime() < now.getTime()) return "expired";
  if (d.start_date && new Date(d.start_date).getTime() > now.getTime()) return "not-yet-active";
  return "active";
}

/** Days until the end date — null when there is no end date. */
export function daysToExpiry(d: DelegationRow, now = new Date()): number | null {
  if (!d.end_date) return null;
  return Math.ceil((new Date(d.end_date).getTime() - now.getTime()) / 86400000);
}

/**
 * May this delegation be used to prepare `scope` work (optionally one
 * engagement) right now? Returns null when allowed, or a plain-words reason.
 */
export function delegationAllows(
  d: DelegationRow,
  scope: DelegationScope,
  engagementId?: string | null,
  now = new Date(),
): string | null {
  const state = delegationState(d, now);
  if (state === "revoked") return "This delegation was revoked.";
  if (state === "expired") return "This delegation has expired.";
  if (state === "not-yet-active") return "This delegation has not started yet.";
  const kind = d.scope_kind;
  if (!kind) return "This delegation has no scope set — fix it before preparing work under it.";
  if (kind === "ENGAGEMENT") {
    if (!engagementId || d.engagement_id !== engagementId)
      return "This delegation only covers one specific engagement.";
    return null;
  }
  if (kind !== scope) {
    return `This delegation only covers ${SCOPE_LABELS[kind] ?? "another area"}.`;
  }
  return null;
}

/** A delegate can never approve — full stop, regardless of scope or dates. */
export function delegateCanApprove(): string {
  return "A delegated preparer can prepare work but can never approve it — a supervisor must approve.";
}

/**
 * The rule for approving delegated work: whoever approves must not be the
 * delegate who prepared it. Returns null when allowed, or a plain reason.
 */
export function approvalAllowed(approverUserId: string, preparedByUserId: string | null | undefined): string | null {
  if (preparedByUserId && approverUserId === preparedByUserId) {
    return "The person who prepared this work cannot approve it — a different supervisor must approve.";
  }
  return null;
}

/** Plain-language warning shown on a delegation row, or null when fine. */
export function delegationWarning(d: DelegationRow, now = new Date()): string | null {
  const state = delegationState(d, now);
  if (state === "revoked") return "Revoked — kept for the record.";
  if (state === "expired") return "This delegation has expired.";
  if (!d.scope_kind && !d.end_date) return "No scope or end date set";
  if (!d.scope_kind) return "No scope set";
  if (!d.end_date) return "No end date set — this delegation never expires";
  const days = daysToExpiry(d, now);
  if (days !== null && days <= 14 && days > 0) return `Expires in ${days} day${days === 1 ? "" : "s"}`;
  return null;
}
