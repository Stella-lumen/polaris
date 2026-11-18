export type RiskBand = { label: string | null; min_score: number | null; max_score: number | null; color: string | null };

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

/** High-or-extreme = band starting at 10+ (config-driven, not label-driven). */
export function isHighRisk(score: number | null | undefined, bands: RiskBand[]): boolean {
  const b = bandFor(score, bands);
  return !!b && (b.min_score ?? 0) >= 10;
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
