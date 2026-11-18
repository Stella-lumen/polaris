import { describe, it, expect } from "vitest";
import { allocationBlock, canReviewConflict, isEffective, needsRedeclaration, signingStatus } from "./declarations";

describe("allocationBlock — unsigned people cannot be allocated", () => {
  it("blocks an auditor missing all declarations", () => {
    const err = allocationBlock("Thandi Mokoena", [], ["d1", "d2", "d3"]);
    expect(err).toMatch(/cannot be allocated/);
    expect(err).toMatch(/3 declarations are not signed/);
  });

  it("blocks when even one declaration is missing", () => {
    expect(allocationBlock("Sam", ["d1", "d2"], ["d1", "d2", "d3"])).toBeTruthy();
  });

  it("allows a fully signed auditor", () => {
    expect(allocationBlock("Sam", ["d1", "d2"], ["d1", "d2"])).toBeNull();
  });

  it("disabled declarations are excluded from required ids by the caller — fully signed on the rest passes", () => {
    expect(allocationBlock("Sam", ["d1"], ["d1"])).toBeNull();
  });
});

describe("conflict review — a person cannot approve their own conflict", () => {
  it("rejects self-review", () => {
    expect(canReviewConflict("u1", "u1")).toMatch(/cannot review your own conflict/);
  });
  it("allows a different supervisor", () => {
    expect(canReviewConflict("u2", "u1")).toBeNull();
  });
});

describe("effective signatures", () => {
  it("signed counts, open conflict does not, approved conflict counts", () => {
    expect(isEffective({ declaration_id: "d1", status: "SIGNED" })).toBe(true);
    expect(isEffective({ declaration_id: "d1", status: "CONFLICT" })).toBe(false);
    expect(isEffective({ declaration_id: "d1", status: "APPROVED" })).toBe(true);
    expect(isEffective({ declaration_id: "d1", status: "REASSIGNED" })).toBe(false);
  });

  it("legacy rows (no status) still count as signed", () => {
    expect(isEffective({ declaration_id: "d1", status: null, confirmation_date: new Date() })).toBe(true);
  });
});

describe("status + annual cycle", () => {
  it("x of y math", () => {
    const s = signingStatus(2, 3, [{ declaration_id: "d1", status: "SIGNED" }, { declaration_id: "d2", status: "APPROVED" }]);
    expect(s.label).toBe("2 of 6 declarations signed");
  });
  it("re-declaration after the cycle", () => {
    const old = new Date(Date.now() - 400 * 86400000);
    const recent = new Date(Date.now() - 100 * 86400000);
    expect(needsRedeclaration(old)).toBe(true);
    expect(needsRedeclaration(recent)).toBe(false);
    expect(needsRedeclaration(null)).toBe(false);
  });
});
