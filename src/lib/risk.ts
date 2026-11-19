export type RiskBand = {
  label: string | null;
  min_score: number | null;
  max_score: number | null;
  color: string | null;
  /** When set, this band is the "raise high-risk alerts from here" floor. */
  is_alert_floor?: boolean | null;
};

export const DEFAULT_BANDS: RiskBand[] = [
  { label: "Low", min_score: 1, max_score: 4, color: "green" },
  { label: "Medium", min_score: 5, max_score: 9, color: "yellow" },
  { label: "High", min_score: 10, max_score: 14, color: "orange" },
  { label: "Extreme", min_score: 15, max_score: 25, color: "red" },
];

/** Resolve a 1–25 score to its configured band; null when score is absent. */
export function bandFor(score: number | null | undefined, bands: RiskBand[]): RiskBand | null {
  if (score == null) return null;
  return bands.find((b) => score >= (b.min_score ?? 0) && score <= (b.max_score ?? 999)) ?? null;
}

/** High-or-extreme = at or above the band flagged as the alert floor.
 *  Falls back to min_score >= 10 when no band is flagged (back-compat). */
export function isHighRisk(score: number | null | undefined, bands: RiskBand[]): boolean {
  const b = bandFor(score, bands);
  if (!b) return false;
  const floor = bands.find((x) => x.is_alert_floor);
  return (b.min_score ?? 0) >= (floor?.min_score ?? 10);
}

/** Which band is the alert floor, for display ("Raise high-risk alerts from: High"). */
export function alertFloorBand(bands: RiskBand[]): RiskBand | null {
  return bands.find((x) => x.is_alert_floor) ?? null;
}

export type BandCandidate = { min_score: number | null; max_score: number | null; label?: string | null };

/**
 * Validates a proposed set of bands (existing + a changed/new one) for gaps and
 * overlaps across 1–25. Returns a list of plain-words problems, empty when fine.
 * `excludeId` skips the record being edited so it doesn't clash with itself.
 */
export function bandCoverageProblems(
  bands: { id?: string; min_score: number | null; max_score: number | null }[],
  candidate: BandCandidate & { id?: string },
  maxScore = 25,
): string[] {
  const problems: string[] = [];
  const { min_score: min, max_score: max } = candidate;
  if (min == null || max == null) return ["A score range is needed — enter both a lowest and a highest score"];
  if (min < 1) problems.push("The lowest score cannot be below 1");
  if (max > maxScore) problems.push(`The highest score cannot be above ${maxScore}`);
  if (min > max) problems.push(`The range ${min}–${max} is backwards — the lowest score must come first`);
  if (problems.length) return problems;

  const covered = new Array(maxScore + 1).fill(0);
  for (const b of bands) {
    if (candidate.id && b.id === candidate.id) continue;
    if (b.min_score == null || b.max_score == null) continue;
    for (let s = Math.max(1, b.min_score); s <= Math.min(maxScore, b.max_score); s++) covered[s]++;
  }
  for (let s = min; s <= max; s++) covered[s]++;

  // Collect double-covered and uncovered runs as readable ranges
  const runs = (pred: (n: number) => boolean) => {
    const out: string[] = [];
    let start: number | null = null;
    for (let s = 1; s <= maxScore; s++) {
      if (pred(covered[s])) { if (start == null) start = s; }
      else if (start != null) { out.push(start === s - 1 ? `${start}` : `${start} to ${s - 1}`); start = null; }
    }
    if (start != null) out.push(start === maxScore ? `${start}` : `${start} to ${maxScore}`);
    return out;
  };
  for (const r of runs((n) => n > 1)) problems.push(`Scores ${r} are covered twice`);
  for (const r of runs((n) => n === 0)) problems.push(`Scores ${r} are not covered by any band`);
  return problems;
}

/** Tailwind classes per band colour — label is always rendered with the colour. */
export const BAND_CLASSES: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-300",
  yellow: "bg-amber-100 text-amber-800 border-amber-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  red: "bg-red-100 text-red-800 border-red-300",
};

export function bandBadgeClass(band: RiskBand | null): string {
  return `inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${BAND_CLASSES[band?.color ?? ""] ?? "bg-zinc-100 text-zinc-700 border-zinc-300"}`;
}

export function bandBadgeText(score: number | null | undefined, band: RiskBand | null): string {
  if (score == null) return "—";
  return band ? `${score} ${band.label}` : String(score);
}
