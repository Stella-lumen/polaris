import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "followups:read");
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
    prisma.correctiveAction.count({ where }),
    prisma.correctiveAction.findMany({
      where,
      include: {
        r_owner: { select: { first_name: true, last_name: true, email: true } },
        r_finding: { select: { id: true, detailed_finding: true, engagement_id: true } },
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
      finding_id: r.finding_id,
      engagement_id: r.r_finding?.engagement_id ?? null,
      action: r.action_description,
      owner: r.r_owner ? `${r.r_owner.first_name} ${r.r_owner.last_name}` : null,
      due_date: isoDate(r.due_date),
      status: r.status,
      progress: r.progress,
      implemented_date: isoDate(r.implemented_date),
      verified_date: isoDate(r.verified_date),
      overdue: !!(r.due_date && r.due_date < new Date() && r.status !== "VERIFIED"),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
