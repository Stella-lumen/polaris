import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiKeyAuth } from "@/lib/api-auth";

export async function GET(req: Request) {
  const auth = await apiKeyAuth(req, "reports:read");
  if ("error" in auth) return auth.error;
  const org = auth.org;
  const now = new Date();
  const in7 = new Date(now.getTime() + 7 * 86400_000);

  const [
    engTotal, engOpen, engClosed,
    findTotal, findOpen,
    caOpen, caOverdue,
    taskOpen, taskOverdue, taskDueSoon,
    riskTotal, riskHigh,
  ] = await Promise.all([
    prisma.engagement.count({ where: { deleted: false, organization_id: org } }),
    prisma.engagement.count({ where: { deleted: false, organization_id: org, authorised_date: null } }),
    prisma.engagement.count({ where: { deleted: false, organization_id: org, NOT: { authorised_date: null } } }),
    prisma.engagementFindingAndRecommendations.count({ where: { deleted: false, organization_id: org } }),
    prisma.engagementFindingAndRecommendations.count({ where: { deleted: false, organization_id: org, authorised_date: null } }),
    prisma.correctiveAction.count({ where: { deleted: false, organization_id: org, NOT: { status: "VERIFIED" } } }),
    prisma.correctiveAction.count({ where: { deleted: false, organization_id: org, NOT: { status: "VERIFIED" }, due_date: { lt: now } } }),
    prisma.task.count({ where: { deleted: false, organization_id: org, NOT: { status: "COMPLETED" } } }),
    prisma.task.count({ where: { deleted: false, organization_id: org, NOT: { status: "COMPLETED" }, due_date: { lt: now } } }),
    prisma.task.count({ where: { deleted: false, organization_id: org, NOT: { status: "COMPLETED" }, due_date: { gte: now, lte: in7 } } }),
    prisma.riskAssessment.count({ where: { deleted: false, organization_id: org } }),
    prisma.riskAssessment.count({ where: { deleted: false, organization_id: org, residual_score: { gte: 15 } } }),
  ]);

  return NextResponse.json(
    {
      data: {
        engagements: { total: engTotal, open: engOpen, closed: engClosed },
        findings: { total: findTotal, open: findOpen },
        corrective_actions: { open: caOpen, overdue: caOverdue },
        tasks: { open: taskOpen, overdue: taskOverdue, due_within_7_days: taskDueSoon },
        risks: { assessed: riskTotal, high_residual: riskHigh },
      },
    },
    { headers: { "x-request-id": auth.requestId } },
  );
}
