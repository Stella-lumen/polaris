import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "risks:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status === "high" ? { residual_score: { gte: 15 } } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "residual_score", "auditable_entity"], "updated_at", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.riskAssessment.count({ where }),
    prisma.riskAssessment.findMany({
      where,
      include: {
        r_linked_planned_engagement: { select: { name: true, reference: true } },
        r_assessed_by: { select: { first_name: true, last_name: true } },
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
      auditable_entity: r.auditable_entity,
      risk_description: r.risk_description,
      risk_category: r.risk_category,
      inherent_likelihood: r.inherent_likelihood,
      inherent_impact: r.inherent_impact,
      inherent_score: r.inherent_score,
      existing_controls: r.existing_controls,
      residual_likelihood: r.residual_likelihood,
      residual_impact: r.residual_impact,
      residual_score: r.residual_score,
      linked_planned_engagement: r.r_linked_planned_engagement?.name ?? null,
      assessed_by: r.r_assessed_by ? `${r.r_assessed_by.first_name} ${r.r_assessed_by.last_name}` : null,
      assessed_date: isoDate(r.assessed_date),
      updated_at: isoDateTime(r.updated_at),
    })),
    total,
    q.q,
  );
}
