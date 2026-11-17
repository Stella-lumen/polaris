import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createReportTemplate } from "@/lib/actions";

export const instant = false;

export default async function ReportingTemplatesPage() {
  const [rows, users] = await Promise.all([
    prisma.reportDocumentTemplate.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { reference: "asc" },
    }),
    prisma.user.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  const email = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex border-b text-sm">
        <Link href="/templates/planning" className="-mb-px border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground">Planning</Link>
        <Link href="/templates/reporting" className="-mb-px border-b-2 border-orange-600 px-4 py-2.5 font-medium text-orange-600">Reporting</Link>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Report Templates</h1>
        <CreateDialog
          title="Create Report Template"
          buttonLabel="Create Report Template"
          action={createReportTemplate}
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
        hrefPattern="/templates/reporting?id={id}"
        rowActions={["edit", "files"]}
        filesEntity="report_template"
        colDefs={[
          { field: "name", headerName: "Name", flex: 2 },
          { field: "reference", headerName: "Reference" },
          { field: "required", headerName: "Required", cellRenderer: "agCheckboxCellRenderer", width: 110 },
          { field: "updated_at", headerName: "Last Updated", flex: 1.4 },
          { field: "updated_by", headerName: "Updated By", flex: 1.4 },
        ]}
      />
    </div>
  );
}
