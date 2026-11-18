import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";
import { typeLabel, statusLabel, periodWarnings } from "@/lib/period-validation";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "audit-plan:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const type = new URL(req.url).searchParams.get("type");
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(type ? { period_type: type.toUpperCase() } : {}),
    ...(q.q.status ? { status: q.q.status.toUpperCase() } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["name", "start_date", "updated_at"], "start_date", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows, planCounts] = await Promise.all([
    prisma.annualAuditPlanPeriod.count({ where }),
    prisma.annualAuditPlanPeriod.findMany({ where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize }),
    prisma.annualAuditPlan.groupBy({ by: ["period_id"], where: { deleted: false }, _count: true }),
  ]);
  const plansByPeriod = new Map(planCounts.map((c) => [c.period_id, c._count]));
  const data = rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    type: typeLabel(r.period_type),
    status: statusLabel(r.status),
    start_date: r.start_date,
    end_date: r.end_date,
    plans_using: plansByPeriod.get(r.id) ?? 0,
    warnings: periodWarnings(r),
    updated_at: r.updated_at,
  }));
  return listResponse(auth.requestId, data, total, q.q);
}
