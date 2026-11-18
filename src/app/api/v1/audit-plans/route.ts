import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "audit-plan:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status === "authorised" ? { NOT: { authorised_date: null } } : {}),
    ...(q.q.status === "pending" ? { authorised_date: null } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "name"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.annualAuditPlan.count({ where }),
    prisma.annualAuditPlan.findMany({
      where,
      include: {
        r_period: { select: { name: true } },
        _count: { select: { plannedEngagements_annual_audit_plan: true, engagements_annual_audit_plan: true } },
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
      name: r.name,
      description: r.description,
      period: r.r_period?.name ?? null,
      status: (r.status ?? "DRAFT").toLowerCase(),
      committee_signed_at: isoDateTime(r.committee_signed_date),
      version: r.version_no,
      planned_engagements: r._count.plannedEngagements_annual_audit_plan,
      engagements: r._count.engagements_annual_audit_plan,
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
