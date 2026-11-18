import { describe, expect, it } from "vitest";
import {
  approvalAllowed, daysToExpiry, delegateCanApprove, delegationAllows, delegationState, delegationWarning,
} from "./delegations";

const NOW = new Date("2026-06-15T12:00:00Z");
const inDays = (n: number) => new Date(NOW.getTime() + n * 86400000);

describe("delegationState", () => {
  it("active inside the window", () => {
    expect(delegationState({ status: "ACTIVE", start_date: inDays(-10), end_date: inDays(10) }, NOW)).toBe("active");
  });
  it("expired past the end date even when status says ACTIVE", () => {
    expect(delegationState({ status: "ACTIVE", start_date: inDays(-10), end_date: inDays(-1) }, NOW)).toBe("expired");
  });
  it("not-yet-active before the start date", () => {
    expect(delegationState({ status: "ACTIVE", start_date: inDays(5) }, NOW)).toBe("not-yet-active");
  });
  it("revoked always wins", () => {
    expect(delegationState({ status: "REVOKED", start_date: inDays(-10), end_date: inDays(10) }, NOW)).toBe("revoked");
  });
  it("open-ended delegation stays active", () => {
    expect(delegationState({ status: "ACTIVE", scope_kind: "AUDIT_PLANS" }, NOW)).toBe("active");
  });
});

describe("delegationAllows", () => {
  const base = { status: "ACTIVE", scope_kind: "AUDIT_PLANS", start_date: inDays(-30), end_date: inDays(30) };
  it("allows in-scope in-window work", () => {
    expect(delegationAllows(base, "AUDIT_PLANS", null, NOW)).toBeNull();
  });
  it("blocks an expired delegation — it stops working", () => {
    expect(delegationAllows({ ...base, end_date: inDays(-1) }, "AUDIT_PLANS", null, NOW)).toMatch(/expired/);
  });
  it("blocks a revoked delegation", () => {
    expect(delegationAllows({ ...base, status: "REVOKED" }, "AUDIT_PLANS", null, NOW)).toMatch(/revoked/);
  });
  it("blocks the wrong scope", () => {
    expect(delegationAllows(base, "REPORTS", null, NOW)).toMatch(/only covers/);
  });
  it("blocks a delegation with no scope", () => {
    expect(delegationAllows({ ...base, scope_kind: null }, "AUDIT_PLANS", null, NOW)).toMatch(/no scope/);
  });
  it("engagement-scoped delegation only covers that engagement", () => {
    const d = { ...base, scope_kind: "ENGAGEMENT", engagement_id: "eng-1" };
    expect(delegationAllows(d, "ENGAGEMENT", "eng-1", NOW)).toBeNull();
    expect(delegationAllows(d, "ENGAGEMENT", "eng-2", NOW)).toMatch(/one specific engagement/);
    expect(delegationAllows(d, "AUDIT_PLANS", null, NOW)).toMatch(/one specific engagement/);
  });
});

describe("delegateCanApprove", () => {
  it("a delegate can never approve", () => {
    expect(delegateCanApprove()).toMatch(/never approve/);
  });
});

describe("approvalAllowed — approver is not the preparer", () => {
  it("blocks self-approval", () => {
    expect(approvalAllowed("u1", "u1")).toMatch(/cannot approve/);
  });
  it("allows a different supervisor", () => {
    expect(approvalAllowed("u2", "u1")).toBeNull();
    expect(approvalAllowed("u2", null)).toBeNull();
  });
});

describe("warnings + daysToExpiry", () => {
  it("no scope or end date", () => {
    expect(delegationWarning({ status: "ACTIVE" }, NOW)).toBe("No scope or end date set");
  });
  it("warns within 14 days of expiry", () => {
    expect(delegationWarning({ status: "ACTIVE", scope_kind: "AUDIT_PLANS", end_date: inDays(9) }, NOW)).toMatch(/9 days/);
  });
  it("no warning when far from expiry", () => {
    expect(delegationWarning({ status: "ACTIVE", scope_kind: "AUDIT_PLANS", end_date: inDays(60) }, NOW)).toBeNull();
  });
  it("daysToExpiry counts correctly", () => {
    expect(daysToExpiry({ end_date: inDays(9) }, NOW)).toBe(9);
    expect(daysToExpiry({})).toBeNull();
  });
});
