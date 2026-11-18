import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "resources:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const engagementId = url.searchParams.get("engagement");
  const auditorId = url.searchParams.get("auditor");

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(engagementId ? { engagement_id: engagementId } : {}),
    ...(auditorId ? { user_id: auditorId } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "start_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const rows = await prisma.engagementTeamMember.findMany({
    where,
    include: {
      r_user: { select: { first_name: true, last_name: true, email: true } },
      r_engagement: {
        select: {
          engagement_name: true, planned_hours: true, planned_expense_budget: true,
          timeEntries_engagement: { where: { deleted: false }, select: { hours: true } },
          expenses_engagement: { where: { deleted: false }, select: { amount: true } },
        },
      },
    },
    orderBy,
    skip: (q.q.page - 1) * q.q.pageSize,
    take: q.q.pageSize,
  });
  const total = await prisma.engagementTeamMember.count({ where });
  return listResponse(
    auth.requestId,
    rows.map((r) => {
      const eng = r.r_engagement;
      const hoursUsed = eng?.timeEntries_engagement.reduce((s, t) => s + Number(t.hours ?? 0), 0) ?? 0;
      const expUsed = eng?.expenses_engagement.reduce((s, t) => s + Number(t.amount ?? 0), 0) ?? 0;
      const plannedH = eng?.planned_hours != null ? Number(eng.planned_hours) : null;
      return {
        id: r.id,
        engagement_id: r.engagement_id,
        engagement_name: eng?.engagement_name ?? null,
        auditor: r.r_user ? `${r.r_user.first_name} ${r.r_user.last_name}` : null,
        auditor_id: r.user_id,
        role: r.role,
        planned_hours: r.planned_hours != null ? Number(r.planned_hours) : null,
        hours_used: hoursUsed,
        engagement_planned_hours: plannedH,
        planned_expenses: eng?.planned_expense_budget != null ? Number(eng.planned_expense_budget) : null,
        expenses_used: expUsed,
        percent_used: plannedH ? Math.round((hoursUsed / plannedH) * 100) : null,
        start_date: isoDate(r.start_date),
        end_date: isoDate(r.end_date),
        updated_at: isoDateTime(r.updated_at),
      };
    }),
    total,
    q.q,
  );
}
