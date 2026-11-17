import { prisma } from "@/lib/db";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { EditDialog } from "@/components/edit-dialog";
import { createOrganization, updateOrganization, setOrganizationDisabled } from "@/lib/actions";

export const instant = false;

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: editId } = await searchParams;
  const rows = await prisma.organization.findMany({
    where: { deleted: false },
    orderBy: { created_at: "asc" },
  });
  const editRow = rows.find((r) => r.id === editId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <CreateDialog
          title="Add Organization"
          buttonLabel="Add Organization"
          action={createOrganization}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "clerk_id", label: "External ID", placeholder: "Enter an external ID" },
            { name: "disabled", label: "Disabled", type: "checkbox" },
          ]}
        />
      </div>
      <DataGrid
        rows={rows as unknown as object[]}
        hrefPattern="/admin/organizations?id={id}"
        rowActions={["edit", "toggle"]}
        toggle={{ field: "disabled", onToggle: setOrganizationDisabled, labels: ["Enable", "Disable"] }}
        rowStyleRules={[{ field: "disabled", when: true, style: { background: "#fecaca" } }]}
        colDefs={[
          { field: "name", headerName: "Name", flex: 2 },
          { field: "clerk_id", headerName: "External ID", flex: 2 },
          { field: "disabled", headerName: "Disabled", width: 110 },
        ]}
      />
      {editRow && (
        <EditDialog
          title="Edit Organization"
          returnPath="/admin/organizations"
          action={updateOrganization.bind(null, editRow.id)}
          values={{
            name: editRow.name,
            clerk_id: editRow.clerk_id,
            disabled: editRow.disabled,
          }}
          fields={[
            { name: "name", label: "Name", required: true, placeholder: "Enter a name" },
            { name: "clerk_id", label: "External ID", placeholder: "Enter an external ID" },
            { name: "disabled", label: "Disabled", type: "checkbox" },
          ]}
        />
      )}
    </div>
  );
}
