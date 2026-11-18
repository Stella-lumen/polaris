import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { isHighRisk, DEFAULT_BANDS } from "@/lib/risk";

export const instant = false;

export default async function AnnualAuditPlanPage() {
  const [rows, bands, uncoveredRisks] = await Promise.all([
    prisma.annualAuditPlan.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_period: true, r_prepared_by: true, r_authorised_by: true },
      orderBy: { created_at: "desc" },
    }),
    prisma.riskRatingBand.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { min_score: "asc" } }),
    prisma.riskAssessment.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, linked_planned_engagement_id: null },
      select: { id: true, residual_score: true },
    }),
  ]);
  const bandList = bands.length ? bands : DEFAULT_BANDS;
  const uncoveredHigh = uncoveredRisks.filter((r) => isHighRisk(r.residual_score, bandList)).length;
  const finalised = rows.some((r) => r.authorised_date != null);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annual Audit Plans</h1>
        <Link
          href="/annual-audit-plan/add"
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Create Annual Audit Plan
        </Link>
      </div>
      {finalised && uncoveredHigh > 0 && (
        <a href="/risk-assessment?covered=false&band=high" className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          ⚠ An audit plan is authorised while {uncoveredHigh} High/Extreme risk{uncoveredHigh === 1 ? "" : "s"} remain{uncoveredHigh === 1 ? "s" : ""} uncovered — review coverage
        </a>
      )}
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          prepared_by_name: r.r_prepared_by ? `${r.r_prepared_by.first_name} ${r.r_prepared_by.last_name}` : null,
          authorised_by_name: r.r_authorised_by ? `${r.r_authorised_by.first_name} ${r.r_authorised_by.last_name}` : null,
          prepared_date: r.prepared_date?.toISOString() ?? null,
          authorised_date: r.authorised_date?.toISOString() ?? null,
        })) as unknown as object[]}
        hrefPattern="/annual-audit-plan/{id}"
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.6 },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "r_period.name", headerName: "Period" },
          { field: "prepared_by_name", headerName: "Prepared By", flex: 1.2 },
          { field: "prepared_date", headerName: "Prepared Date", flex: 1.4 },
          { field: "authorised_by_name", headerName: "Authorised By", flex: 1.2 },
          { field: "authorised_date", headerName: "Authorised Date", flex: 1.4 },
        ]}
      />
    </div>
  );
}
