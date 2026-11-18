// Pure API-key display + flagging rules — no DB imports, unit-testable.

export type KeyStatus = "Active" | "Revoked" | "Expired";

/** Sentence-case status for the grid. Revoked wins over expired. */
export function keyStatus(
  k: { disabled?: boolean | null; expires_at?: Date | string | null },
  now = new Date(),
): KeyStatus {
  if (k.disabled) return "Revoked";
  if (k.expires_at && new Date(k.expires_at).getTime() < now.getTime()) return "Expired";
  return "Active";
}

const TEST_NAME = /\b(test|demo|temp|verify|ci\b|scope test|sync demo)/i;

/** Flags keys that look like developer/demo leftovers for a human to review. */
export function looksLikeTestKey(name: string | null | undefined, dismissed?: boolean | null): boolean {
  if (dismissed) return false;
  return !!name && TEST_NAME.test(name);
}

/**
 * Rolling 30-day call counter. When the counting window is older than 30 days
 * it resets. Returns the next counter state for a call happening at `now`.
 */
export function bumpCallCount(
  k: { calls_30d?: number | null; calls_30d_since?: Date | string | null },
  now = new Date(),
): { calls_30d: number; calls_30d_since: Date } {
  const since = k.calls_30d_since ? new Date(k.calls_30d_since) : null;
  const windowExpired = !since || now.getTime() - since.getTime() > 30 * 86400_000;
  return {
    calls_30d: (windowExpired ? 0 : k.calls_30d ?? 0) + 1,
    calls_30d_since: windowExpired ? now : since!,
  };
}

/** Plain-words reason an API call was refused — stored on the key's last_error. */
export function refusalReason(kind: "missing" | "unknown" | "revoked" | "expired" | "scope" | "rate_limited", scope?: string): string {
  switch (kind) {
    case "missing": return "A call arrived with no key at all";
    case "unknown": return "The key sent was not recognised";
    case "revoked": return "The key was used after it was revoked";
    case "expired": return "The key was used after it expired";
    case "scope": return `The key was used for data it cannot access${scope ? ` (missing ${scope})` : ""}`;
    case "rate_limited": return "The key made more calls than the limit allows";
  }
}
