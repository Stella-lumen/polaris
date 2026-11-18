/** Pure resource-allocation logic — no DB imports, unit-testable. */

export const fmtRand = (n: number) => {
  const fixed = n.toFixed(2);
  const [int, dec] = fixed.split(".");
  return "R " + int.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "," + dec;
};

export function budgetPercent(used: number, planned: number | null | undefined) {
  if (!planned || planned <= 0) return null;
  return Math.round((used / planned) * 100);
}

export function budgetWarning(percent: number | null): string | null {
  if (percent == null) return null;
  if (percent >= 100) return `This engagement has used ${percent}% of its planned hours.`;
  if (percent >= 80) return `This engagement has used ${percent}% of its planned hours — nearly over budget.`;
  return null;
}

export function utilisationLabel(percent: number | null): string {
  if (percent == null) return "No plan";
  if (percent > 110) return "Over-allocated";
  if (percent >= 60) return "Balanced";
  return "Under-used";
}

/** Working days between two dates (Mon–Fri), minus holiday dates. */
export function workingDaysBetween(start: Date, end: Date, holidays: Set<string>): number {
  let days = 0;
  const d = new Date(start);
  while (d <= end) {
    const dow = d.getDay();
    const key = d.toISOString().slice(0, 10);
    if (dow !== 0 && dow !== 6 && !holidays.has(key)) days++;
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/** Confirmation warnings for a time entry — never blocks. */
export function timeEntryWarnings(opts: {
  date: Date;
  hours: number;
  holidays: Set<string>;
  now?: Date;
}): string[] {
  const w: string[] = [];
  const dow = opts.date.getDay();
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dow];
  if (dow === 0 || dow === 6) w.push(`This date is a ${dayName}. Is this correct?`);
  const key = opts.date.toISOString().slice(0, 10);
  if (opts.holidays.has(key)) w.push("This date is a public holiday. Is this correct?");
  if (opts.hours > 24) w.push("More than 24 hours in one day cannot be right. Please check.");
  else if (opts.hours > 12) w.push(`This is ${opts.hours} hours in one day — more than 12. Is this correct?`);
  if (opts.date > (opts.now ?? new Date())) w.push("This date is in the future. Is this correct?");
  return w;
}

/** Plain-language capacity check: over-allocated if planned > available in the window. */
export function overAllocated(plannedHours: number, availableHours: number): boolean {
  return plannedHours > availableHours;
}

/** Does an expense need a receipt? */
export function receiptRequired(amount: number, limit: number): boolean {
  return amount > limit;
}

/** Weekly bucket for a date — Monday of that week. */
export function weekStartOf(d: Date): Date {
  const w = new Date(d);
  const dow = (w.getDay() + 6) % 7; // Monday=0
  w.setDate(w.getDate() - dow);
  w.setHours(0, 0, 0, 0);
  return w;
}

export const ACTIVITY_TYPES = ["PLANNING", "FIELDWORK", "REPORTING", "FOLLOW_UP", "TRAINING", "ADMIN", "LEAVE"];
export const EXPENSE_CATEGORIES = ["TRAVEL", "ACCOMMODATION", "SUBSISTENCE", "OTHER"];
export const TEAM_ROLES = ["LEAD", "AUDITOR", "REVIEWER"];
export const LEAVE_TYPES = ["ANNUAL", "SICK", "TRAINING", "PUBLIC_HOLIDAY", "OTHER"];
