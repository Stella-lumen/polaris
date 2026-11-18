/** Pure escalation-rule evaluation — no DB imports, unit-testable.
 *  A Verified (closed) action can never escalate, whatever the query returned. */
export function ruleFires(
  trigger: string | null,
  days: number | null,
  ctx: { daysToDue: number | null; daysOverdue: number | null; daysUnverified: number | null; status: string | null },
): boolean {
  const d = days ?? 0;
  if (ctx.status === "VERIFIED") return false;
  if (trigger === "DAYS_BEFORE_DUE") return ctx.daysToDue != null && ctx.daysToDue >= 0 && ctx.daysToDue <= d && ctx.status !== "IMPLEMENTED";
  if (trigger === "ON_DUE_NOT_DONE") return ctx.daysToDue != null && ctx.daysToDue <= 0 && !["IMPLEMENTED", "VERIFIED"].includes(ctx.status ?? "");
  if (trigger === "DAYS_OVERDUE") return ctx.daysOverdue != null && ctx.daysOverdue >= d && ctx.status !== "IMPLEMENTED";
  if (trigger === "UNVERIFIED_DAYS") return ctx.daysUnverified != null && ctx.daysUnverified >= d && ctx.status === "IMPLEMENTED";
  return false;
}
