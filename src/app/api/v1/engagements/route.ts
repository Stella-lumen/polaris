import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status === "closed" ? { NOT: { authorised_date: null } } : {}),
    ...(q.q.status === "open" ? { authorised_date: null } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "engagement_name", "start_date"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.engagement.count({ where }),
    prisma.engagement.findMany({
      where,
      include: {
        r_engagement_type: { select: { name: true } },
        engagementAuditors_engagement: {
          where: { deleted: false },
          include: { r_user: { select: { first_name: true, last_name: true } } },
          take: 5,
        },
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
      title: r.engagement_name,
      number: r.engagement_number,
      status: r.authorised_date ? "closed" : "open",
      engagement_type: r.r_engagement_type?.name ?? null,
      lead_auditor:
        r.engagementAuditors_engagement.find((a) => a.position_on_audit === "SENIOR_AUDITOR")?.r_user
          ? `${r.engagementAuditors_engagement.find((a) => a.position_on_audit === "SENIOR_AUDITOR")!.r_user!.first_name} ${r.engagementAuditors_engagement.find((a) => a.position_on_audit === "SENIOR_AUDITOR")!.r_user!.last_name}`
          : null,
      planned_start: isoDate(r.start_date),
      planned_end: isoDate(r.end_date),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
