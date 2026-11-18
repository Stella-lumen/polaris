// One shared date formatter for display. Never mutates stored values —
// pass the raw Date/string and get "1 April 2026" or "25 March 2026, 09:43".

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function toDate(d: Date | string | null | undefined): Date | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** "1 April 2026" */
export function fmtDate(d: Date | string | null | undefined, empty = "Not assigned"): string {
  const dt = toDate(d);
  if (!dt) return empty;
  return `${dt.getDate()} ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

/** "25 March 2026, 09:43" */
export function fmtDateTime(d: Date | string | null | undefined, empty = "Not assigned"): string {
  const dt = toDate(d);
  if (!dt) return empty;
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${fmtDate(dt)}, ${hh}:${mm}`;
}

/** yyyy-mm-dd for <input type="date"> values */
export function inputDate(d: Date | string | null | undefined): string {
  const dt = toDate(d);
  if (!dt) return "";
  return dt.toISOString().slice(0, 10);
}
