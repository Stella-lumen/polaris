import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { isHighRisk, DEFAULT_BANDS } from "@/lib/risk";
import { fmtRand } from "@/lib/resource-logic";

export const instant = false;

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", SUBMITTED: "Submitted", AUTHORISED: "Authorised", CLOSED: "Closed" };

export default async function AnnualAuditPlanPage() {
  const [rows, bands, risks, planned] = await Promise.all([
    prisma.annualAuditPlan.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_period: true, r_prepared_by: true, r_authorised_by: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      select: { id: true, residual_score: true, linked_planned_engagement_id: true },
    }),
    prisma.plannedEngagement.findMany({ where: { deleted: false }, select: { annual_audit_plan_id: true, planned_budget: true } }),
  ]);
  const bandList = bands.length ? bands : DEFAULT_BANDS;
  const high = risks.filter((r) => isHighRisk(r.residual_score, bandList));
  const uncoveredHigh = high.filter((r) => r.linked_planned_engagement_id == null).length;
  const finalised = rows.some((r) => r.authorised_date != null);
  const byPlan = new Map<string, { count: number; budget: number }>();
  for (const p of planned) {
    const cur = byPlan.get(p.annual_audit_plan_id ?? "") ?? { count: 0, budget: 0 };
    cur.count++; cur.budget += Number(p.planned_budget ?? 0);
    byPlan.set(p.annual_audit_plan_id ?? "", cur);
  }
  const authorised = rows.filter((r) => r.status === "AUTHORISED").length;
  const awaiting = rows.filter((r) => r.status === "SUBMITTED").length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annual audit plans</h1>
        <Link href="/annual-audit-plan/add" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">Create annual audit plan</Link>
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded bg-zinc-100 px-2 py-1">Plans: {rows.length}</span>
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-800">Authorised: {authorised}</span>
        <span className={`rounded px-2 py-1 ${awaiting ? "bg-amber-100 text-amber-800" : "bg-zinc-100"}`}>Awaiting approval: {awaiting}</span>
        <span className={`rounded px-2 py-1 ${uncoveredHigh ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>High risks covered: {high.length - uncoveredHigh} of {high.length}</span>
      </div>
      {finalised && uncoveredHigh > 0 && (
        <a href="/risk-assessment?covered=false&band=high" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠ An audit plan is authorised while {uncoveredHigh} High/Extreme risk{uncoveredHigh === 1 ? "" : "s"} remain{uncoveredHigh === 1 ? "s" : ""} uncovered — review coverage
        </a>
      )}
      <DataGrid
        rows={rows.map((r) => {
          const agg = byPlan.get(r.id) ?? { count: 0, budget: 0 };
          return {
            ...r,
            status_label: STATUS_LABEL[r.status ?? ""] ?? "Draft",
            planned_count: agg.count || "—",
            coverage: `${high.length - uncoveredHigh}/${high.length}`,
            budget: agg.budget ? fmtRand(agg.budget) : "—",
            same_person: r.prepared_by_id && r.prepared_by_id === r.authorised_by_id ? "Same person" : "",
            prepared_by_name: r.r_prepared_by ? `${r.r_prepared_by.first_name} ${r.r_prepared_by.last_name}` : "Not recorded",
            authorised_by_name: r.r_authorised_by ? `${r.r_authorised_by.first_name} ${r.r_authorised_by.last_name}` : "Not recorded",
            prepared_date: r.prepared_date ? r.prepared_date.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "—",
            authorised_date: r.authorised_date ? r.authorised_date.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "—",
          };
        }) as unknown as object[]}
        hrefPattern="/annual-audit-plan/{id}"
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.6, tooltipField: "name" },
          { field: "status_label", headerName: "Status", width: 110 },
          { field: "description", headerName: "Description", flex: 2, tooltipField: "description" },
          { field: "r_period.name", headerName: "Period", width: 160, tooltipField: "r_period.name" },
          { field: "planned_count", headerName: "Engagements", width: 115, type: "rightAligned" },
          { field: "coverage", headerName: "Risks covered", width: 115 },
          { field: "budget", headerName: "Budget", width: 130 },
          { field: "same_person", headerName: "", width: 110, tooltipField: "same_person" },
          { field: "prepared_by_name", headerName: "Prepared by", width: 160, tooltipField: "prepared_by_name" },
          { field: "authorised_by_name", headerName: "Authorised by", width: 160, tooltipField: "authorised_by_name" },
        ]}
      />
    </div>
  );
}
