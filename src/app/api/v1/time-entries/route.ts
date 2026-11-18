import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "resources:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const engagement = url.searchParams.get("engagement");
  const auditor = url.searchParams.get("auditor");
  const status = url.searchParams.get("status");
  const activity = url.searchParams.get("activity");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(engagement ? { engagement_id: engagement } : {}),
    ...(auditor ? { user_id: auditor } : {}),
    ...(status ? { status } : {}),
    ...(activity ? { activity_type: activity } : {}),
    ...(from || to ? { work_date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + "T23:59:59") } : {}) } } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "work_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.timeEntry.count({ where }),
    prisma.timeEntry.findMany({
      where,
      include: { r_user: { select: { first_name: true, last_name: true } }, r_engagement: { select: { engagement_name: true } } },
      orderBy,
      skip: (q.q.page - 1) * q.q.pageSize,
      take: q.q.pageSize,
    }),
  ]);
  return listResponse(
    auth.requestId,
    rows.map((r) => ({
      id: r.id,
      auditor: r.r_user ? `${r.r_user.first_name} ${r.r_user.last_name}` : null,
      auditor_id: r.user_id,
      engagement_id: r.engagement_id,
      engagement_name: r.r_engagement?.engagement_name ?? null,
      work_date: isoDate(r.work_date),
      hours: r.hours != null ? Number(r.hours) : null,
      activity_type: r.activity_type,
      status: r.status,
      timesheet_id: r.timesheet_id,
      task_id: r.task_id,
      description: r.description,
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
