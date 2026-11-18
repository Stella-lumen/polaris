// Pure validation for audit-plan periods — plain-language reasons.
// Used by create/edit actions and by the page to flag existing records.

export type PeriodLike = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  deleted?: boolean | null;
  period_type?: string | null;
  status?: string | null;
  start_date?: Date | string | null;
  end_date?: Date | string | null;
};

export const PERIOD_TYPES = [
  { value: "FY", label: "Financial year" },
  { value: "QUARTER", label: "Quarter" },
  { value: "SPECIAL", label: "Special review" },
] as const;

export const typeLabel = (v: string | null | undefined) =>
  PERIOD_TYPES.find((t) => t.value === v)?.label ?? "Not assigned";

export const statusLabel = (v: string | null | undefined) =>
  v === "CLOSED" ? "Closed" : v === "ARCHIVED" ? "Archived" : "Open";

const t = (d: Date | string | null | undefined) => (d ? new Date(d).getTime() : null);

/** Plain-words problems for a single period. Empty array = healthy. */
export function periodProblems(p: PeriodLike): string[] {
  const out: string[] = [];
  const s = t(p.start_date);
  const e = t(p.end_date);
  if (s && e && e <= s) out.push("End date is before the start date");
  if (!p.period_type) out.push("Type not set");
  return out;
}

/** Fuller warning list shown on the page — data problems + naming issues. */
export function periodWarnings(p: PeriodLike): string[] {
  const out = periodProblems(p);
  const name = p.name ?? "";
  const s = p.start_date ? new Date(p.start_date) : null;
  const e = p.end_date ? new Date(p.end_date) : null;
  const years = new Set(name.match(/\b(19|20)\d{2}\b/g)?.map(Number) ?? []);
  for (const m of name.matchAll(/\b((?:19|20)\d{2})\/(\d{2})\b/g)) {
    years.add(Number(m[1].slice(0, 2) + m[2])); // "2027/28" implies 2028 too
  }

  if (p.period_type === "QUARTER" && !years.size) out.push("Name does not include a year");
  if (years.size && s && e && !years.has(s.getFullYear()) && !years.has(e.getFullYear()))
    out.push("The year in the name does not match the dates");
  if (p.period_type === "FY" && s && s.getMonth() !== 3) out.push("A financial year usually starts 1 April");
  if (p.period_type === "FY" && e && e.getMonth() !== 2) out.push("A financial year usually ends 31 March");
  if (!p.description?.trim()) out.push("No description");
  return out;
}

/**
 * Validation for create/edit. Returns a plain-language error or null.
 * `siblings` = other non-deleted periods of the same org (excluding the row being edited).
 */
export function validatePeriod(
  input: { period_type?: string | null; status?: string | null; start_date?: Date | string | null; end_date?: Date | string | null },
  siblings: PeriodLike[],
): string | null {
  const s = t(input.start_date);
  const e = t(input.end_date);
  if (s && e && e <= s) return "The end date must be after the start date.";

  const type = input.period_type ?? null;
  if (type) {
    for (const o of siblings) {
      if (o.deleted || o.period_type !== type || o.status === "ARCHIVED") continue;
      const os = t(o.start_date);
      const oe = t(o.end_date);
      if (s == null || e == null || os == null || oe == null) continue;
      if (s <= oe && e >= os) {
        return `This ${typeLabel(type).toLowerCase()} overlaps "${o.name ?? "another period"}". Two periods of the same type cannot cover the same dates.`;
      }
    }
  }

  // Only one financial year may be Open at a time
  if (type === "FY" && (input.status ?? "OPEN") === "OPEN") {
    const other = siblings.find((o) => !o.deleted && o.period_type === "FY" && (o.status ?? "OPEN") === "OPEN");
    if (other) return `Only one financial year can be open at a time — "${other.name ?? "another financial year"}" is already open. Close or archive it first.`;
  }
  return null;
}

/** Status transitions allowed by the Close / Archive / Reopen actions. */
export function canTransition(from: string | null | undefined, to: "CLOSED" | "ARCHIVED" | "OPEN"): boolean {
  const cur = from ?? "OPEN";
  if (to === "OPEN") return cur !== "OPEN";
  if (to === "CLOSED") return cur === "OPEN";
  if (to === "ARCHIVED") return cur !== "ARCHIVED";
  return false;
}
