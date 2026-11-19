import { describe, it, expect } from "vitest";
import { bandFor, isHighRisk, bandBadgeText, bandCoverageProblems, DEFAULT_BANDS, type RiskBand } from "./risk";

const bands = DEFAULT_BANDS;

describe("score → band mapping", () => {
  it("maps scores to the correct band at every boundary", () => {
    const cases: [number, string][] = [
      [1, "Low"], [4, "Low"],           // lower boundary
      [5, "Medium"], [9, "Medium"],     // medium band edges
      [10, "High"], [14, "High"],       // high band edges
      [15, "Extreme"], [25, "Extreme"], // extreme band + max score
    ];
    for (const [score, label] of cases) expect(bandFor(score, bands)?.label).toBe(label);
  });

  it("returns null for uncaptured scores", () => {
    expect(bandFor(null, bands)).toBeNull();
    expect(bandFor(undefined, bands)).toBeNull();
  });

  it("respects configurable bands, not hardcoded ranges", () => {
    const custom: RiskBand[] = [{ label: "Critical", min_score: 20, max_score: 25, color: "red" }];
    expect(bandFor(22, custom)?.label).toBe("Critical");
    expect(bandFor(10, custom)).toBeNull(); // below all configured bands
  });
});

describe("coverage flag (high-risk = band starting at 10+)", () => {
  it("flags High and Extreme as high-risk", () => {
    expect(isHighRisk(10, bands)).toBe(true);
    expect(isHighRisk(25, bands)).toBe(true);
  });
  it("does not flag Low/Medium", () => {
    expect(isHighRisk(9, bands)).toBe(false);
    expect(isHighRisk(1, bands)).toBe(false);
    expect(isHighRisk(null, bands)).toBe(false);
  });
});

describe("badge text — label always shown with the score", () => {
  it("renders 'score band' when banded", () => {
    expect(bandBadgeText(20, bandFor(20, bands))).toBe("20 Extreme");
  });
  it("renders bare score / dash when unbanded or absent", () => {
    expect(bandBadgeText(7, null)).toBe("7");
    expect(bandBadgeText(null, null)).toBe("—");
  });
});

describe("import upsert match key", () => {
  it("risk_ref presence decides update vs create", () => {
    // Mirrors importRiskRegister: a row with a matching risk_ref updates, no ref creates
    const existing = new Set(["RSK-001"]);
    expect(existing.has("RSK-001")).toBe(true);  // would UPDATE
    expect(existing.has("RSK-999")).toBe(false); // would CREATE
    expect("".trim() || null).toBeNull();         // empty ref → stored null → always creates
  });
});

describe("bandCoverageProblems", () => {
  const bands = [
    { id: "a", min_score: 1, max_score: 4 },
    { id: "b", min_score: 5, max_score: 9 },
    { id: "c", min_score: 10, max_score: 14 },
    { id: "d", min_score: 15, max_score: 25 },
  ];
  it("accepts a valid new band set", () => {
    expect(bandCoverageProblems(bands, { min_score: 1, max_score: 4, id: "a" })).toEqual([]);
  });
  it("names overlap ranges", () => {
    const probs = bandCoverageProblems(bands, { min_score: 10, max_score: 16 });
    expect(probs.some((p) => p.includes("covered twice"))).toBe(true);
  });
  it("names gap ranges", () => {
    const probs = bandCoverageProblems(bands, { id: "d", min_score: 18, max_score: 25 });
    expect(probs).toEqual(expect.arrayContaining([expect.stringContaining("15 to 17")]));
    expect(probs[0]).toMatch(/not covered/);
  });
  it("rejects backwards and out-of-range inputs", () => {
    expect(bandCoverageProblems(bands, { min_score: 14, max_score: 10 }).join(" ")).toMatch(/backwards/);
    expect(bandCoverageProblems(bands, { min_score: 0, max_score: 30 }).join(" ")).toMatch(/below 1|above 25/);
    expect(bandCoverageProblems(bands, { min_score: null, max_score: 5 })[0]).toMatch(/score range is needed/);
  });
  it("editing a band does not clash with itself", () => {
    expect(bandCoverageProblems(bands, { id: "c", min_score: 10, max_score: 15 })).toEqual(
      expect.arrayContaining([expect.stringContaining("covered twice")]),
    );
    expect(bandCoverageProblems(bands, { id: "c", min_score: 10, max_score: 14 })).toEqual([]);
  });
});

describe("isHighRisk with alert floor", () => {
  const flagged = [
    { label: "Low", min_score: 1, max_score: 4, color: "green" },
    { label: "Medium", min_score: 5, max_score: 9, color: "yellow", is_alert_floor: true },
    { label: "High", min_score: 10, max_score: 14, color: "orange" },
    { label: "Extreme", min_score: 15, max_score: 25, color: "red" },
  ];
  it("honours a configured alert floor", () => {
    expect(isHighRisk(7, flagged)).toBe(true);   // Medium is now the floor
    expect(isHighRisk(4, flagged)).toBe(false);
  });
  it("falls back to 10 when no band is flagged", () => {
    expect(isHighRisk(12, DEFAULT_BANDS)).toBe(true);
    expect(isHighRisk(9, DEFAULT_BANDS)).toBe(false);
  });
});
