import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth } from "@/lib/api-auth";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const t = await prisma.engagementType.findFirst({ where: { id, deleted: false, organization_id: auth.org } });
  if (!t) return NextResponse.json({ error: "Engagement type not found" }, { status: 404 });
  const tasks = await prisma.taskTemplate.findMany({
    where: { engagement_type_id: id, deleted: false },
    orderBy: [{ stage: "asc" }, { sort: "asc" }],
  });
  const dt = (t.default_templates as { planning?: string; fieldwork?: string; reporting?: string } | null) ?? {};
  const tplIds = [dt.planning, dt.fieldwork, dt.reporting].filter(Boolean) as string[];
  const [planTpls, reportTpls] = tplIds.length
    ? await Promise.all([
        prisma.planningDocumentTemplate.findMany({ where: { id: { in: tplIds } }, select: { id: true, name: true } }),
        prisma.reportDocumentTemplate.findMany({ where: { id: { in: tplIds } }, select: { id: true, name: true } }),
      ])
    : [[], []];
  const tplRows = [...planTpls, ...reportTpls];
  const tplName = new Map(tplRows.map((r) => [r.id, r.name]));
  return NextResponse.json({
    data: {
      id: t.id,
      name: t.name,
      description: t.description,
      disabled: t.disabled,
      default_hours: t.default_hours,
      default_budget: t.default_budget,
      default_templates: {
        planning: tplName.get(dt.planning ?? "") ?? null,
        fieldwork: tplName.get(dt.fieldwork ?? "") ?? null,
        reporting: tplName.get(dt.reporting ?? "") ?? null,
      },
      checklist: tasks.map((tp) => ({
        title: tp.title,
        stage: tp.stage,
        days_from_start: tp.days_offset,
        default_role: tp.default_role,
        planned_hours: tp.planned_hours,
      })),
      updated_at: t.updated_at,
    },
  });
}
