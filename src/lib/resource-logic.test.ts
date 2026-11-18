import { describe, it, expect } from "vitest";
import { fmtRand, budgetPercent, budgetWarning, utilisationLabel, workingDaysBetween, timeEntryWarnings, overAllocated, receiptRequired, weekStartOf } from "./resource-logic";

describe("budget", () => {
  it("percent and warnings", () => {
    expect(budgetPercent(112, 100)).toBe(112);
    expect(budgetPercent(50, 0)).toBeNull();
    expect(budgetPercent(50, null)).toBeNull();
    expect(budgetWarning(112)).toBe("This engagement has used 112% of its planned hours.");
    expect(budgetWarning(85)).toContain("nearly over budget");
    expect(budgetWarning(50)).toBeNull();
  });
});

describe("utilisation labels", () => {
  it("maps percent to plain words", () => {
    expect(utilisationLabel(130)).toBe("Over-allocated");
    expect(utilisationLabel(80)).toBe("Balanced");
    expect(utilisationLabel(30)).toBe("Under-used");
    expect(utilisationLabel(null)).toBe("No plan");
  });
});

describe("rand formatting", () => {
  it("formats SA style", () => {
    expect(fmtRand(2270.5)).toBe("R 2 270,50");
    expect(fmtRand(1450)).toBe("R 1 450,00");
  });
});

describe("time entry warnings", () => {
  const holidays = new Set(["2026-04-27"]);
  it("weekend, holiday, >12h, >24h, future", () => {
    const sun = new Date("2026-04-26"); // Sunday
    expect(timeEntryWarnings({ date: sun, hours: 8, holidays, now: new Date("2026-04-26") })[0]).toContain("Sunday");
    const hol = new Date("2026-04-27"); // Monday holiday
    expect(timeEntryWarnings({ date: hol, hours: 8, holidays, now: new Date("2026-04-27") }).join()).toContain("public holiday");
    expect(timeEntryWarnings({ date: new Date("2026-04-28"), hours: 13, holidays, now: new Date("2026-04-28") }).join()).toContain("more than 12");
    expect(timeEntryWarnings({ date: new Date("2026-04-28"), hours: 30, holidays, now: new Date("2026-04-28") }).join()).toContain("cannot be right");
    expect(timeEntryWarnings({ date: new Date("2027-01-01"), hours: 8, holidays, now: new Date("2026-04-28") }).join()).toContain("future");
    expect(timeEntryWarnings({ date: new Date("2026-04-28"), hours: 8, holidays, now: new Date("2026-04-28") })).toHaveLength(0);
  });
});

describe("leave & capacity", () => {
  it("working days excludes weekends and holidays", () => {
    const hol = new Set(["2026-04-27"]); // Mon
    // Mon 27 Apr (hol) through Fri 1 May 2026: workdays Tue-Fri minus Fri 1 May? 1 May is Workers' Day but not in our set
    expect(workingDaysBetween(new Date("2026-04-27"), new Date("2026-05-01"), hol)).toBe(4);
    expect(workingDaysBetween(new Date("2026-04-25"), new Date("2026-04-26"), hol)).toBe(0); // weekend
  });
  it("over-allocation and receipt rule", () => {
    expect(overAllocated(180, 160)).toBe(true);
    expect(overAllocated(100, 160)).toBe(false);
    expect(receiptRequired(600, 500)).toBe(true);
    expect(receiptRequired(500, 500)).toBe(false);
  });
  it("weekStartOf lands on Monday", () => {
    const ws = weekStartOf(new Date(2026, 3, 29)); // Wed Apr 29
    expect(ws.getDay()).toBe(1);
    expect(ws.getDate()).toBe(27);
  });
});
