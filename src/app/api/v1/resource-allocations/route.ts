import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "resources:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "work_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.timeEntry.count({ where }),
    prisma.timeEntry.findMany({
      where,
      include: {
        r_user: { select: { first_name: true, last_name: true, email: true } },
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
      user: r.r_user ? `${r.r_user.first_name} ${r.r_user.last_name}` : null,
      user_email: r.r_user?.email ?? null,
      engagement_id: r.engagement_id,
      engagement_name: r.r_engagement?.engagement_name ?? null,
      work_date: isoDate(r.work_date),
      hours: r.hours != null ? Number(r.hours) : null,
      description: r.description,
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
