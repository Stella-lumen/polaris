import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { getReport, REPORTS, CA_SOURCES } from "@/lib/reports/catalogue";
import { PERIOD_OPTIONS, fyLabel } from "@/lib/reports/filters";
import { ReportsClient, type FilterOptionSet } from "@/components/reports-client";
import { ReportLists } from "@/components/report-lists";
import type { FilterValues } from "@/lib/reports/types";

export const instant = false;

const ADMIN_ROLES = new Set(["org:admin", "org:chief_audit_executive"]);

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requireUser();
  const isAdmin = ADMIN_ROLES.has(user.role ?? "");
  const sp = await searchParams;

  const catalogue = REPORTS.filter((r) => !r.adminOnly || isAdmin);
  const requested = sp.report && catalogue.find((r) => r.id === sp.report) ? sp.report : "engagement-status";
  const report = getReport(requested);

  const filters: FilterValues = {};
  for (const k of ["period", "from", "to", "engagement", "status", "engagement_type", "lead_auditor", "risk_rating", "category", "source", "auditor", "assignee", "activity_type", "owner", "overdue", "report_year", "search", "user", "signins"] as const) {
    if (sp[k]) filters[k] = sp[k]!;
  }

  // Viewing the System Activity Log is itself logged.
  if (report.id === "system-activity") {
    await logAudit("Reports", report.id, "VIEW", { message: "Viewed the System Activity Log" }, { recordLabel: report.title });
  }

  const dataAt = new Date();
  const result = await report.run(filters);

  // ---- filter option lists ----
  const [engagements, types, users, bands, risks, agYears, stages] = await Promise.all([
    prisma.engagement.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { engagement_name: true }, orderBy: { engagement_name: "asc" } }),
    prisma.engagementType.findMany({ where: { deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID }, select: { name: true }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false }, select: { id: true, first_name: true, last_name: true }, orderBy: { first_name: "asc" } }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
    prisma.riskAssessment.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { risk_category: true } }),
    prisma.correctiveAction.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, source: "AUDITOR_GENERAL" }, select: { ag_report_year: true }, distinct: ["ag_report_year"] }),
    prisma.task.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { stage: true }, distinct: ["stage"] }),
  ]);
  const userOpts = users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` }));
  const userNameOpts = users.map((u) => ({ value: `${u.first_name} ${u.last_name}`, label: `${u.first_name} ${u.last_name}` }));

  const STATUS_OPTIONS: Record<string, { value: string; label: string }[]> = {
    "engagement-status": ["Not started", "In progress", "Completed"].map((v) => ({ value: v, label: v })),
    "plan-progress": ["PLANNED", "IN_PROGRESS", "COMPLETED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    findings: ["OPEN", "UNDER_REVIEW", "CLEARED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    "corrective-actions": ["IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "REOPENED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    "ag-findings": ["IN_PROGRESS", "IMPLEMENTED", "VERIFIED", "REOPENED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    "task-schedule": ["NOT_STARTED", "IN_PROGRESS", "DONE", "COMPLETED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    "declarations-status": ["Signed", "Pending"].map((v) => ({ value: v, label: v })),
    "api-key-usage": ["Active", "Disabled", "Revoked", "Expired"].map((v) => ({ value: v, label: v })),
    "risk-register": ["OPEN", "MONITORING", "CLOSED"].map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
  };

  const [saved, schedules] = await Promise.all([
    prisma.savedReport.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, OR: [{ user_id: user.id }, { shared: true }] },
      orderBy: { created_at: "desc" },
    }),
    prisma.scheduledReport.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { next_run_at: "asc" },
    }),
  ]);
  const titleOf = (id: string | null) => REPORTS.find((r) => r.id === id)?.title ?? id ?? "";

  const optionSet: FilterOptionSet = {
    period: PERIOD_OPTIONS,
    engagement: engagements.map((e) => e.engagement_name ?? "").filter(Boolean).map((v) => ({ value: v, label: v })),
    status: STATUS_OPTIONS[report.id] ?? [],
    engagement_type: types.map((t) => t.name ?? "").filter(Boolean).map((v) => ({ value: v, label: v })),
    lead_auditor: userOpts,
    auditor: userOpts,
    assignee: userOpts,
    owner: report.id === "risk-register" ? userOpts : userOpts,
    user: userNameOpts,
    risk_rating: bands.map((b) => ({ value: b.label ?? "", label: b.label ?? "" })).filter((o) => o.value),
    category: [...new Set(risks.map((r) => r.risk_category).filter((v): v is string => !!v))].map((v) => ({ value: v, label: v })),
    source: CA_SOURCES,
    activity_type:
      report.id === "system-activity"
        ? [
            { value: "changes", label: "Changes" },
            { value: "signins", label: "Sign-ins" },
            { value: "reminders", label: "Reminders & escalations" },
            { value: "api", label: "API use" },
            { value: "reports", label: "Reports & exports" },
          ]
        : stages.map((s) => s.stage).filter((v): v is string => !!v).map((v) => ({ value: v, label: v.replaceAll("_", " ") })),
    overdue: [{ value: "yes", label: "Overdue only" }],
    report_year: agYears.map((y) => y.ag_report_year).filter((v): v is number => v != null).sort().map((v) => ({ value: String(v), label: String(v) })),
  };

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-primary">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Choose a report, filter it, preview it, then export it as a committee-ready document.
          </p>
        </div>
        <span className="shrink-0 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {fyLabel()} · data as at {dataAt.toLocaleString("en-ZA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <ReportsClient
        reports={catalogue.map((r) => ({ id: r.id, title: r.title, group: r.group, description: r.description, filters: r.filters }))}
        reportId={report.id}
        filters={filters}
        options={optionSet}
        result={result}
        orgName="AgriSETA"
        isAdmin={isAdmin}
      />
      <ReportLists
        saved={saved.map((s) => ({
          id: s.id, name: s.name ?? "", reportId: s.report_id ?? "", reportTitle: titleOf(s.report_id),
          filters: (s.filters_json as Record<string, string>) ?? {}, shared: s.shared, mine: s.user_id === user.id,
        }))}
        schedules={schedules.map((s) => ({
          id: s.id, name: s.name ?? "", reportTitle: titleOf(s.report_id), cadence: s.cadence ?? "",
          day: s.day_of_month ?? 1, format: s.format ?? "pdf",
          recipients: (s.recipients_json as string[]) ?? [],
          next: s.next_run_at ? s.next_run_at.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Johannesburg" }) : "",
          paused: s.paused,
        }))}
      />
    </div>
  );
}
