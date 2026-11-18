import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "objectives:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["sort_order", "updated_at"], "sort_order", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows] = await Promise.all([
    prisma.strategicObjective.count({ where }),
    prisma.strategicObjective.findMany({
      where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize,
      include: {
        riskAssessments_strategic_objective: {
          where: { deleted: false },
          select: { residual_score: true, linked_planned_engagement_id: true },
        },
      },
    }),
  ]);
  const data = rows.map((o) => {
    const risks = o.riskAssessments_strategic_objective;
    const covered = risks.filter((r) => r.linked_planned_engagement_id).length;
    const top = risks.reduce<number | null>((m, r) => (r.residual_score != null && (m == null || r.residual_score > m) ? r.residual_score : m), null);
    return {
      id: o.id,
      ref: `SO${o.sort_order ?? "?"}`,
      name: o.name ?? "Not assigned",
      description: o.description ?? null,
      sort_order: o.sort_order,
      status: o.disabled ? "Inactive" : "Active",
      linked_risks: risks.length,
      risks_in_plan: covered,
      highest_residual_score: top,
      updated_at: o.updated_at,
    };
  });
  return listResponse(auth.requestId, data, total, q.q);
}
