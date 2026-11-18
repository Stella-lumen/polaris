import { prisma } from "@/lib/db";
import { apiKeyAuth, apiErr, isoDateTime, isoDate } from "@/lib/api-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await apiKeyAuth(req, "engagements:read");
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const e = await prisma.engagement.findFirst({
    where: { id, deleted: false, organization_id: auth.org },
    include: {
      r_engagement_type: { select: { name: true } },
      r_annual_audit_plan: { select: { name: true } },
      r_planned_engagement: { select: { name: true, reference: true, riskAssessments_linked_planned_engagement: { select: { id: true, auditable_entity: true } } } },
      teamMembers_engagement: { where: { deleted: false }, include: { r_user: { select: { first_name: true, last_name: true } } } },
    },
  });
  if (!e) return apiErr(auth.requestId, 404, "not_found", "Engagement not found.");
  const [tasks, findings, actions, papers, hours, expenses] = await Promise.all([
    prisma.task.findMany({ where: { engagement_id: id, deleted: false }, select: { id: true, status: true, due_date: true } }),
    prisma.engagementFindingAndRecommendations.findMany({ where: { engagement_id: id, deleted: false }, select: { id: true } }),
    prisma.correctiveAction.findMany({ where: { deleted: false, r_finding: { engagement_id: id } }, select: { id: true, status: true, due_date: true } }),
    prisma.workingPaper.findMany({ where: { engagement_id: id, deleted: false }, select: { id: true, reference: true, title: true, status: true, preparer_id: true, reviewer_id: true, reviewed_date: true } }),
    prisma.timeEntry.aggregate({ _sum: { hours: true }, where: { engagement_id: id, deleted: false } }),
    prisma.expense.aggregate({ _sum: { amount: true }, where: { engagement_id: id, deleted: false } }),
  ]);
  const now = Date.now();
  const done = tasks.filter((t) => t.status === "DONE").length;
  const lead = e.teamMembers_engagement.find((m) => m.role === "LEAD") ?? e.teamMembers_engagement[0];
  return NextResponse.json({
    data: {
      id: e.id,
      title: e.engagement_name,
      number: e.engagement_number,
      type: e.r_engagement_type?.name ?? null,
      plan: e.r_annual_audit_plan?.name ?? null,
      planned_engagement: e.r_planned_engagement ? { reference: e.r_planned_engagement.reference, name: e.r_planned_engagement.name } : null,
      linked_risks: e.r_planned_engagement?.riskAssessments_linked_planned_engagement ?? [],
      dates: { start: isoDate(e.start_date), end: isoDate(e.end_date) },
      lead: lead?.r_user ? `${lead.r_user.first_name} ${lead.r_user.last_name}` : null,
      team_size: e.teamMembers_engagement.length,
      budget: { planned: e.engagement_budget ? Number(e.engagement_budget) : null, spend: Number(e.engagement_spend ?? 0) + Number(expenses._sum.amount ?? 0), planned_hours: e.planned_hours ? Number(e.planned_hours) : null, logged_hours: Number(hours._sum.hours ?? 0) },
      progress_percent: tasks.length ? Math.round((done / tasks.length) * 100) : null,
      counts: { tasks: tasks.length, tasks_done: done, tasks_overdue: tasks.filter((t) => t.due_date && t.due_date.getTime() < now && t.status !== "DONE").length, findings: findings.length, open_actions: actions.filter((a) => a.status !== "VERIFIED").length, overdue_actions: actions.filter((a) => a.due_date && a.due_date.getTime() < now && a.status !== "VERIFIED").length },
      planning_approval: e.planning_approved_date ? { date: isoDateTime(e.planning_approved_date), by: e.planning_approved_by } : null,
      report_approval: e.report_approved_date ? { status: e.report_status, date: isoDateTime(e.report_approved_date), by: e.report_approved_by } : null,
      working_papers: papers.map((p) => ({ id: p.id, reference: p.reference, title: p.title, status: p.status, reviewed_at: isoDateTime(p.reviewed_date) })),
    },
    meta: { request_id: auth.requestId },
  });
}
