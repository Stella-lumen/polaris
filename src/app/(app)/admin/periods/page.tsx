import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { AddFinancialYearDialog } from "@/components/add-financial-year-dialog";
import { createPeriod, setPeriodStatus } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { PERIOD_TYPES, typeLabel, statusLabel, periodWarnings } from "@/lib/period-validation";

export const instant = false;

export default async function PeriodsPage() {
  const user = await requireUser();
  const admin = canAuthorise(user);
  const [rows, users, planCounts] = await Promise.all([
    prisma.annualAuditPlanPeriod.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { start_date: "asc" },
    }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, email: true, first_name: true, last_name: true } }),
    prisma.annualAuditPlan.groupBy({ by: ["period_id"], where: { deleted: false }, _count: true }),
  ]);
  const nameById = new Map(users.map((u) => [u.id, `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.email]));
  const plansByPeriod = new Map(planCounts.map((c) => [c.period_id, c._count]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Annual audit plan periods</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Financial years, quarters and special reviews that audit plans are linked to.
            Open a period to see its plans and status.
          </p>
        </div>
        {admin && (
          <div className="flex gap-2">
            <AddFinancialYearDialog />
            <CreateDialog
              title="Add period"
              buttonLabel="Add period"
              action={createPeriod}
              fields={[
                { name: "name", label: "Name", required: true, placeholder: "e.g. 2026/27 Quarter 1" },
                { name: "description", label: "Description", placeholder: "Optional" },
                { name: "period_type", label: "Type", type: "select", required: true, options: PERIOD_TYPES.map((t) => ({ value: t.value, label: t.label })) },
                { name: "start_date", label: "Start date", type: "date", required: true },
                { name: "end_date", label: "End date", type: "date", required: true },
              ]}
            />
          </div>
        )}
      </div>
      <DataGrid
        hrefPattern="/admin/periods/{id}"
        rowActions={admin ? ["edit", "workflow"] : []}
        workflow={{ steps: ["OPEN", "CLOSED", "ARCHIVED"], onAdvance: setPeriodStatus }}
        pageSize={50}
        rows={rows.map((r) => {
          const warns = periodWarnings(r);
          return {
            id: r.id,
            name: r.name ?? "Not assigned",
            period_type: typeLabel(r.period_type),
            description: r.description?.trim() || "Not assigned",
            start_date: fmtDate(r.start_date),
            end_date: fmtDate(r.end_date),
            status: r.status ?? "OPEN",
            plans: plansByPeriod.get(r.id) ?? 0,
            warning: warns.length ? warns.join(" · ") : "",
            updated_at: fmtDateTime(r.updated_at),
            updated_by: r.updated_by ? nameById.get(r.updated_by) ?? "Not assigned" : "Not assigned",
          };
        }) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "Name", flex: 1.8, tooltipField: "name" },
          { field: "period_type", headerName: "Type", width: 130 },
          { field: "description", headerName: "Description", flex: 2, tooltipField: "description" },
          { field: "start_date", headerName: "Starts", width: 125 },
          { field: "end_date", headerName: "Ends", width: 125 },
          { field: "status", headerName: "Status", width: 100 },
          { field: "plans", headerName: "Plans", width: 85 },
          { field: "warning", headerName: "Warning", flex: 1.6, tooltipField: "warning" },
          { field: "updated_at", headerName: "Last updated", width: 185 },
          { field: "updated_by", headerName: "Updated by", width: 150, tooltipField: "updated_by" },
        ]}
      />
    </div>
  );
}
