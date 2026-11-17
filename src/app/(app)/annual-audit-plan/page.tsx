import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";

export const instant = false;

export default async function AnnualAuditPlanPage() {
  const rows = await prisma.annualAuditPlan.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    include: { r_period: true, r_prepared_by: true, r_authorised_by: true },
    orderBy: { created_at: "desc" },
  });
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
