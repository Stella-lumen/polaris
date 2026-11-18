import { prisma } from "@/lib/db";
import { apiKeyAuth, apiErr, isoDate, isoDateTime } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiKeyAuth(req, "audit-plan:read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const plan = await prisma.annualAuditPlan.findFirst({
    where: { id, deleted: false, organization_id: auth.org },
    include: { r_period: { select: { name: true } }, r_prepared_by: { select: { first_name: true, last_name: true } }, r_authorised_by: { select: { first_name: true, last_name: true } } },
  });
  if (!plan) return apiErr(auth.requestId, 404, "not_found", "Audit plan not found.");
  const [planned, risks] = await Promise.all([
    prisma.plannedEngagement.findMany({ where: { annual_audit_plan_id: id, deleted: false }, include: { r_engagement_type: { select: { name: true } } } }),
    prisma.riskAssessment.findMany({ where: { deleted: false }, select: { id: true, auditable_entity: true, residual_score: true, linked_planned_engagement_id: true } }),
  ]);
  const plannedIds = new Set(planned.map((p) => p.id));
  const covered = risks.filter((r) => r.linked_planned_engagement_id && plannedIds.has(r.linked_planned_engagement_id));
  return NextResponse.json({
    data: {
      id: plan.id,
      name: plan.name,
      description: plan.description,
      period: plan.r_period?.name ?? null,
      status: (plan.status ?? "DRAFT").toLowerCase(),
      version: plan.version_no,
      prepared_by: plan.r_prepared_by ? `${plan.r_prepared_by.first_name} ${plan.r_prepared_by.last_name}` : null,
      prepared_at: isoDateTime(plan.prepared_date),
      authorised_by: plan.r_authorised_by ? `${plan.r_authorised_by.first_name} ${plan.r_authorised_by.last_name}` : null,
      authorised_at: isoDateTime(plan.authorised_date),
      committee_signed_at: isoDateTime(plan.committee_signed_date),
      coverage: { risks_covered: covered.length, covered: covered.map((r) => ({ id: r.id, entity: r.auditable_entity, score: r.residual_score })) },
      planned_engagements: planned.map((p) => ({
        id: p.id, reference: p.reference, name: p.name, type: p.r_engagement_type?.name ?? null,
        quarter: p.quarter, planned_hours: p.planned_hours != null ? Number(p.planned_hours) : null,
        budget: p.planned_budget != null ? Number(p.planned_budget) : null, status: p.status,
        start: isoDate(p.planned_start_date), end: isoDate(p.planned_end_date),
      })),
    },
    meta: { request_id: auth.requestId },
  });
}
