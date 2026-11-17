import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createGuidingDocument } from "@/lib/actions";

export const instant = false;

export default async function GuidingDocumentsPage() {
  const [rows, users] = await Promise.all([
    prisma.guidingDocument.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      orderBy: { updated_at: "desc" },
    }),
    prisma.user.findMany({ where: { organization_id: DEMO_ORGANIZATION_ID } }),
  ]);
  const email = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Guiding Documents</h1>
        <CreateDialog
          title="Create Guiding Document"
          buttonLabel="Create Guiding Document"
          action={createGuidingDocument}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "description", label: "Description", placeholder: "Enter a description" },
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
        rowActions={["files"]}
        filesEntity="guiding_document"
        colDefs={[
          { field: "name", headerName: "Name", flex: 2 },
          { field: "description", headerName: "Description", flex: 2 },
          { field: "updated_at", headerName: "Last Updated" },
          { field: "updated_by", headerName: "Updated By" },
        ]}
      />
    </div>
  );
}
