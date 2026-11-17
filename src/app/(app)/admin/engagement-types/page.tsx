import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createEngagementType } from "@/lib/actions";

export const instant = false;

export default async function EngagementTypesPage() {
  const [rows, users] = await Promise.all([
    prisma.engagementType.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, email: true } }),
  ]);
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Engagement Types</h1>
        <CreateDialog
          title="Create Engagement Type"
          buttonLabel="Add Engagement Type"
          action={createEngagementType}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "description", label: "Description", placeholder: "Enter a description" },
            { name: "disabled", label: "Disabled", type: "checkbox" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((r) => ({
          ...r,
          updated_by_email: r.updated_by ? (emailById.get(r.updated_by) ?? r.updated_by) : "",
        })) as unknown as object[]}
        colDefs={[
          { field: "name", headerName: "Name", flex: 2 },
          { field: "description", headerName: "Description", flex: 3 },
          { field: "disabled", headerName: "Disabled" },
          { field: "updated_at", headerName: "Last Updated", flex: 1.5 },
          { field: "updated_by_email", headerName: "Updated By", flex: 1.5 },
        ]}
      />
    </div>
  );
}
