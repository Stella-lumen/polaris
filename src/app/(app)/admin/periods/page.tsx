import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createPeriod } from "@/lib/actions";

export const instant = false;

export default async function PeriodsPage() {
  const [rows, users] = await Promise.all([
    prisma.annualAuditPlanPeriod.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, email: true } }),
  ]);
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Annual Audit Plan Periods</h1>
        <CreateDialog
          title="Create Annual Audit Plan Period"
          buttonLabel="Add Period"
          action={createPeriod}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "description", label: "Description", placeholder: "Enter a description" },
            { name: "start_date", label: "Start Date", type: "date" },
            { name: "end_date", label: "End Date", type: "date" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          start_date: r.start_date?.toISOString().slice(0, 10) ?? null,
          end_date: r.end_date?.toISOString().slice(0, 10) ?? null,
          updated_at: r.updated_at?.toISOString() ?? null,
          updated_by_email: r.updated_by ? (emailById.get(r.updated_by) ?? r.updated_by) : "",
        })) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "Name", flex: 2 },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "start_date", headerName: "Start Date" },
          { field: "end_date", headerName: "End Date" },
          { field: "updated_at", headerName: "Last Updated", flex: 1.4 },
          { field: "updated_by_email", headerName: "Updated By", flex: 1.4 },
        ]}
      />
    </div>
  );
}
