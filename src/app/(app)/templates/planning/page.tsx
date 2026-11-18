import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createPlanningTemplate } from "@/lib/actions";

export const instant = false;

export default async function PlanningTemplatesPage() {
  const [rows, users] = await Promise.all([
    prisma.planningDocumentTemplate.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, OR: [{ section: null }, { section: "planning" }] },
      orderBy: { reference: "asc" },
    }),
    prisma.user.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  const email = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex border-b text-sm">
        <Link href="/templates/planning" className="-mb-px border-b-2 border-orange-600 px-4 py-2.5 font-medium text-orange-600">Planning</Link>
        <Link href="/templates/fieldwork" className="-mb-px border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground">Fieldwork</Link>
        <Link href="/templates/reporting" className="-mb-px border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground">Reporting</Link>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Planning Templates</h1>
        <CreateDialog
          title="Create Planning Template"
          buttonLabel="Create Planning Template"
          action={createPlanningTemplate}
          fields={[
            {
              name: "template_type", label: "Template Type", type: "select",
              options: [{ value: "custom", label: "Custom" }],
            },
            { name: "name", label: "Name", required: true },
            { name: "reference", label: "Reference", required: true },
            { name: "files", label: "Files", type: "file" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          updated_by: email.get(r.updated_by ?? "") ?? r.updated_by,
          updated_at: r.updated_at?.toISOString() ?? null,
        })) as unknown as object[]}
        hrefPattern="/templates/planning/{id}"
        rowActions={["files"]}
        filesEntity="planning_template"
        colDefs={[
          { field: "reference", headerName: "Reference", width: 110 },
          { field: "name", headerName: "Name", flex: 2, tooltipField: "name" },
          { field: "version", headerName: "Version", width: 90 },
          { field: "status", headerName: "Status", width: 110 },
          { field: "required", headerName: "Required", cellRenderer: "agCheckboxCellRenderer", width: 110 },
          { field: "updated_at", headerName: "Last updated", flex: 1.4 },
          { field: "updated_by", headerName: "Updated by", flex: 1.4, tooltipField: "updated_by" },
        ]}
      />
    </div>
  );
}
