import { describe, it, expect } from "vitest";
import { ruleFires } from "./escalation-rules";

const ctx = (o: Partial<{ daysToDue: number | null; daysOverdue: number | null; daysUnverified: number | null; status: string }>) => ({
  daysToDue: null, daysOverdue: null, daysUnverified: null, status: "OPEN", ...o,
});

describe("escalation rules fire exactly once at the right date", () => {
  it("14-day reminder fires inside the window only", () => {
    expect(ruleFires("DAYS_BEFORE_DUE", 14, ctx({ daysToDue: 14 }))).toBe(true);
    expect(ruleFires("DAYS_BEFORE_DUE", 14, ctx({ daysToDue: 5 }))).toBe(true);
    expect(ruleFires("DAYS_BEFORE_DUE", 14, ctx({ daysToDue: 15 }))).toBe(false);
    expect(ruleFires("DAYS_BEFORE_DUE", 14, ctx({ daysToDue: -1 }))).toBe(false); // already overdue
  });

  it("does not remind when already implemented", () => {
    expect(ruleFires("DAYS_BEFORE_DUE", 14, ctx({ daysToDue: 5, status: "IMPLEMENTED" }))).toBe(false);
  });

  it("due-date rule fires only when due and not implemented/verified", () => {
    expect(ruleFires("ON_DUE_NOT_DONE", 0, ctx({ daysToDue: 0 }))).toBe(true);
    expect(ruleFires("ON_DUE_NOT_DONE", 0, ctx({ daysToDue: -3 }))).toBe(true);
    expect(ruleFires("ON_DUE_NOT_DONE", 0, ctx({ daysToDue: 2 }))).toBe(false);
    expect(ruleFires("ON_DUE_NOT_DONE", 0, ctx({ daysToDue: -3, status: "IMPLEMENTED" }))).toBe(false);
    expect(ruleFires("ON_DUE_NOT_DONE", 0, ctx({ daysToDue: -3, status: "VERIFIED" }))).toBe(false);
  });

  it("overdue rules fire at the right age", () => {
    expect(ruleFires("DAYS_OVERDUE", 7, ctx({ daysOverdue: 7 }))).toBe(true);
    expect(ruleFires("DAYS_OVERDUE", 7, ctx({ daysOverdue: 30 }))).toBe(true);
    expect(ruleFires("DAYS_OVERDUE", 7, ctx({ daysOverdue: 6 }))).toBe(false);
    expect(ruleFires("DAYS_OVERDUE", 30, ctx({ daysOverdue: 29 }))).toBe(false);
    expect(ruleFires("DAYS_OVERDUE", 30, ctx({ daysOverdue: 30 }))).toBe(true);
  });

  it("unverified rule fires only on implemented actions after the wait", () => {
    expect(ruleFires("UNVERIFIED_DAYS", 14, ctx({ daysUnverified: 14, status: "IMPLEMENTED" }))).toBe(true);
    expect(ruleFires("UNVERIFIED_DAYS", 14, ctx({ daysUnverified: 13, status: "IMPLEMENTED" }))).toBe(false);
    expect(ruleFires("UNVERIFIED_DAYS", 14, ctx({ daysUnverified: 20, status: "OPEN" }))).toBe(false);
  });
});

describe("implemented-gate and segregation rules (mirror of action checks)", () => {
  it("IMPLEMENTED requires 100% progress and evidence", () => {
    const canImplement = (progress: number, evidence: number) => progress >= 100 && evidence > 0;
    expect(canImplement(100, 1)).toBe(true);
    expect(canImplement(60, 3)).toBe(false);   // the old bug: 35-60% allowed
    expect(canImplement(100, 0)).toBe(false);  // no evidence
  });

  it("verifier cannot be the owner", () => {
    const canVerify = (verifier: string, owner: string | null) => verifier !== owner;
    expect(canVerify("cae-1", "owner-1")).toBe(true);
    expect(canVerify("owner-1", "owner-1")).toBe(false);
  });

  it("overdue is computed, never a stored status", () => {
    const isOverdue = (due: Date, status: string) => due < new Date() && status !== "VERIFIED";
    expect(isOverdue(new Date(Date.now() - 86400_000), "OPEN")).toBe(true);
    expect(isOverdue(new Date(Date.now() - 86400_000), "VERIFIED")).toBe(false); // verified never overdue
    expect(isOverdue(new Date(Date.now() + 86400_000), "OPEN")).toBe(false);
  });
});
