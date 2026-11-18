/** Pure escalation-rule evaluation — no DB imports, unit-testable.
 *  A Verified (closed) action can never escalate, whatever the query returned. */
export function ruleFires(
  trigger: string | null,
  days: number | null,
  ctx: { daysToDue: number | null; daysOverdue: number | null; daysUnverified: number | null; daysInReview?: number | null; status: string | null },
): boolean {
  const d = days ?? 0;
  if (ctx.status === "VERIFIED" || ctx.status === "CLOSED") return false;
  if (trigger === "DAYS_BEFORE_DUE") return ctx.daysToDue != null && ctx.daysToDue >= 0 && ctx.daysToDue <= d && ctx.status !== "IMPLEMENTED";
  if (trigger === "ON_DUE_NOT_DONE") return ctx.daysToDue != null && ctx.daysToDue <= 0 && !["IMPLEMENTED", "VERIFIED"].includes(ctx.status ?? "");
  if (trigger === "DAYS_OVERDUE") return ctx.daysOverdue != null && ctx.daysOverdue >= d && ctx.status !== "IMPLEMENTED";
  if (trigger === "UNVERIFIED_DAYS") return ctx.daysUnverified != null && ctx.daysUnverified >= d && ctx.status === "IMPLEMENTED";
  // Task triggers — a Done task can never escalate.
  if (ctx.status === "DONE" || ctx.status === "APPROVED" || ctx.status === "CLOSED") return false;
  if (trigger === "TASK_DAYS_BEFORE_DUE") return ctx.daysToDue != null && ctx.daysToDue > 0 && ctx.daysToDue <= d;
  if (trigger === "TASK_DUE_PASSED") return ctx.daysOverdue != null && ctx.daysOverdue > 0;
  if (trigger === "TASK_DAYS_OVERDUE") return ctx.daysOverdue != null && ctx.daysOverdue >= d;
  if (trigger === "REVIEW_PENDING_DAYS") return ctx.daysInReview != null && ctx.daysInReview >= d;
  return false;
}
