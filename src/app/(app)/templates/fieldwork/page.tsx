import Link from "next/link";
import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";

export const instant = false;

const STATUS_LABEL: Record<string, string> = { DRAFT: "Draft", APPROVED: "Approved", RETIRED: "Retired" };

export default async function FieldworkTemplatesPage() {
  const [rows, users] = await Promise.all([
    prisma.planningDocumentTemplate.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, section: "fieldwork" },
      orderBy: { reference: "asc" },
    }),
    prisma.user.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  const email = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <nav className="flex border-b text-sm">
        <Link href="/templates/planning" className="-mb-px border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground">Planning</Link>
        <Link href="/templates/fieldwork" className="-mb-px border-b-2 border-orange-600 px-4 py-2.5 font-medium text-orange-600">Fieldwork</Link>
        <Link href="/templates/reporting" className="-mb-px border-b-2 border-transparent px-4 py-2.5 font-medium text-muted-foreground hover:text-foreground">Reporting</Link>
      </nav>
      <h1 className="text-2xl font-semibold">Fieldwork Templates</h1>
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          status_label: STATUS_LABEL[r.status ?? ""] ?? "Draft",
          updated_by: email.get(r.updated_by ?? "") ?? r.updated_by ?? "Not recorded",
          updated_at: r.updated_at ? r.updated_at.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded",
        })) as unknown as object[]}
        hrefPattern="/templates/planning/{id}"
        rowActions={["edit", "files"]}
        filesEntity="planning_template"
        colDefs={[
          { field: "reference", headerName: "Reference", width: 110 },
          { field: "name", headerName: "Name", flex: 2, tooltipField: "name" },
          { field: "version", headerName: "Version", width: 90 },
          { field: "status_label", headerName: "Status", width: 110 },
          { field: "required", headerName: "Required", cellRenderer: "agCheckboxCellRenderer", width: 110 },
          { field: "updated_at", headerName: "Last updated", flex: 1.4 },
          { field: "updated_by", headerName: "Updated by", flex: 1.4, tooltipField: "updated_by" },
        ]}
      />
    </div>
  );
}
