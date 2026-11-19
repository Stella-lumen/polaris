// Period presets and shared filter helpers for the report catalogue.
// Financial year = April to March (SA government year).

export type PeriodRange = { from: Date | null; to: Date | null; label: string };

export const PERIOD_OPTIONS = [
  { value: "fy", label: "This financial year" },
  { value: "q1", label: "Quarter 1 (Apr–Jun)" },
  { value: "q2", label: "Quarter 2 (Jul–Sep)" },
  { value: "q3", label: "Quarter 3 (Oct–Dec)" },
  { value: "q4", label: "Quarter 4 (Jan–Mar)" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom dates" },
];

/** April–March FY. FY2026/27 = 2026-04-01 → 2027-03-31. */
export function fyStart(date = new Date()): Date {
  const y = date.getFullYear();
  return date.getMonth() >= 3 ? new Date(y, 3, 1) : new Date(y - 1, 3, 1);
}

export function fyLabel(date = new Date()): string {
  const s = fyStart(date).getFullYear();
  return `FY ${s}/${String(s + 1).slice(2)}`;
}

export function periodRange(period: string | undefined, from?: string, to?: string): PeriodRange {
  const now = new Date();
  const fy = fyStart(now);
  const end = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
  switch (period) {
    case "q1": return { from: fy, to: end(new Date(fy.getFullYear(), 5, 1)), label: "Quarter 1 (Apr–Jun)" };
    case "q2": return { from: new Date(fy.getFullYear(), 6, 1), to: end(new Date(fy.getFullYear(), 8, 1)), label: "Quarter 2 (Jul–Sep)" };
    case "q3": return { from: new Date(fy.getFullYear(), 9, 1), to: end(new Date(fy.getFullYear(), 11, 1)), label: "Quarter 3 (Oct–Dec)" };
    case "q4": return { from: new Date(fy.getFullYear() + 1, 0, 1), to: end(new Date(fy.getFullYear() + 1, 2, 1)), label: "Quarter 4 (Jan–Mar)" };
    case "month": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: end(from), label: from.toLocaleString("en-ZA", { month: "long", year: "numeric" }) };
    }
    case "custom": {
      const f = from ? new Date(from) : null;
      const t = to ? new Date(to) : null;
      return {
        from: f && !isNaN(+f) ? f : null,
        to: t && !isNaN(+t) ? new Date(t.getFullYear(), t.getMonth(), t.getDate(), 23, 59, 59) : null,
        label: [from, to].filter(Boolean).join(" to ") || "Custom dates",
      };
    }
    default: {
      const to2 = new Date(fy.getFullYear() + 1, 2, 31, 23, 59, 59);
      return { from: fy, to: to2, label: fyLabel(now) };
    }
  }
}

/** true when d falls inside the range (null bounds = unbounded). */
export const inPeriod = (d: Date | null | undefined, r: PeriodRange) =>
  !!d && (!r.from || d >= r.from) && (!r.to || d <= r.to);

/** simple equality filter — empty value means "all". */
export const match = (value: string | null | undefined, filter: string | undefined) =>
  !filter || filter === "all" || (value ?? "") === filter;

/** free-text search across all string values of a row. */
export const searchRow = (row: Record<string, unknown>, q: string | undefined) => {
  const s = q?.trim().toLowerCase();
  if (!s) return true;
  return Object.values(row).some((v) => typeof v === "string" && v.toLowerCase().includes(s));
};

export const fmtDate = (d: Date | null | undefined) =>
  d ? d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";

export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "" : `R ${n.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const daysOverdue = (due: Date | null | undefined) =>
  due && due.getTime() < Date.now() ? Math.floor((Date.now() - due.getTime()) / 86400000) : 0;

/** ageing bucket used by follow-up reports and their charts */
export function ageingBand(due: Date | null | undefined, done: boolean): string {
  if (done) return "Done";
  const d = daysOverdue(due);
  if (!due) return "No due date";
  if (d <= 0) return "Not yet due";
  if (d <= 30) return "1–30 days late";
  if (d <= 60) return "31–60 days late";
  if (d <= 90) return "61–90 days late";
  return "Over 90 days late";
}
