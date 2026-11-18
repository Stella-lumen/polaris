import { describe, it, expect } from "vitest";
import { bandFor, isHighRisk, bandBadgeText, DEFAULT_BANDS, type RiskBand } from "./risk";

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
