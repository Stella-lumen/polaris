import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createStrategicObjective } from "@/lib/actions";

export const instant = false;

export default async function StrategicObjectivesPage() {
  const rows = await prisma.strategicObjective.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { sort_order: "asc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Strategic Objectives</h1>
        <CreateDialog
          title="Add Strategic Objective"
          buttonLabel="Add Objective"
          action={createStrategicObjective}
          fields={[
            { name: "name", label: "Objective", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "sort_order", label: "Sort Order", type: "number" },
          ]}
        />
      </div>
      <p className="text-sm text-muted-foreground">
        Organisational objectives that risks on the register are aligned to (risk assessment → Strategic Objective).
      </p>
      <DataGrid
        rows={rows as unknown as object[]}
        colDefs={[
          { field: "sort_order", headerName: "#", width: 70 },
          { field: "name", headerName: "Objective", flex: 1.5 },
          { field: "description", headerName: "Description", flex: 2.5 },
        ]}
      />
    </div>
  );
}
