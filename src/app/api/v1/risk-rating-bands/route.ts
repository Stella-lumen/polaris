import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "bands:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["min_score", "sort_order", "updated_at"], "min_score", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows, risks] = await Promise.all([
    prisma.riskRatingBand.count({ where }),
    prisma.riskRatingBand.findMany({ where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize }),
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: auth.org },
      select: { residual_score: true, linked_planned_engagement_id: true },
    }),
  ]);
  const data = rows.map((b) => {
    const inBand = risks.filter((r) => r.residual_score != null && r.residual_score >= (b.min_score ?? 0) && r.residual_score <= (b.max_score ?? 999));
    return {
      id: b.id,
      label: b.label ?? "Not assigned",
      min_score: b.min_score,
      max_score: b.max_score,
      color: b.color,
      sort_order: b.sort_order,
      meaning: b.meaning ?? null,
      expected_response: b.expected_response ?? null,
      status: b.disabled ? "Inactive" : "Active",
      alerts_start_here: !!b.is_alert_floor,
      risks_in_band: inBand.length,
      risks_in_plan: inBand.filter((r) => r.linked_planned_engagement_id).length,
      updated_at: b.updated_at,
    };
  });
  return listResponse(auth.requestId, data, total, q.q);
}
