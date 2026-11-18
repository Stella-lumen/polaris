import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "followups:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const now = new Date();
  const source = url.searchParams.get("source");
  const overdue = url.searchParams.get("overdue");
  const dueBefore = url.searchParams.get("due_before");

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status ? { status: q.q.status.toUpperCase() } : {}),
    ...(source ? { source } : {}),
    ...(dueBefore ? { due_date: { lte: new Date(dueBefore) } } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "due_date", "status"], "due_date", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;

  let all = await prisma.correctiveAction.findMany({
    where,
    include: {
      r_owner: { select: { first_name: true, last_name: true, email: true } },
      r_supervisor: { select: { first_name: true, last_name: true } },
      r_finding: {
        select: {
          id: true, detailed_finding: true, engagement_id: true,
          r_engagement: { select: { r_planned_engagement: { select: { riskAssessments_linked_planned_engagement: { select: { id: true } } } } } },
        },
      },
    },
    orderBy,
  });
  const isOver = (r: (typeof all)[number]) => !!(r.due_date && r.due_date < now && r.status !== "VERIFIED");
  if (overdue === "true") all = all.filter(isOver);
  if (overdue === "false") all = all.filter((r) => !isOver(r));
  const total = all.length;
  const rows = all.slice((q.q.page - 1) * q.q.pageSize, q.q.page * q.q.pageSize);

  return listResponse(
    auth.requestId,
    rows.map((r) => {
      const daysOverdue = r.due_date ? Math.floor((now.getTime() - r.due_date.getTime()) / 86400_000) : null;
      return {
        id: r.id,
        finding_id: r.finding_id,
        engagement_id: r.r_finding?.engagement_id ?? null,
        risk_id: r.r_finding?.r_engagement?.r_planned_engagement?.riskAssessments_linked_planned_engagement?.[0]?.id ?? null,
        source: r.source,
        ag_reference: r.ag_reference,
        ag_report_year: r.ag_report_year,
        corrective_action: r.action_description,
        owner: r.r_owner ? `${r.r_owner.first_name} ${r.r_owner.last_name}` : null,
        supervisor: r.r_supervisor ? `${r.r_supervisor.first_name} ${r.r_supervisor.last_name}` : null,
        due_date: isoDate(r.due_date),
        original_due_date: isoDate(r.original_due_date),
        revision_count: r.revision_count,
        status: r.status,
        percent_done: r.progress,
        is_overdue: isOver(r),
        days_overdue: isOver(r) ? daysOverdue : 0,
        escalation_level: r.escalation_level,
        verified: r.status === "VERIFIED",
        verified_by: r.verified_by_id,
        verified_at: isoDateTime(r.verified_date),
        verification_outcome: r.verification_outcome,
        updated_at: isoDateTime(r.updated_at),
      };
    }),
    total,
    q.q,
  );
}
