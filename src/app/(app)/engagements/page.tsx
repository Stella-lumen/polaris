import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { AiAnalysisButton, ExportButton, ImportButton } from "@/components/engagement-actions";
import { fmtRand, budgetPercent } from "@/lib/resource-logic";
import { isEffective } from "@/lib/declarations";

export const instant = false;

const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : null);

export default async function EngagementsPage() {
  const engagements = await prisma.engagement.findMany({
    where: { deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID },
    include: {
      r_engagement_type: true,
      r_annual_audit_plan: true,
      r_planned_engagement: { include: { riskAssessments_linked_planned_engagement: { select: { auditable_entity: true } } } },
      teamMembers_engagement: { where: { deleted: false }, include: { r_user: true } },
      tasks_engagement: { where: { deleted: false }, select: { status: true, due_date: true } },
      timeEntries_engagement: { where: { deleted: false }, select: { hours: true } },
      expenses_engagement: { where: { deleted: false }, select: { amount: true } },
    },
    orderBy: { created_at: "desc" },
  });
  const findingCounts = await prisma.engagementFindingAndRecommendations.groupBy({ by: ["engagement_id"], where: { deleted: false }, _count: true });
  // "x of y team members have signed" per engagement
  const [activeDeclCount, auditorsByEng, declSignRows] = await Promise.all([
    prisma.declaration.count({ where: { deleted: false, disabled: false } }),
    prisma.engagementAuditor.groupBy({ by: ["engagement_id"], where: { deleted: false }, _count: true }),
    prisma.engagementAuditorDeclaration.findMany({ where: { deleted: false }, select: { engagement_id: true, engagement_auditor_id: true, declaration_id: true, status: true } }),
  ]);
  const auditorCountByEng = new Map(auditorsByEng.map((a) => [a.engagement_id, a._count]));
  const signedByEngAud = new Map<string, Map<string, Set<string>>>();
  for (const r of declSignRows.filter(isEffective)) {
    if (!r.engagement_id || !r.engagement_auditor_id || !r.declaration_id) continue;
    if (!signedByEngAud.has(r.engagement_id)) signedByEngAud.set(r.engagement_id, new Map());
    const m = signedByEngAud.get(r.engagement_id)!;
    if (!m.has(r.engagement_auditor_id)) m.set(r.engagement_auditor_id, new Set());
    m.get(r.engagement_auditor_id)!.add(r.declaration_id);
  }
  const declLabel = (engId: string) => {
    const total = auditorCountByEng.get(engId) ?? 0;
    if (!total) return "No team yet";
    if (!activeDeclCount) return "No declarations";
    const signed = [...(signedByEngAud.get(engId)?.values() ?? [])].filter((s) => s.size >= activeDeclCount).length;
    return `${signed} of ${total} signed`;
  };
  const actionCounts = await prisma.correctiveAction.groupBy({ by: ["finding_id"], where: { deleted: false, status: { not: "VERIFIED" } }, _count: true });
  const findingIds = new Map(findingCounts.map((f) => [f.engagement_id, f._count]));
  const findingRows = await prisma.engagementFindingAndRecommendations.findMany({ where: { deleted: false }, select: { id: true, engagement_id: true } });
  const openActionsByEng = new Map<string, number>();
  const actionFindingSet = new Set(actionCounts.filter((a) => a._count > 0).map((a) => a.finding_id));
  for (const f of findingRows) if (actionFindingSet.has(f.id) && f.engagement_id) openActionsByEng.set(f.engagement_id, (openActionsByEng.get(f.engagement_id) ?? 0) + (actionCounts.find((a) => a.finding_id === f.id)?._count ?? 0));

  const now = Date.now();
  const rows = engagements.map((e) => {
    const lead = e.teamMembers_engagement.find((m) => m.role === "LEAD") ?? e.teamMembers_engagement[0];
    const usedH = e.timeEntries_engagement.reduce((s, t) => s + Number(t.hours ?? 0), 0);
    const usedE = e.expenses_engagement.reduce((s, x) => s + Number(x.amount ?? 0), 0);
    const plannedH = Number(e.planned_hours ?? 0);
    const budget = Number(e.engagement_budget ?? 0);
    const spend = Number(e.engagement_spend ?? 0) + usedE;
    const budgetPct = budgetPercent(spend, budget || null);
    const hoursPct = budgetPercent(usedH, plannedH || null);
    const overdue = e.tasks_engagement.filter((t) => t.due_date && t.due_date.getTime() < now && t.status !== "DONE").length;
    const done = e.tasks_engagement.filter((t) => t.status === "DONE").length;
    const total = e.tasks_engagement.length;
    const progress = total ? Math.round((done / total) * 100) : null;
    const hasAny = e.tasks_engagement.length > 0 || e.timeEntries_engagement.length > 0;
    const status = !hasAny ? "Not started" : progress === 100 || e.end_date && e.end_date.getTime() < now ? "Completed" : "In progress";
    const stage = e.report_status === "APPROVED" ? "Follow-up" : e.tasks_engagement.some((t) => t.status === "DONE") ? "Reporting" : hasAny ? "Fieldwork" : "Planning";
    return {
      e, lead: person(lead?.r_user), teamSize: e.teamMembers_engagement.length,
      usedH, plannedH, spend, budget, budgetPct, hoursPct, overdue, progress, status, stage,
      risk: e.r_planned_engagement?.riskAssessments_linked_planned_engagement?.[0]?.auditable_entity ?? e.r_annual_audit_plan?.name ?? null,
      findings: findingIds.get(e.id) ?? 0,
      openActions: openActionsByEng.get(e.id) ?? 0,
    };
  });
  const inProg = rows.filter((r) => r.status === "In progress").length;
  const overBudget = rows.filter((r) => (r.budgetPct ?? 0) >= 100).length;
  const withOverdue = rows.filter((r) => r.overdue > 0).length;
  const totBudget = rows.reduce((s, r) => s + r.budget, 0);
  const totSpend = rows.reduce((s, r) => s + r.spend, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Engagements</h1>
        <div className="flex gap-2">
          <AiAnalysisButton />
          <ExportButton rows={rows.map((r) => ({ Name: r.e.engagement_name, Number: r.e.engagement_number, Type: r.e.r_engagement_type?.name, Lead: r.lead, Stage: r.stage, Status: r.status, "Start Date": r.e.start_date?.toISOString().slice(0, 10), "End Date": r.e.end_date?.toISOString().slice(0, 10), Budget: r.budget || null, Spend: r.spend || null, "Progress %": r.progress }))} />
          <ImportButton />
          <Link href="/engagements/add" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Create Engagement</Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-1">Total: {rows.length}</span>
        <span className="rounded bg-blue-100 px-2 py-1 text-blue-800">In progress: {inProg}</span>
        <span className={`rounded px-2 py-1 ${overBudget ? "bg-red-100 text-red-800" : "bg-zinc-100"}`}>Over budget: {overBudget}</span>
        <span className={`rounded px-2 py-1 ${withOverdue ? "bg-red-100 text-red-800" : "bg-zinc-100"}`}>Overdue tasks: {withOverdue}</span>
        <span className="rounded bg-zinc-100 px-2 py-1">Budget: {fmtRand(totBudget)} · Spend: {fmtRand(totSpend)}</span>
      </div>

      <DataGrid
        rows={rows.map((r) => ({
          id: r.e.id,
          engagement_name: r.e.engagement_name,
          engagement_number: r.e.engagement_number ?? "—",
          type: r.e.r_engagement_type?.name ?? "—",
          stage: r.stage,
          status: r.status,
          lead: r.lead ?? "Not assigned",
          team: r.teamSize || "—",
          declarations: declLabel(r.e.id),
          risk: r.risk ?? "Not linked",
          findings: r.findings,
          open_actions: r.openActions,
          progress: r.progress != null ? `${r.progress}%` : "—",
          budget_used: r.budgetPct != null ? `${r.budgetPct}%` : "—",
          budget_warn: r.budgetPct != null && r.budgetPct >= 100 ? "over" : r.budgetPct != null && r.budgetPct >= 80 ? "warn" : "",
          updated: r.e.updated_at?.toISOString().slice(0, 10) ?? "—",
        })) as unknown as object[]}
        hrefPattern="/engagements/{id}/dashboard"
        rowActions={["edit"]}
        colDefs={[
          { field: "engagement_name", headerName: "Name", flex: 2, tooltipField: "engagement_name" },
          { field: "engagement_number", headerName: "Number", width: 150, tooltipField: "engagement_number" },
          { field: "type", headerName: "Type", width: 140, tooltipField: "type" },
          { field: "stage", headerName: "Stage", width: 105 },
          { field: "status", headerName: "Status", width: 115 },
          { field: "lead", headerName: "Lead", width: 140, tooltipField: "lead" },
          { field: "team", headerName: "Team", width: 70 },
          { field: "declarations", headerName: "Declarations", width: 120, tooltipField: "declarations" },
          { field: "risk", headerName: "Risk / plan", flex: 1, tooltipField: "risk" },
          { field: "findings", headerName: "Findings", width: 90, type: "rightAligned" },
          { field: "open_actions", headerName: "Open actions", width: 110, type: "rightAligned" },
          { field: "progress", headerName: "Progress", width: 90 },
          { field: "budget_used", headerName: "Budget used", width: 105 },
          { field: "updated", headerName: "Updated", width: 105 },
        ]}
        badgeMap={{
          budget_used: {},
          status: {
            "Not started": "rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700",
            "In progress": "rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800",
            "Completed": "rounded bg-emerald-100 px-1.5 py-0.5 text-xs text-emerald-800",
          },
        }}
      />
    </div>
  );
}
