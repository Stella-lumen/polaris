import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { ReportsClient, type ReportDef } from "@/components/reports-client";

export const instant = false;

const d = (v: Date | null | undefined) => (v ? new Date(v).toISOString().slice(0, 10) : "");
const when = (v: Date | null | undefined) =>
  v ? new Date(v).toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const kv = (o: unknown) =>
  o && typeof o === "object"
    ? Object.entries(o as Record<string, unknown>).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" · ")
    : "";

export default async function ReportsPage() {
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };
  const [auditLogs, users, engagements, findings, actions, timeEntries, expenses, risks, tasks] = await Promise.all([
    prisma.auditLog.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID }, orderBy: { timestamp: "desc" }, take: 500 }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, first_name: true, last_name: true, email: true } }),
    prisma.engagement.findMany({ where: scope, include: { r_engagement_type: true, r_annual_audit_plan: true } }),
    prisma.engagementFindingAndRecommendations.findMany({ where: scope, include: { r_engagement: { select: { engagement_name: true } }, correctiveActions_finding: true } }),
    prisma.correctiveAction.findMany({ where: scope, include: { r_finding: { select: { detailed_finding: true } }, r_owner: true } }),
    prisma.timeEntry.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.expense.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.riskAssessment.findMany({ where: scope, include: { r_linked_planned_engagement: { select: { name: true } } } }),
    prisma.task.findMany({ where: scope, include: { r_engagement: { select: { engagement_name: true } }, r_assignee: true } }),
  ]);
  const userById = new Map(users.map((u) => [u.id, u]));
  const nameOf = (id: string | null | undefined) => {
    const u = id ? userById.get(id) : undefined;
    return u ? `${u.first_name} ${u.last_name}` : "Unknown";
  };

  const reports: ReportDef[] = [
    {
      id: "system-audit-trail",
      title: "System audit trail",
      description: "Who did what in the app — sign-ins, uploads, exports, settings and deletions.",
      userKey: "email",
      columns: [
        { key: "when", label: "WHEN" },
        { key: "user", label: "USER" },
        { key: "email", label: "EMAIL" },
        { key: "action", label: "ACTION" },
        { key: "details", label: "DETAILS" },
      ],
      rows: auditLogs.map((l) => ({
        when: when(l.timestamp),
        user: nameOf(l.user_id) !== "Unknown" ? nameOf(l.user_id) : (l.query ?? "system"),
        email: userById.get(l.user_id ?? "")?.email ?? "",
        action: `${l.operation_type?.toLowerCase() ?? ""}_${(l.table_name ?? "").toLowerCase().replaceAll(" ", "_")}`,
        details: kv(l.new_values) || kv(l.original_values),
      })),
    },
    {
      id: "engagement-status",
      title: "Engagement Status Report",
      description: "All engagements — type, plan, status, dates, budget vs spend.",
      columns: [
        { key: "name", label: "ENGAGEMENT" }, { key: "number", label: "NUMBER" },
        { key: "type", label: "TYPE" }, { key: "plan", label: "AUDIT PLAN" },
        { key: "status", label: "STATUS" }, { key: "start", label: "START" },
        { key: "end", label: "END" }, { key: "budget", label: "BUDGET" }, { key: "spend", label: "SPEND" },
      ],
      rows: engagements.map((e) => ({
        name: e.engagement_name ?? "", number: e.engagement_number ?? "",
        type: e.r_engagement_type?.name ?? "", plan: e.r_annual_audit_plan?.name ?? "",
        status: e.authorised_date ? "COMPLETED" : "IN_PROGRESS",
        start: d(e.start_date), end: d(e.end_date),
        budget: e.engagement_budget?.toString() ?? "", spend: e.engagement_spend?.toString() ?? "",
      })),
    },
    {
      id: "findings",
      title: "Findings & Recommendations Report",
      description: "Root cause, recommendation, management comment and clearance status per finding.",
      columns: [
        { key: "finding", label: "FINDING" }, { key: "engagement", label: "ENGAGEMENT" },
        { key: "cause", label: "ROOT CAUSE" }, { key: "rec", label: "RECOMMENDATION" },
        { key: "mgmt", label: "MGMT COMMENT" }, { key: "cleared", label: "CLEARED" },
      ],
      rows: findings.map((f) => ({
        finding: f.detailed_finding ?? "", engagement: f.r_engagement?.engagement_name ?? "",
        cause: f.root_cause ?? "", rec: f.recommendations ?? "", mgmt: f.management_comment ?? "",
        cleared: f.authorised_date ? "YES" : "NO",
      })),
    },
    {
      id: "corrective-actions",
      title: "Corrective Action Follow-up Report",
      description: "Implementation tracking — owners, due dates, progress and verification.",
      userKey: "owner",
      columns: [
        { key: "finding", label: "FINDING" }, { key: "action", label: "CORRECTIVE ACTION" },
        { key: "owner", label: "OWNER" }, { key: "due", label: "DUE DATE" },
        { key: "status", label: "STATUS" }, { key: "progress", label: "% DONE" },
        { key: "overdue", label: "OVERDUE" }, { key: "verified", label: "VERIFIED" },
      ],
      rows: actions.map((a) => ({
        finding: (a.r_finding?.detailed_finding ?? "").slice(0, 120), action: a.action_description ?? "",
        owner: a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "",
        due: d(a.due_date), status: (a.status ?? "").replaceAll("_", " "),
        progress: a.progress ?? 0,
        overdue: a.due_date && a.due_date < new Date() && a.status !== "VERIFIED" ? "YES" : "NO",
        verified: d(a.verified_date),
      })),
    },
    {
      id: "resource-utilisation",
      title: "Resource Utilisation Report",
      description: "Hours booked and expenses claimed per auditor per engagement.",
      userKey: "user",
      columns: [
        { key: "type", label: "TYPE" }, { key: "date", label: "DATE" },
        { key: "user", label: "USER" }, { key: "engagement", label: "ENGAGEMENT" },
        { key: "hours", label: "HOURS" }, { key: "amount", label: "AMOUNT (R)" },
        { key: "desc", label: "DESCRIPTION" },
      ],
      rows: [
        ...timeEntries.map((t) => ({
          type: "TIME", date: d(t.work_date), user: t.r_user ? `${t.r_user.first_name} ${t.r_user.last_name}` : "",
          engagement: t.r_engagement?.engagement_name ?? "", hours: t.hours?.toString() ?? "", amount: "", desc: t.description ?? "",
        })),
        ...expenses.map((e) => ({
          type: "EXPENSE", date: d(e.expense_date), user: e.r_user ? `${e.r_user.first_name} ${e.r_user.last_name}` : "",
          engagement: e.r_engagement?.engagement_name ?? "", hours: "", amount: e.amount?.toString() ?? "", desc: e.description ?? "",
        })),
      ],
    },
    {
      id: "risk-register",
      title: "Risk Register Report",
      description: "Inherent vs residual scores, existing controls and audit-plan linkage.",
      columns: [
        { key: "entity", label: "AUDITABLE ENTITY" }, { key: "risk", label: "RISK" },
        { key: "cat", label: "CATEGORY" }, { key: "inh", label: "INHERENT" },
        { key: "res", label: "RESIDUAL" }, { key: "controls", label: "EXISTING CONTROLS" },
        { key: "plan", label: "LINKED PLAN" },
      ],
      rows: risks.map((r) => ({
        entity: r.auditable_entity ?? "", risk: r.risk_description ?? "",
        cat: r.risk_category ?? "", inh: r.inherent_score ?? "", res: r.residual_score ?? "",
        controls: r.existing_controls ?? "", plan: r.r_linked_planned_engagement?.name ?? "",
      })),
    },
    {
      id: "task-schedule",
      title: "Task Schedule Report",
      description: "Assignees, due dates and escalation status across all tasks.",
      userKey: "assignee",
      columns: [
        { key: "task", label: "TASK" }, { key: "engagement", label: "ENGAGEMENT" },
        { key: "stage", label: "STAGE" }, { key: "assignee", label: "ASSIGNEE" },
        { key: "due", label: "DUE DATE" }, { key: "status", label: "STATUS" },
        { key: "overdue", label: "OVERDUE" },
      ],
      rows: tasks.map((t) => ({
        task: t.title ?? "", engagement: t.r_engagement?.engagement_name ?? "",
        stage: t.stage ?? "", assignee: t.r_assignee ? `${t.r_assignee.first_name} ${t.r_assignee.last_name}` : "",
        due: d(t.due_date), status: (t.status ?? "").replaceAll("_", " "),
        overdue: t.due_date && t.due_date < new Date() && t.status !== "DONE" ? "YES" : "NO",
      })),
    },
  ];

  const org = await prisma.organization.findUnique({
    where: { id: DEMO_ORGANIZATION_ID },
    select: { name: true },
  });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Reports</h1>
          <p className="text-sm text-muted-foreground">Choose a report, filter it, preview it, then export it as a committee-ready document.</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
          FY 2026/27 · data as at {new Date().toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
        </span>
      </div>
      <ReportsClient reports={reports} orgName={org?.name ?? "Internal Audit"} />
    </div>
  );
}
