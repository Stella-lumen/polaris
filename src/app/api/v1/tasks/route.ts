import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "tasks:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status ? { status: q.q.status.toUpperCase() } : {}),
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
  return listResponse(
    auth.requestId,
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      engagement_id: r.engagement_id,
      engagement_name: r.r_engagement?.engagement_name ?? null,
      stage: r.stage,
      assignee: r.r_assignee ? `${r.r_assignee.first_name} ${r.r_assignee.last_name}` : null,
      due_date: isoDate(r.due_date),
      status: r.status,
      escalated: r.escalated,
      completed_date: isoDate(r.completed_date),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
