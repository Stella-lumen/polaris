import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "tasks:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const engagement = url.searchParams.get("engagement");
  const assignee = url.searchParams.get("assignee");
  const overdue = url.searchParams.get("overdue");
  const dueBefore = url.searchParams.get("due_before");

  const now = new Date();
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status ? { status: q.q.status.toUpperCase() } : {}),
    ...(engagement ? { engagement_id: engagement } : {}),
    ...(assignee ? { assignee_user_id: assignee } : {}),
    ...(dueBefore ? { due_date: { lte: new Date(dueBefore + "T23:59:59") } } : {}),
    ...(overdue === "true" ? { due_date: { lt: now }, status: { not: "DONE" } } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "due_date", "status"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: {
        r_assignee: { select: { first_name: true, last_name: true } },
        r_engagement: { select: { engagement_name: true } },
      },
      orderBy,
      skip: (q.q.page - 1) * q.q.pageSize,
      take: q.q.pageSize,
    }),
  ]);
  const depRows = await prisma.taskDependency.findMany({ where: { task_id: { in: rows.map((r) => r.id) } } });
  const depMap = new Map<string, string[]>();
  for (const d of depRows) if (d.task_id) depMap.set(d.task_id, [...(depMap.get(d.task_id) ?? []), d.depends_on_task_id ?? ""]);
  return listResponse(
    auth.requestId,
    rows.map((r) => {
      const isOverdue = r.due_date != null && r.due_date < now && r.status !== "DONE";
      return {
        id: r.id,
        engagement_id: r.engagement_id,
        engagement_name: r.r_engagement?.engagement_name ?? null,
        title: r.title,
        stage: r.stage,
        assignee: r.r_assignee ? `${r.r_assignee.first_name} ${r.r_assignee.last_name}` : null,
        assignee_id: r.assignee_user_id,
        supervisor_id: r.supervisor_user_id,
        start_date: isoDate(r.start_date),
        due_date: isoDate(r.due_date),
        priority: r.priority,
        status: r.status,
        review_status: r.review_status,
        planned_hours: r.planned_hours != null ? Number(r.planned_hours) : null,
        is_overdue: isOverdue,
        days_overdue: isOverdue && r.due_date ? Math.floor((now.getTime() - r.due_date.getTime()) / 86400000) : 0,
        escalation_level: r.escalation_level,
        reviewed_by: r.reviewed_by,
        reviewed_at: isoDateTime(r.reviewed_date),
        depends_on: depMap.get(r.id) ?? [],
        risk_id: r.risk_id,
        updated_at: isoDateTime(r.updated_at),
      };
    }),
    total,
    q.q,
  );
}
