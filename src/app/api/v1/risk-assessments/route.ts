import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom, isoDateTime, isoDate } from "@/lib/api-auth";
import { bandFor, isHighRisk, DEFAULT_BANDS } from "@/lib/risk";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "risks:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const url = new URL(req.url);
  const bandParam = url.searchParams.get("band");
  const category = url.searchParams.get("category");
  const covered = url.searchParams.get("covered");

  const bands = await prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: auth.org }, orderBy: { min_score: "asc" } });
  const bandList = bands.length ? bands : DEFAULT_BANDS;

  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(category ? { risk_category: category } : {}),
    ...(covered === "true" ? { linked_planned_engagement_id: { not: null } } : {}),
    ...(covered === "false" ? { linked_planned_engagement_id: null } : {}),
    ...(q.q.status && q.q.status !== "high" ? { status: q.q.status.toUpperCase() } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["updated_at", "residual_score", "auditable_entity"], "residual_score", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;

  // Band filter needs post-query filtering since it's range-based on configured bands
  let all = await prisma.riskAssessment.findMany({
    where,
    include: {
      r_linked_planned_engagement: { select: { id: true, name: true, reference: true } },
      r_assessed_by: { select: { first_name: true, last_name: true } },
      r_risk_owner: { select: { first_name: true, last_name: true } },
      r_strategic_objective: { select: { name: true } },
    },
    orderBy,
  });
  if (q.q.status === "high") all = all.filter((r) => isHighRisk(r.residual_score, bandList));
  if (bandParam) all = all.filter((r) => bandFor(r.residual_score, bandList)?.label?.toLowerCase() === bandParam.toLowerCase());
  const total = all.length;
  const rows = all.slice((q.q.page - 1) * q.q.pageSize, q.q.page * q.q.pageSize);

  return listResponse(
    auth.requestId,
    rows.map((r) => {
      const iBand = bandFor(r.inherent_score, bandList);
      const rBand = bandFor(r.residual_score, bandList);
      return {
        id: r.id,
        risk_ref: r.risk_ref,
        auditable_entity: r.auditable_entity,
        risk: r.risk_description,
        category: r.risk_category,
        inherent_likelihood: r.inherent_likelihood,
        inherent_impact: r.inherent_impact,
        inherent_score: r.inherent_score,
        inherent_band: iBand?.label ?? null,
        existing_controls: r.existing_controls,
        control_effectiveness: r.control_effectiveness,
        residual_likelihood: r.residual_likelihood,
        residual_impact: r.residual_impact,
        residual_score: r.residual_score,
        residual_band: rBand?.label ?? null,
        risk_owner: r.r_risk_owner ? `${r.r_risk_owner.first_name} ${r.r_risk_owner.last_name}` : null,
        strategic_objective: r.r_strategic_objective?.name ?? null,
        source: r.source,
        status: r.status,
        next_review_date: isoDate(r.next_review_date),
        planned_engagement_id: r.linked_planned_engagement_id,
        planned_engagement: r.r_linked_planned_engagement?.name ?? null,
        covered: !!r.linked_planned_engagement_id,
        assessed_at: isoDateTime(r.assessed_date),
        assessed_by: r.r_assessed_by ? `${r.r_assessed_by.first_name} ${r.r_assessed_by.last_name}` : null,
        updated_at: isoDateTime(r.updated_at),
      };
    }),
    total,
    q.q,
  );
}
