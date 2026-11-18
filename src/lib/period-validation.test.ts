import { describe, it, expect } from "vitest";
import { validatePeriod, periodProblems, periodWarnings, canTransition, typeLabel, statusLabel } from "./period-validation";

const d = (s: string) => new Date(s);

describe("validatePeriod", () => {
  it("rejects an end date before the start date", () => {
    const err = validatePeriod({ period_type: "FY", start_date: d("2026-06-30"), end_date: d("2026-03-31") }, []);
    expect(err).toMatch(/end date must be after the start/i);
  });

  it("rejects an end date equal to the start date", () => {
    expect(validatePeriod({ period_type: "FY", start_date: d("2026-04-01"), end_date: d("2026-04-01") }, [])).toBeTruthy();
  });

  it("rejects overlapping periods of the same type", () => {
    const siblings = [{ name: "FY 2026/27", period_type: "FY", start_date: d("2026-04-01"), end_date: d("2027-03-31") }];
    const err = validatePeriod({ period_type: "FY", start_date: d("2026-10-01"), end_date: d("2027-09-30") }, siblings);
    expect(err).toMatch(/overlaps "FY 2026\/27"/);
  });

  it("allows overlapping dates across different types (quarter inside FY)", () => {
    const siblings = [{ name: "FY 2026/27", period_type: "FY", start_date: d("2026-04-01"), end_date: d("2027-03-31") }];
    expect(validatePeriod({ period_type: "QUARTER", start_date: d("2026-04-01"), end_date: d("2026-06-30") }, siblings)).toBeNull();
  });

  it("ignores archived siblings for overlap", () => {
    const siblings = [{ name: "Old FY", period_type: "FY", status: "ARCHIVED", start_date: d("2026-04-01"), end_date: d("2027-03-31") }];
    const err = validatePeriod({ period_type: "FY", start_date: d("2026-04-01"), end_date: d("2027-03-31") }, siblings);
    // overlap ignored but still blocked by the open-FY rule? archived isn't OPEN, so passes
    expect(err).toBeNull();
  });

  it("rejects a second open financial year", () => {
    const siblings = [{ name: "Open FY", period_type: "FY", status: "OPEN", start_date: d("2025-04-01"), end_date: d("2025-12-31") }];
    const err = validatePeriod({ period_type: "FY", status: "OPEN", start_date: d("2026-04-01"), end_date: d("2027-03-31") }, siblings);
    expect(err).toMatch(/only one financial year can be open/i);
  });

  it("allows a second financial year when saved closed", () => {
    const siblings = [{ name: "Open FY", period_type: "FY", status: "OPEN", start_date: d("2025-04-01"), end_date: d("2026-03-31") }];
    expect(validatePeriod({ period_type: "FY", status: "CLOSED", start_date: d("2026-04-01"), end_date: d("2027-03-31") }, siblings)).toBeNull();
  });

  it("allows a clean valid period", () => {
    expect(validatePeriod({ period_type: "QUARTER", start_date: d("2026-04-01"), end_date: d("2026-06-30") }, [])).toBeNull();
  });
});

describe("periodProblems", () => {
  it("flags end-before-start and unset type on existing rows", () => {
    const probs = periodProblems({ period_type: null, start_date: d("2026-06-30"), end_date: d("2026-03-31") });
    expect(probs).toContain("End date is before the start date");
    expect(probs).toContain("Type not set");
  });
  it("returns empty for a healthy period", () => {
    expect(periodProblems({ period_type: "FY", start_date: d("2026-04-01"), end_date: d("2027-03-31") })).toEqual([]);
  });

  it("expands FY-style names — '2027/28 Quarter 4' into 2028 does not warn", () => {
    const probs = periodWarnings({ name: "2027/28 Quarter 4", description: "x", period_type: "QUARTER", start_date: d("2028-01-01"), end_date: d("2028-03-31") });
    expect(probs).not.toContain("The year in the name does not match the dates");
  });

  it("flags a name-year that does not match the dates", () => {
    const probs = periodWarnings({ name: "Quarter 4 2025", description: "x", period_type: "QUARTER", start_date: d("2026-01-01"), end_date: d("2026-03-31") });
    expect(probs).toContain("The year in the name does not match the dates");
  });
});

describe("status + labels", () => {
  it("transition rules", () => {
    expect(canTransition("OPEN", "CLOSED")).toBe(true);
    expect(canTransition("CLOSED", "OPEN")).toBe(true);
    expect(canTransition("CLOSED", "CLOSED")).toBe(false);
    expect(canTransition("OPEN", "ARCHIVED")).toBe(true);
  });
  it("labels", () => {
    expect(typeLabel("FY")).toBe("Financial year");
    expect(typeLabel(null)).toBe("Not assigned");
    expect(statusLabel("ARCHIVED")).toBe("Archived");
    expect(statusLabel(null)).toBe("Open");
  });
});
