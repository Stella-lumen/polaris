import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { ReportButton } from "@/components/report-button";
import { FileSpreadsheet } from "lucide-react";

export const instant = false;

const d = (v: Date | null) => (v ? v.toISOString().slice(0, 10) : "");
const flatten = (o: Record<string, unknown>, prefix = ""): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(o).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !(v instanceof Date) && !Array.isArray(v)) {
        if (typeof (v as { toNumber?: () => number }).toNumber === "function") {
          return [[key, Number(v)]];
        }
        return Object.entries(flatten(v as Record<string, unknown>, key));
      }
      return [[key, v instanceof Date ? v.toISOString().slice(0, 10) : v]];
    }),
  );

export default async function ReportsPage() {
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };
  const [engagements, findings, actions, timeEntries, expenses, risks, tasks] = await Promise.all([
    prisma.engagement.findMany({ where: scope, include: { r_engagement_type: true, r_annual_audit_plan: true } }),
    prisma.engagementFindingAndRecommendations.findMany({
      where: scope,
      include: { r_engagement: { select: { engagement_name: true } }, correctiveActions_finding: true },
    }),
    prisma.correctiveAction.findMany({
      where: scope,
      include: { r_finding: { select: { detailed_finding: true } }, r_owner: true },
    }),
    prisma.timeEntry.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.expense.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.riskAssessment.findMany({ where: scope, include: { r_linked_planned_engagement: { select: { name: true } } } }),
    prisma.task.findMany({ where: scope, include: { r_engagement: { select: { engagement_name: true } }, r_assignee: true } }),
  ]);

  const reports: { title: string; desc: string; fileName: string; sheet: string; rows: Record<string, unknown>[] }[] = [
    {
      title: "Engagement Status Report",
      desc: `${engagements.length} engagements — status, stage sign-off dates, budget vs spend`,
      fileName: "engagement-status-report.xlsx",
      sheet: "Engagements",
      rows: engagements.map((e) => flatten({
        ...e,
        r_engagement_type: e.r_engagement_type?.name,
        r_annual_audit_plan: e.r_annual_audit_plan?.name,
        status: e.authorised_date ? "COMPLETED" : e.start_date && e.start_date <= new Date() ? "IN_PROGRESS" : "NOT_STARTED",
      } as Record<string, unknown>)),
    },
    {
      title: "Findings & Recommendations Report",
      desc: `${findings.length} findings — root cause, recommendation, management comment, clearance`,
      fileName: "findings-report.xlsx",
      sheet: "Findings",
      rows: findings.map((f) => flatten({
        ...f,
        r_engagement: f.r_engagement?.engagement_name,
        corrective_actions: f.correctiveActions_finding.length,
        cleared: f.authorised_date ? "YES" : "NO",
      } as Record<string, unknown>)),
    },
    {
      title: "Corrective Action Follow-up Report",
      desc: `${actions.length} actions — owners, due dates, progress, verification`,
      fileName: "corrective-actions-report.xlsx",
      sheet: "Corrective Actions",
      rows: actions.map((a) => flatten({
        ...a,
        r_finding: a.r_finding?.detailed_finding?.slice(0, 100),
        r_owner: a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "",
        overdue: a.due_date && a.due_date < new Date() && a.status !== "VERIFIED" ? "YES" : "NO",
      } as Record<string, unknown>)),
    },
    {
      title: "Resource Utilisation Report",
      desc: `${timeEntries.length} time entries + ${expenses.length} expense claims — hours and spend per engagement/auditor`,
      fileName: "resource-report.xlsx",
      sheet: "Time & Expenses",
      rows: [
        ...timeEntries.map((t) => flatten({
          type: "TIME", work_date: d(t.work_date),
          user: t.r_user ? `${t.r_user.first_name} ${t.r_user.last_name}` : "",
          engagement: t.r_engagement?.engagement_name,
          hours: t.hours, description: t.description,
        })),
        ...expenses.map((e) => flatten({
          type: "EXPENSE", work_date: d(e.expense_date),
          user: e.r_user ? `${e.r_user.first_name} ${e.r_user.last_name}` : "",
          engagement: e.r_engagement?.engagement_name,
          amount: e.amount, description: e.description,
        })),
      ],
    },
    {
      title: "Risk Register Report",
      desc: `${risks.length} risks — inherent vs residual scores, controls, plan linkage`,
      fileName: "risk-register-report.xlsx",
      sheet: "Risk Register",
      rows: risks.map((r) => flatten({ ...r, r_linked_planned_engagement: r.r_linked_planned_engagement?.name })),
    },
    {
      title: "Task Schedule Report",
      desc: `${tasks.length} tasks — assignees, due dates, escalation status`,
      fileName: "task-schedule-report.xlsx",
      sheet: "Tasks",
      rows: tasks.map((t) => flatten({
        ...t,
        r_engagement: t.r_engagement?.engagement_name,
        r_assignee: t.r_assignee ? `${t.r_assignee.first_name} ${t.r_assignee.last_name}` : "",
        overdue: t.due_date && t.due_date < new Date() && t.status !== "DONE" ? "YES" : "NO",
      } as Record<string, unknown>)),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">Reports</h1>
        <p className="text-muted-foreground">Generated report packs — exported to Excel</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {reports.map((r) => (
          <div key={r.fileName} className="flex items-center gap-4 rounded-lg border p-4">
            <FileSpreadsheet className="h-8 w-8 shrink-0 text-green-600" />
            <div className="min-w-0 flex-1">
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
            </div>
            <ReportButton rows={r.rows} sheet={r.sheet} fileName={r.fileName} />
          </div>
        ))}
      </div>
    </div>
  );
}
