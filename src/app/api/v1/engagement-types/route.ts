import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth, listQuery, listResponse, orderByFrom } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const q = listQuery(req, auth.requestId);
  if ("error" in q) return q.error;
  const where = {
    deleted: false as const,
    organization_id: auth.org,
    ...(q.q.status ? { disabled: q.q.status === "disabled" } : {}),
    ...(q.q.updatedSince ? { updated_at: { gt: q.q.updatedSince } } : {}),
  };
  const orderBy = orderByFrom(q.q.sort, ["name", "updated_at"], "name", auth.requestId);
  if (orderBy instanceof NextResponse) return orderBy;
  const [total, rows, engCounts, taskCounts] = await Promise.all([
    prisma.engagementType.count({ where }),
    prisma.engagementType.findMany({ where, orderBy, skip: (q.q.page - 1) * q.q.pageSize, take: q.q.pageSize }),
    prisma.engagement.groupBy({ by: ["engagement_type_id"], where: { deleted: false }, _count: true }),
    prisma.taskTemplate.groupBy({ by: ["engagement_type_id"], where: { deleted: false }, _count: true }),
  ]);
  const engByType = new Map(engCounts.map((c) => [c.engagement_type_id, c._count]));
  const tasksByType = new Map(taskCounts.map((c) => [c.engagement_type_id, c._count]));
  const data = rows.map((r) => {
    const dt = (r.default_templates as { planning?: string; fieldwork?: string; reporting?: string } | null) ?? {};
    return {
      id: r.id,
      name: r.name,
      description: r.description,
      disabled: r.disabled,
      engagements_using: engByType.get(r.id) ?? 0,
      default_templates: [dt.planning, dt.fieldwork, dt.reporting].filter(Boolean).length,
      default_tasks: tasksByType.get(r.id) ?? 0,
      default_hours: r.default_hours,
      default_budget: r.default_budget,
      updated_at: r.updated_at,
    };
  });
  return listResponse(auth.requestId, data, total, q.q);
}
