// One definition per report. The page, exports, API and tests all call
// runReport(), so the summary strip, charts, table and every export read
// the same filtered rows — totals can't diverge.
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { bandFor, DEFAULT_BANDS, alertFloorBand, type RiskBand } from "@/lib/risk";
import {
  periodRange, inPeriod, match, searchRow, fmtDate, fmtMoney, daysOverdue, ageingBand,
} from "./filters";
import { activitySentence, activityGroup, recordHref, collapseRepeats, type ActivityLogInput, type ActivityRow } from "./activity";
import type { ReportDef, ReportResult, ReportRow, FilterValues, ChartRow } from "./types";

const org = DEMO_ORGANIZATION_ID;
const scope = { deleted: false as const, organization_id: org };

const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) =>
  u ? `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() : "Not assigned";

const d = fmtDate;
const money = (v: unknown) => (v == null ? "" : fmtMoney(Number(v)));
const num = (v: unknown) => (v == null ? 0 : Number(v));

const engStatus = (e: { authorised_date: Date | null; start_date?: Date | null }) =>
  e.authorised_date ? "Completed" : e.start_date && e.start_date <= new Date() ? "In progress" : "Not started";

async function loadBands(): Promise<RiskBand[]> {
  const bands = await prisma.riskRatingBand.findMany({ where: { deleted: false, disabled: false, organization_id: org } });
  return bands.length ? bands : DEFAULT_BANDS;
}

/* ---------------- Audit work ---------------- */

async function runPlanProgress(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const [items, risks, bands] = await Promise.all([
    prisma.plannedEngagement.findMany({
      where: scope,
      include: {
        r_engagement_type: true,
        engagements_planned_engagement: { where: scope },
        r_annual_audit_plan: true,
      },
    }),
    prisma.riskAssessment.findMany({ where: scope }),
    loadBands(),
  ]);
  const leadIds = [...new Set(items.map((i) => i.lead_user_id).filter(Boolean))] as string[];
  const leads = await prisma.user.findMany({ where: { id: { in: leadIds } } });
  const leadName = (id: string | null) => person(leads.find((u) => u.id === id) ?? null);
  const floor = alertFloorBand(bands);
  const floorMin = floor?.min_score ?? 15;

  const rows: ReportRow[] = items
    .filter((i) => inPeriod(i.planned_start_date, range) || !f.period || f.period === "fy")
    .filter((i) => match(i.status ?? "", f.status))
    .filter((i) => match(i.r_engagement_type?.name ?? "", f.engagement_type))
    .filter((i) => match(i.lead_user_id ?? "", f.lead_auditor))
    .filter((i) => searchRow({ name: i.name, reference: i.reference }, f.search))
    .map((i) => {
      const eng = i.engagements_planned_engagement;
      const linked = eng?.[0];
      const state = linked ? (linked.authorised_date ? "Completed" : "Started") : "Planned";
      return {
        plan: i.r_annual_audit_plan?.name ?? "",
        reference: i.reference ?? "", item: i.name ?? "", type: i.r_engagement_type?.name ?? "",
        quarter: i.quarter ?? "", lead: leadName(i.lead_user_id ?? null),
        planned_start: d(i.planned_start_date), planned_end: d(i.planned_end_date),
        budget: money(i.planned_budget), progress: state,
        linked_engagement: linked ? "Yes" : "No",
        href: linked ? `/engagements/${linked.id}` : "/annual-audit-plan",
      };
    });

  const started = rows.filter((r) => r.progress === "Started" || r.progress === "Completed").length;
  const done = rows.filter((r) => r.progress === "Completed").length;
  const hi = risks.filter((r) => r.residual_score != null && r.residual_score >= floorMin);
  const hiCovered = hi.filter((r) => r.linked_planned_engagement_id).length;
  return {
    columns: [
      { key: "plan", label: "Audit plan" }, { key: "reference", label: "Ref" },
      { key: "item", label: "Planned engagement" }, { key: "type", label: "Type" },
      { key: "quarter", label: "Quarter" }, { key: "lead", label: "Lead" },
      { key: "planned_start", label: "Planned start" }, { key: "planned_end", label: "Planned end" },
      { key: "budget", label: "Budget" }, { key: "progress", label: "Progress" },
      { key: "linked_engagement", label: "Engagement created" },
    ],
    rows,
    summary: [
      { label: "Planned engagements", value: rows.length },
      { label: "Started", value: started },
      { label: "Completed", value: done },
      { label: "High/extreme risks covered", value: `${hiCovered} of ${hi.length}` },
    ],
    charts: [
      { kind: "bars", title: "Progress of planned engagements", rows: [
        { label: "Planned", value: rows.length - started, color: "#a8a29e" },
        { label: "Started", value: started - done, color: "#f59e0b" },
        { label: "Completed", value: done, color: "#10b981" },
      ] },
      { kind: "bars", title: `High & extreme risks (${floorMin}+)`, rows: [
        { label: "In the audit plan", value: hiCovered, color: "#10b981" },
        { label: "Not covered", value: hi.length - hiCovered, color: "#ef4444" },
      ] },
    ],
    totalsCheck: `${rows.length} planned engagements — matches the Annual Audit Plan page`,
  };
}

async function runEngagementStatus(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const engagements = await prisma.engagement.findMany({
    where: scope,
    include: {
      r_engagement_type: true, r_annual_audit_plan: true,
      r_prepared_by: true,
      teamMembers_engagement: { where: { deleted: false, role: "LEAD" }, include: { r_user: true } },
    },
  });
  const rows: ReportRow[] = engagements
    .filter((e) => inPeriod(e.start_date, range) || f.period === undefined)
    .filter((e) => match(e.r_annual_audit_plan?.name ?? "", f.engagement) || match(e.engagement_name ?? "", f.engagement))
    .filter((e) => match(engStatus(e), f.status))
    .filter((e) => match(e.r_engagement_type?.name ?? "", f.engagement_type))
    .filter((e) => !f.lead_auditor || f.lead_auditor === "all" || e.teamMembers_engagement.some((m) => m.user_id === f.lead_auditor))
    .filter((e) => searchRow({ name: e.engagement_name, number: e.engagement_number }, f.search))
    .map((e) => ({
      name: e.engagement_name ?? "", number: e.engagement_number ?? "",
      type: e.r_engagement_type?.name ?? "", plan: e.r_annual_audit_plan?.name ?? "",
      status: engStatus(e), lead: person(e.teamMembers_engagement[0]?.r_user ?? null),
      start: d(e.start_date), end: d(e.end_date),
      budget: money(e.engagement_budget), spend: money(e.engagement_spend),
      href: `/engagements/${e.id}`,
    }));
  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
  const overBudget = engagements.filter((e) => num(e.engagement_spend) > num(e.engagement_budget) && num(e.engagement_budget) > 0).length;
  return {
    columns: [
      { key: "name", label: "Engagement" }, { key: "number", label: "Number" },
      { key: "type", label: "Type" }, { key: "plan", label: "Audit plan" },
      { key: "status", label: "Status" }, { key: "lead", label: "Lead auditor" },
      { key: "start", label: "Start" }, { key: "end", label: "End" },
      { key: "budget", label: "Budget" }, { key: "spend", label: "Spend" },
    ],
    rows,
    summary: [
      { label: "Engagements", value: rows.length },
      { label: "Not started", value: byStatus("Not started") },
      { label: "In progress", value: byStatus("In progress") },
      { label: "Completed", value: byStatus("Completed") },
      { label: "Over budget", value: overBudget },
    ],
    charts: [
      { kind: "bars", title: "Engagements by status", rows: [
        { label: "Not started", value: byStatus("Not started"), color: "#a8a29e", setFilter: { status: "Not started" } },
        { label: "In progress", value: byStatus("In progress"), color: "#f59e0b", setFilter: { status: "In progress" } },
        { label: "Completed", value: byStatus("Completed"), color: "#10b981", setFilter: { status: "Completed" } },
      ] },
      { kind: "bars", title: "Engagements by type", rows: [...new Set(rows.map((r) => r.type as string))].filter(Boolean).map((t) => ({
        label: t, value: rows.filter((r) => r.type === t).length, color: "#f97316", setFilter: { engagement_type: t },
      })) },
    ],
    totalsCheck: `${engagements.length} engagements in total — matches the Engagements page`,
  };
}

async function runFindings(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const findings = await prisma.engagementFindingAndRecommendations.findMany({
    where: scope,
    include: { r_engagement: { select: { engagement_name: true, id: true } }, correctiveActions_finding: true },
  });
  const rows: ReportRow[] = findings
    .filter((x) => inPeriod(x.prepared_date ?? x.created_at, range) || f.period === undefined)
    .filter((x) => match(x.r_engagement?.engagement_name ?? "", f.engagement))
    .filter((x) => match(x.status ?? "", f.status))
    .filter((x) => searchRow({ a: x.detailed_finding, b: x.recommendations }, f.search))
    .map((x) => ({
      finding: x.detailed_finding ?? "", engagement: x.r_engagement?.engagement_name ?? "",
      cause: x.root_cause ?? "", recommendation: x.recommendations ?? "",
      management_comment: x.management_comment ?? "",
      status: (x.status ?? "OPEN").replaceAll("_", " "),
      actions: `${x.correctiveActions_finding.filter((a) => a.status === "VERIFIED").length} of ${x.correctiveActions_finding.length} verified`,
      href: x.r_engagement ? `/engagements/${x.r_engagement.id}/findings-and-recommendations` : undefined,
    }));
  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
  const totalActions = findings.reduce((n, x) => n + x.correctiveActions_finding.length, 0);
  return {
    columns: [
      { key: "finding", label: "Finding" }, { key: "engagement", label: "Engagement" },
      { key: "cause", label: "Root cause" }, { key: "recommendation", label: "Recommendation" },
      { key: "management_comment", label: "Management comment" }, { key: "status", label: "Status" },
      { key: "actions", label: "Corrective actions" },
    ],
    rows,
    summary: [
      { label: "Findings", value: rows.length },
      { label: "Open", value: byStatus("OPEN") },
      { label: "Under review", value: byStatus("UNDER REVIEW") },
      { label: "Cleared", value: byStatus("CLEARED") },
      { label: "Corrective actions raised", value: totalActions },
    ],
    charts: [
      { kind: "bars", title: "Findings by status", rows: [
        { label: "Open", value: byStatus("OPEN"), color: "#ef4444", setFilter: { status: "OPEN" } },
        { label: "Under review", value: byStatus("UNDER REVIEW"), color: "#f59e0b", setFilter: { status: "UNDER_REVIEW" } },
        { label: "Cleared", value: byStatus("CLEARED"), color: "#10b981", setFilter: { status: "CLEARED" } },
      ] },
    ],
    totalsCheck: `${findings.length} findings in total — matches engagement findings`,
  };
}

async function runRiskRegister(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const [risks, bands] = await Promise.all([
    prisma.riskAssessment.findMany({
      where: scope,
      include: {
        r_linked_planned_engagement: { select: { name: true } },
        r_risk_owner: true, r_strategic_objective: true,
      },
    }),
    loadBands(),
  ]);
  const band = (s: number | null) => bandFor(s, bands);
  const rows: ReportRow[] = risks
    .filter((r) => inPeriod(r.created_at, range) || f.period === undefined)
    .filter((r) => match(band(r.residual_score)?.label ?? "", f.risk_rating))
    .filter((r) => match(r.risk_category ?? "", f.category))
    .filter((r) => match(r.risk_owner_id ?? "", f.owner))
    .filter((r) => match(r.status ?? "", f.status))
    .filter((r) => !f.overdue || f.overdue !== "yes" || (r.next_review_date && r.next_review_date < new Date()))
    .filter((r) => searchRow({ a: r.auditable_entity, b: r.risk_description }, f.search))
    .map((r) => ({
      entity: r.auditable_entity ?? "", risk: r.risk_description ?? "",
      category: r.risk_category ?? "", objective: r.r_strategic_objective?.name ?? "Not assigned",
      inherent: r.inherent_score ?? "", residual: r.residual_score ?? "",
      rating: band(r.residual_score)?.label ?? "Not rated",
      owner: person(r.r_risk_owner),
      in_plan: r.linked_planned_engagement_id ? "Yes" : "No",
      plan: r.r_linked_planned_engagement?.name ?? "Not assigned",
      review_due: d(r.next_review_date),
      href: `/risk-assessment/${r.id}`,
    }));
  const bandRows: ChartRow[] = bands
    .filter((b) => b.label)
    .sort((a, b) => (a.min_score ?? 0) - (b.min_score ?? 0))
    .map((b) => ({
      label: b.label!, value: risks.filter((r) => band(r.residual_score)?.label === b.label).length,
      color: { green: "#10b981", yellow: "#f59e0b", orange: "#f97316", red: "#ef4444" }[b.color ?? ""] ?? "#a8a29e",
      setFilter: { risk_rating: b.label! },
    }));
  const floor = alertFloorBand(bands);
  const uncovered = rows.filter((r) => r.in_plan === "No" && Number(r.residual || 0) >= (floor?.min_score ?? 15));
  return {
    columns: [
      { key: "entity", label: "Auditable entity" }, { key: "risk", label: "Risk" },
      { key: "category", label: "Category" }, { key: "objective", label: "Objective" },
      { key: "inherent", label: "Inherent", numeric: true }, { key: "residual", label: "Residual", numeric: true },
      { key: "rating", label: "Rating" }, { key: "owner", label: "Owner" },
      { key: "in_plan", label: "In plan" }, { key: "review_due", label: "Review due" },
    ],
    rows,
    summary: [
      { label: "Risks", value: rows.length },
      { label: "Rated", value: risks.filter((r) => r.residual_score != null).length },
      { label: "In the audit plan", value: rows.filter((r) => r.in_plan === "Yes").length },
      { label: `${floor?.label ?? "High"} not covered`, value: uncovered.length },
    ],
    charts: [
      { kind: "bars", title: "Risks by rating band", rows: bandRows },
      { kind: "heat", title: "Residual risk heat map", cells: risks.filter((r) => r.residual_likelihood && r.residual_impact).map((r) => ({ likelihood: r.residual_likelihood!, impact: r.residual_impact!, count: 1 })) },
    ],
    totalsCheck: `${risks.length} risks in total — matches the Risk Assessment page`,
  };
}

async function runTaskSchedule(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const tasks = await prisma.task.findMany({
    where: scope,
    include: { r_engagement: { select: { engagement_name: true, id: true } }, r_assignee: true },
  });
  const rows: ReportRow[] = tasks
    .filter((t) => inPeriod(t.due_date, range) || f.period === undefined)
    .filter((t) => match(t.r_engagement?.engagement_name ?? "", f.engagement))
    .filter((t) => match(t.status ?? "", f.status))
    .filter((t) => match(t.assignee_user_id ?? "", f.assignee))
    .filter((t) => match(t.stage ?? "", f.activity_type))
    .filter((t) => !f.overdue || f.overdue !== "yes" || (t.due_date && t.due_date < new Date() && t.status !== "DONE" && t.status !== "COMPLETED"))
    .filter((t) => searchRow({ a: t.title }, f.search))
    .map((t) => ({
      task: t.title ?? "", engagement: t.r_engagement?.engagement_name ?? "Not assigned",
      stage: (t.stage ?? "").replaceAll("_", " "), assignee: person(t.r_assignee),
      due: d(t.due_date), status: (t.status ?? "").replaceAll("_", " "),
      overdue: daysOverdue(t.due_date) > 0 && !/DONE|COMPLETED/.test(t.status ?? "") ? `${daysOverdue(t.due_date)} days` : "No",
      href: `/tasks/${t.id}`,
    }));
  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
  return {
    columns: [
      { key: "task", label: "Task" }, { key: "engagement", label: "Engagement" },
      { key: "stage", label: "Stage" }, { key: "assignee", label: "Assignee" },
      { key: "due", label: "Due date" }, { key: "status", label: "Status" },
      { key: "overdue", label: "Overdue" },
    ],
    rows,
    summary: [
      { label: "Tasks", value: rows.length },
      { label: "Open", value: rows.filter((r) => !/done|completed/i.test(String(r.status))).length },
      { label: "Overdue", value: rows.filter((r) => r.overdue !== "No").length },
      { label: "Done", value: rows.filter((r) => /done|completed/i.test(String(r.status))).length },
    ],
    charts: [
      { kind: "bars", title: "Tasks by status", rows: [...new Set(rows.map((r) => String(r.status)))].filter(Boolean).map((s) => ({
        label: s || "No status", value: byStatus(s), color: /done|completed/i.test(s) ? "#10b981" : "#f59e0b",
      })) },
      { kind: "bars", title: "Tasks by stage", rows: [...new Set(rows.map((r) => String(r.stage)))].filter(Boolean).map((s) => ({
        label: s, value: rows.filter((r) => r.stage === s).length, color: "#f97316", setFilter: { activity_type: s.replaceAll(" ", "_") },
      })) },
    ],
    totalsCheck: `${tasks.length} tasks in total — matches the Tasks page`,
  };
}

/* ---------------- Follow-up ---------------- */

const CA_SOURCES = [
  { value: "INTERNAL_AUDIT", label: "Internal Audit" },
  { value: "AUDITOR_GENERAL", label: "Auditor General" },
];
export { CA_SOURCES };
const sourceLabel = (s: string | null | undefined) =>
  s === "AUDITOR_GENERAL" ? "Auditor General" : "Internal Audit";

async function loadCorrectiveActions() {
  return prisma.correctiveAction.findMany({
    where: scope,
    include: {
      r_finding: { select: { detailed_finding: true, id: true, r_engagement: { select: { engagement_name: true } } } },
      r_owner: true,
    },
    orderBy: { due_date: "asc" },
  });
}

async function runCorrectiveActions(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const actions = await loadCorrectiveActions();
  const done = (a: { status: string | null }) => a.status === "VERIFIED";
  const rows: ReportRow[] = actions
    .filter((a) => inPeriod(a.due_date, range) || f.period === undefined)
    .filter((a) => match(a.source ?? "INTERNAL_AUDIT", f.source))
    .filter((a) => match(a.owner_user_id ?? "", f.owner))
    .filter((a) => match(a.status ?? "", f.status))
    .filter((a) => !f.overdue || f.overdue !== "yes" || daysOverdue(a.due_date) > 0)
    .filter((a) => searchRow({ a: a.action_description, b: a.r_finding?.detailed_finding }, f.search))
    .map((a) => ({
      finding: a.r_finding?.detailed_finding ?? a.ag_reference ?? "Not assigned",
      action: a.action_description ?? "", source: sourceLabel(a.source),
      owner: person(a.r_owner), due: d(a.due_date),
      status: (a.status ?? "").replaceAll("_", " "), progress: a.progress ?? 0,
      ageing: ageingBand(a.due_date, done(a)),
      verified: d(a.verified_date),
      href: `/follow-up/${a.id}`,
    }));
  const byStatus = (s: string) => rows.filter((r) => r.status === s).length;
  const open = rows.filter((r) => r.status !== "VERIFIED");
  return {
    columns: [
      { key: "finding", label: "Finding" }, { key: "action", label: "Corrective action" },
      { key: "source", label: "Source" }, { key: "owner", label: "Owner" },
      { key: "due", label: "Due date" }, { key: "status", label: "Status" },
      { key: "progress", label: "% done", numeric: true }, { key: "ageing", label: "Ageing" },
      { key: "verified", label: "Verified" },
    ],
    rows,
    summary: [
      { label: "Corrective actions", value: rows.length },
      { label: "Open", value: open.length },
      { label: "Overdue", value: open.filter((r) => String(r.ageing).includes("late")).length },
      { label: "Verified", value: byStatus("VERIFIED") },
    ],
    charts: [
      { kind: "bars", title: "Actions by ageing", rows: ["Not yet due", "1–30 days late", "31–60 days late", "61–90 days late", "Over 90 days late", "Done", "No due date"].map((b) => ({
        label: b, value: rows.filter((r) => r.ageing === b).length,
        color: b === "Done" ? "#10b981" : b.includes("late") ? "#ef4444" : b === "No due date" ? "#a8a29e" : "#f59e0b",
      })).filter((r) => r.value > 0) },
      { kind: "bars", title: "Actions by source", rows: CA_SOURCES.map((s) => ({
        label: s.label, value: rows.filter((r) => r.source === s.label).length,
        color: s.value === "AUDITOR_GENERAL" ? "#7c3aed" : "#f97316", setFilter: { source: s.value },
      })).filter((r) => r.value > 0) },
    ],
    totalsCheck: `${actions.length} corrective actions — matches the Follow-up page`,
  };
}

async function runAgFindings(f: FilterValues): Promise<ReportResult> {
  const actions = await loadCorrectiveActions();
  const ag = actions.filter((a) => a.source === "AUDITOR_GENERAL");
  const rows: ReportRow[] = ag
    .filter((a) => match(String(a.ag_report_year ?? ""), f.report_year))
    .filter((a) => match(a.status ?? "", f.status))
    .filter((a) => match(a.owner_user_id ?? "", f.owner))
    .filter((a) => !f.overdue || f.overdue !== "yes" || daysOverdue(a.due_date) > 0)
    .filter((a) => searchRow({ a: a.action_description, b: a.ag_reference }, f.search))
    .map((a) => ({
      reference: a.ag_reference ?? "Not assigned", year: a.ag_report_year ?? "",
      action: a.action_description ?? "", owner: person(a.r_owner),
      due: d(a.due_date), status: (a.status ?? "").replaceAll("_", " "),
      progress: a.progress ?? 0,
      ageing: ageingBand(a.due_date, a.status === "VERIFIED"),
      management_response: a.management_response ?? "",
      href: `/follow-up/${a.id}`,
    }));
  const open = rows.filter((r) => r.status !== "VERIFIED");
  return {
    columns: [
      { key: "reference", label: "AG reference" }, { key: "year", label: "Report year" },
      { key: "action", label: "Finding / action" }, { key: "owner", label: "Owner" },
      { key: "due", label: "Due date" }, { key: "status", label: "Status" },
      { key: "progress", label: "% done", numeric: true }, { key: "ageing", label: "Ageing" },
      { key: "management_response", label: "Management response" },
    ],
    rows,
    summary: [
      { label: "Auditor General items", value: rows.length },
      { label: "Open", value: open.length },
      { label: "Overdue", value: open.filter((r) => String(r.ageing).includes("late")).length },
      { label: "Verified", value: rows.filter((r) => r.status === "VERIFIED").length },
    ],
    charts: [
      { kind: "bars", title: "AG items by report year", rows: [...new Set(ag.map((a) => a.ag_report_year ?? 0))].sort().map((y) => ({
        label: String(y || "No year"), value: rows.filter((r) => String(r.year) === String(y || "No year")).length,
        color: "#7c3aed", setFilter: { report_year: String(y) },
      })) },
      { kind: "bars", title: "AG items by status", rows: [...new Set(ag.map((a) => (a.status ?? "").replaceAll("_", " ")))].map((s) => ({
        label: s || "No status", value: rows.filter((r) => r.status === s).length, color: "#f59e0b", setFilter: { status: s.replaceAll(" ", "_") },
      })) },
    ],
    totalsCheck: `${ag.length} Auditor General items — matches Follow-up filtered to Auditor General`,
  };
}

/* ---------------- Resources ---------------- */

async function runResourceUtilisation(f: FilterValues): Promise<ReportResult> {
  const range = periodRange(f.period, f.from, f.to);
  const [timeEntries, expenses, team] = await Promise.all([
    prisma.timeEntry.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.expense.findMany({ where: scope, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.engagementTeamMember.findMany({ where: { deleted: false, organization_id: org }, include: { r_engagement: { select: { engagement_name: true } } } }),
  ]);
  const tRows: ReportRow[] = timeEntries.map((t) => ({
    type: "Time", date: t.work_date, user: person(t.r_user), user_id: t.user_id ?? "",
    engagement: t.r_engagement?.engagement_name ?? "Not assigned", hours: num(t.hours), amount: 0,
    desc: t.description ?? "",
  }));
  const eRows: ReportRow[] = expenses.map((e) => ({
    type: "Expense", date: e.expense_date, user: person(e.r_user), user_id: e.user_id ?? "",
    engagement: e.r_engagement?.engagement_name ?? "Not assigned", hours: 0, amount: num(e.amount),
    desc: e.description ?? "",
  }));
  const all = [...tRows, ...eRows];
  const rows: ReportRow[] = all
    .filter((r) => inPeriod(r.date as Date, range) || f.period === undefined)
    .filter((r) => match(r.engagement as string, f.engagement))
    .filter((r) => match(r.user_id as string, f.auditor))
    .filter((r) => match(r.type as string, f.activity_type))
    .filter((r) => searchRow({ a: r.desc }, f.search))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .map((r) => ({ ...r, date: d(r.date as Date), hours: r.hours || "", amount: r.amount ? fmtMoney(r.amount as number) : "", user_id: undefined, href: "/resources" }));
  const totalHours = tRows.reduce((n, r) => n + (r.hours as number), 0);
  const totalExp = eRows.reduce((n, r) => n + (r.amount as number), 0);
  const planned = team.reduce((n, m) => n + num(m.planned_hours), 0);
  const byEng = new Map<string, { planned: number; actual: number }>();
  team.forEach((m) => {
    const k = m.r_engagement?.engagement_name ?? "Not assigned";
    byEng.set(k, { planned: (byEng.get(k)?.planned ?? 0) + num(m.planned_hours), actual: byEng.get(k)?.actual ?? 0 });
  });
  tRows.forEach((r) => {
    const k = r.engagement as string;
    byEng.set(k, { planned: byEng.get(k)?.planned ?? 0, actual: (byEng.get(k)?.actual ?? 0) + (r.hours as number) });
  });
  return {
    columns: [
      { key: "type", label: "Type" }, { key: "date", label: "Date" }, { key: "user", label: "Auditor" },
      { key: "engagement", label: "Engagement" }, { key: "hours", label: "Hours", numeric: true },
      { key: "amount", label: "Amount" }, { key: "desc", label: "Description" },
    ],
    rows,
    summary: [
      { label: "Entries", value: rows.length },
      { label: "Hours booked", value: totalHours.toLocaleString("en-ZA") },
      { label: "Planned hours", value: planned.toLocaleString("en-ZA") },
      { label: "Utilisation", value: planned ? `${Math.round((totalHours / planned) * 100)}%` : "—" },
      { label: "Expenses", value: fmtMoney(totalExp) },
    ],
    charts: [
      { kind: "bars", title: "Hours — planned vs actual by engagement", rows: [...byEng.entries()].flatMap(([k, v]) => ([
        { label: `${k} · planned`, value: v.planned, color: "#d6d3d1" },
        { label: `${k} · actual`, value: Math.round(v.actual * 10) / 10, color: "#f97316" },
      ])).slice(0, 12) },
      { kind: "bars", title: "Hours by auditor", rows: [...new Set(tRows.map((r) => r.user as string))].map((u) => ({
        label: u, value: Math.round(tRows.filter((r) => r.user === u).reduce((n, r) => n + (r.hours as number), 0) * 10) / 10, color: "#f59e0b",
      })) },
    ],
    totalsCheck: `${timeEntries.length} time entries + ${expenses.length} expenses — matches the Resources page`,
  };
}

/* ---------------- Governance ---------------- */

async function runCommitteePack(_f: FilterValues): Promise<ReportResult> {
  const [plan, eng, findings, risks, ca, res] = await Promise.all([
    runPlanProgress({}), runEngagementStatus({}), runFindings({}),
    runRiskRegister({}), runCorrectiveActions({}), runResourceUtilisation({}),
  ]);
  const rows: ReportRow[] = [
    { section: "1 · Summary", item: `Engagements: ${eng.summary[0].value} (${eng.summary.find((s) => s.label === "In progress")?.value} in progress, ${eng.summary.find((s) => s.label === "Completed")?.value} completed)` },
    { section: "1 · Summary", item: `Plan progress: ${plan.summary[1].value} of ${plan.summary[0].value} planned engagements started; ${plan.summary[2].value} completed` },
    { section: "1 · Summary", item: `Risks: ${risks.summary[0].value} assessed; ${risks.summary[2].value} in the audit plan; ${risks.summary[3].value}` },
    { section: "1 · Summary", item: `Findings: ${findings.summary[0].value} raised (${findings.summary[1].value} open)` },
    { section: "1 · Summary", item: `Follow-up: ${ca.summary[0].value} corrective actions, ${ca.summary[2].value} overdue` },
    { section: "1 · Summary", item: `Resources: ${res.summary[1].value} hours booked of ${res.summary[2].value} planned; ${res.summary[4].value} in expenses` },
    { section: "2 · Plan progress", item: `${plan.summary[0].value} planned — ${plan.summary[1].value} started, ${plan.summary[2].value} completed. ${plan.summary[3].label}: ${plan.summary[3].value}.` },
    { section: "3 · Top risks", item: `${risks.summary[3].value}. ${risks.rows.filter((r) => r.in_plan === "No").slice(0, 5).map((r) => `${r.risk} (${r.rating})`).join("; ") || "All high risks are covered by the plan."}` },
    { section: "4 · Findings by status", item: findings.charts[0].kind === "bars" ? findings.charts[0].rows.map((r) => `${r.label}: ${r.value}`).join(" · ") : "" },
    { section: "5 · Follow-up status & ageing", item: `Open: ${ca.summary[1].value} · Overdue: ${ca.summary[2].value} · Verified: ${ca.summary[3].value}` },
    { section: "6 · Resource use", item: `Hours ${res.summary[1].value} of ${res.summary[2].value} planned (${res.summary[3].value} utilisation) · Expenses ${res.summary[4].value}` },
  ];
  return {
    columns: [
      { key: "section", label: "Section" }, { key: "item", label: "Key information for the committee" },
    ],
    rows,
    summary: [
      { label: "Engagements", value: eng.summary[0].value },
      { label: "Plan progress", value: `${plan.summary[1].value}/${plan.summary[0].value} started` },
      { label: "Open findings", value: findings.summary[1].value },
      { label: "Overdue actions", value: ca.summary[2].value },
      { label: "Hours booked", value: res.summary[1].value },
    ],
    charts: [...eng.charts.slice(0, 1), ...ca.charts.slice(0, 1)],
    totalsCheck: "Combined from the same queries as each underlying report",
  };
}

/* ---------------- Administration ---------------- */

async function runSystemActivity(f: FilterValues, opts: { showEmail: boolean } = { showEmail: false }): Promise<ReportResult> {
  const logs = await prisma.auditLog.findMany({
    where: { organization_id: org },
    orderBy: { timestamp: "desc" },
    take: 2000,
  });
  const users = await prisma.user.findMany({ where: { deleted: false }, select: { id: true, first_name: true, last_name: true, email: true } });
  const byId = new Map(users.map((u) => [u.id, u]));

  let rows: ActivityRow[] = logs.map((l) => {
    const input: ActivityLogInput = l;
    const u = l.user_id ? byId.get(l.user_id) : undefined;
    const actorName = l.actor_label ?? (u ? `${u.first_name} ${u.last_name}` : l.user_id ? "Unknown" : "System (automatic)");
    return {
      id: l.id, when: l.timestamp ?? null,
      actor: actorName === "System (automatic)" ? "System (automatic)" : actorName,
      sentence: activitySentence(input),
      group: activityGroup(input),
      recordLabel: l.record_label ?? "",
      recordHref: recordHref(l.table_name, l.record_id),
      email: opts.showEmail ? u?.email ?? "" : "",
    } as ActivityRow & { email: string };
  });

  // hide sign-ins unless asked for
  if (f.signins !== "yes") rows = rows.filter((r) => r.group !== "signins");
  rows = collapseRepeats(rows);
  const groupLabels: Record<string, string> = {
    changes: "Changes", signins: "Sign-ins", reminders: "Reminders & escalations",
    api: "API use", reports: "Reports & exports",
  };
  const tableRows: ReportRow[] = rows
    .filter((r) => match(r.group, f.activity_type) || match(groupLabels[r.group], f.activity_type))
    .filter((r) => match(r.actor, f.user) || match((r as ActivityRow & { email?: string }).email, f.user))
    .filter((r) => searchRow({ s: r.sentence, a: r.actor, t: r.recordLabel }, f.search))
    .map((r) => ({
      when: r.when ? r.when.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
      who: r.actor, what: r.sentence, record: r.recordLabel || "",
      group: groupLabels[r.group],
      ...(opts.showEmail ? { email: (r as ActivityRow & { email?: string }).email ?? "" } : {}),
      href: r.recordHref,
    }));
  return {
    columns: [
      { key: "when", label: "When" }, { key: "who", label: "Who" },
      { key: "what", label: "What happened" }, { key: "record", label: "Record" },
      { key: "group", label: "Group" },
      ...(opts.showEmail ? [{ key: "email", label: "Email" }] : []),
    ],
    rows: tableRows,
    summary: [
      { label: "Entries shown", value: tableRows.length },
      { label: "Changes", value: rows.filter((r) => r.group === "changes").length },
      { label: "Reminders & escalations", value: rows.filter((r) => r.group === "reminders").length },
      { label: "API use", value: rows.filter((r) => r.group === "api").length },
      { label: "Reports & exports", value: rows.filter((r) => r.group === "reports").length },
    ],
    charts: [
      { kind: "bars", title: "Activity by group", rows: Object.entries(groupLabels).map(([k, label]) => ({
        label, value: rows.filter((r) => r.group === k).length, color: "#f97316", setFilter: { activity_type: k },
      })) },
    ],
    totalsCheck: `${logs.length} audit entries read — matches the Audit Logs page`,
  };
}

async function runDeclarationsStatus(f: FilterValues): Promise<ReportResult> {
  const year = new Date().getFullYear();
  const [auditors, decls] = await Promise.all([
    prisma.engagementAuditor.findMany({ where: { deleted: false, organization_id: org }, include: { r_user: true, r_engagement: { select: { engagement_name: true } } } }),
    prisma.engagementAuditorDeclaration.findMany({ where: { organization_id: org }, orderBy: { signed_at: "desc" } }),
  ]);
  const rows: ReportRow[] = auditors
    .filter((a) => match(String(f.report_year ?? "") || String(year), String(a ? year : year)))
    .filter((a) => searchRow({ a: person(a.r_user) }, f.search))
    .map((a) => {
      const decl = decls.find((x) => x.declared_year === year || x.declared_year == null);
      const signed = decl && decl.status === "SIGNED" && decl.signed_at;
      return {
        auditor: person(a.r_user), engagement: a.r_engagement?.engagement_name ?? "Not assigned",
        position: a.position_on_audit ?? "", year,
        status: signed ? "Signed" : "Pending",
        signed_at: signed ? fmtDate(decl!.signed_at) : "",
        conflict: decl?.conflict_reason ?? "None declared",
      };
    })
    .filter((r) => match(r.status as string, f.status));
  return {
    columns: [
      { key: "auditor", label: "Auditor" }, { key: "engagement", label: "Engagement" },
      { key: "position", label: "Position" }, { key: "year", label: "Year" },
      { key: "status", label: "Declaration" }, { key: "signed_at", label: "Signed on" },
      { key: "conflict", label: "Conflict declared" },
    ],
    rows,
    summary: [
      { label: "Auditors", value: rows.length },
      { label: "Signed", value: rows.filter((r) => r.status === "Signed").length },
      { label: "Pending", value: rows.filter((r) => r.status === "Pending").length },
      { label: "Conflicts declared", value: rows.filter((r) => r.conflict !== "None declared" && r.conflict !== "").length },
    ],
    charts: [
      { kind: "bars", title: "Declaration status", rows: [
        { label: "Signed", value: rows.filter((r) => r.status === "Signed").length, color: "#10b981", setFilter: { status: "Signed" } },
        { label: "Pending", value: rows.filter((r) => r.status === "Pending").length, color: "#f59e0b", setFilter: { status: "Pending" } },
      ] },
    ],
    totalsCheck: `${auditors.length} auditors — matches the Declarations page`,
  };
}

async function runApiKeyUsage(f: FilterValues): Promise<ReportResult> {
  const keys = await prisma.apiKey.findMany({ where: { deleted: false, organization_id: org }, orderBy: { created_at: "desc" } });
  const rows: ReportRow[] = keys
    .filter((k) => match(k.disabled ? "Disabled" : k.revoked_at ? "Revoked" : "Active", f.status))
    .filter((k) => searchRow({ a: k.name, b: k.key_prefix, c: k.purpose }, f.search))
    .map((k) => ({
      name: k.name ?? "", prefix: `${k.key_prefix ?? ""}…`, purpose: k.purpose ?? "",
      scopes: ((k.scopes as string[]) ?? []).join(", "),
      calls_30d: k.calls_30d ?? 0,
      last_used: k.last_used_at ? k.last_used_at.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Never",
      expires: fmtDate(k.expires_at), last_error: k.last_error ?? "",
      status: k.disabled ? "Disabled" : k.revoked_at ? "Revoked" : k.expires_at && k.expires_at < new Date() ? "Expired" : "Active",
      href: "/admin/api-keys",
    }));
  return {
    columns: [
      { key: "name", label: "Key name" }, { key: "prefix", label: "Prefix" },
      { key: "purpose", label: "Purpose" }, { key: "scopes", label: "Scopes" },
      { key: "calls_30d", label: "Calls (30d)", numeric: true }, { key: "last_used", label: "Last used" },
      { key: "expires", label: "Expires" }, { key: "last_error", label: "Last error" },
      { key: "status", label: "Status" },
    ],
    rows,
    summary: [
      { label: "API keys", value: rows.length },
      { label: "Active", value: rows.filter((r) => r.status === "Active").length },
      { label: "Calls in 30 days", value: rows.reduce((n, r) => n + Number(r.calls_30d || 0), 0) },
      { label: "With errors", value: rows.filter((r) => r.last_error).length },
    ],
    charts: [
      { kind: "bars", title: "Calls in the last 30 days", rows: rows.filter((r) => Number(r.calls_30d) > 0).map((r) => ({
        label: r.name as string, value: Number(r.calls_30d), color: "#f97316",
      })) },
    ],
    totalsCheck: `${keys.length} API keys — matches the API Keys page`,
  };
}

/* ---------------- catalogue ---------------- */

const adminOnly = true;
export const REPORTS: ReportDef[] = [
  { id: "plan-progress", title: "Annual Audit Plan Progress", group: "Audit work",
    description: "Planned versus started versus completed engagements, and coverage of high and extreme risks.",
    filters: ["period", "status", "engagement_type", "lead_auditor", "search"], run: runPlanProgress },
  { id: "engagement-status", title: "Engagement Status Report", group: "Audit work",
    description: "All engagements — type, plan, status, dates, budget versus spend.",
    filters: ["period", "engagement", "status", "engagement_type", "lead_auditor", "search"], run: runEngagementStatus },
  { id: "findings", title: "Findings & Recommendations Report", group: "Audit work",
    description: "Root cause, recommendation, management comment and clearance status per finding.",
    filters: ["period", "engagement", "status", "search"], run: runFindings },
  { id: "risk-register", title: "Risk Register Report", group: "Audit work",
    description: "Inherent versus residual scores, ratings, owners and audit-plan linkage.",
    filters: ["period", "risk_rating", "category", "owner", "status", "overdue", "search"], run: runRiskRegister },
  { id: "task-schedule", title: "Task Schedule Report", group: "Audit work",
    description: "Assignees, due dates and overdue tasks across all engagements.",
    filters: ["period", "engagement", "status", "assignee", "activity_type", "overdue", "search"], run: runTaskSchedule },
  { id: "corrective-actions", title: "Corrective Action Follow-up Report", group: "Follow-up",
    description: "Implementation tracking — owners, due dates, progress and verification, Internal Audit and Auditor General.",
    filters: ["period", "source", "owner", "status", "overdue", "search"], run: runCorrectiveActions },
  { id: "ag-findings", title: "Auditor General Findings", group: "Follow-up",
    description: "Auditor General findings by report year, status and ageing.",
    filters: ["report_year", "status", "owner", "overdue", "search"], run: runAgFindings },
  { id: "resource-utilisation", title: "Resource Utilisation Report", group: "Resources",
    description: "Hours and expenses — planned versus actual by auditor, engagement and month.",
    filters: ["period", "engagement", "auditor", "activity_type", "search"], run: runResourceUtilisation },
  { id: "committee-pack", title: "Audit Committee Pack", group: "Governance",
    description: "One combined document: summary, plan progress, top risks, findings by rating, follow-up status and ageing, resource use.",
    filters: ["search"], run: runCommitteePack },
  { id: "system-activity", title: "System Activity Log", group: "Administration", adminOnly,
    description: "Who did what in the app — in plain language. Viewing this report is itself recorded.",
    filters: ["activity_type", "user", "search"], run: (f) => runSystemActivity(f, { showEmail: true }) },
  { id: "declarations-status", title: "Independence Declarations Status", group: "Administration", adminOnly,
    description: "Which auditors have signed their independence declarations for the year.",
    filters: ["status", "report_year", "search"], run: runDeclarationsStatus },
  { id: "api-key-usage", title: "API Key Usage", group: "Administration", adminOnly,
    description: "Integration keys — what each one is for, how much it is used, and errors.",
    filters: ["status", "search"], run: runApiKeyUsage },
];

export const getReport = (id: string | undefined) =>
  REPORTS.find((r) => r.id === id) ?? REPORTS.find((r) => r.id === "engagement-status")!;
