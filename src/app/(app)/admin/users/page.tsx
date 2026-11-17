import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createUser, setUserDisabled } from "@/lib/actions";

export const instant = false;

const ROLE_LABELS: Record<string, string> = {
  "org:admin": "AppAdmin",
  "org:chief_audit_executive": "Chief Audit Executive",
  "org:member": "Member",
  "org:regulator": "Regulator",
  "org:delegated_preparer": "Delegated Preparer",
};

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: { first_name: "asc" },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <CreateDialog
          title="Create User"
          buttonLabel="Add User"
          action={createUser}
          fields={[
            { name: "first_name", label: "First Name", required: true },
            { name: "last_name", label: "Last Name", required: true },
            { name: "email", label: "Email", required: true },
            {
              name: "role", label: "Role", type: "select", required: true,
              options: [
                { value: "org:member", label: "Member" },
                { value: "org:regulator", label: "Regulator" },
                { value: "org:chief_audit_executive", label: "Chief Audit Executive" },
                { value: "org:admin", label: "AppAdmin" },
                { value: "org:delegated_preparer", label: "Delegated Preparer" },
              ],
            },
            { name: "password", label: "Password (blank = demo default)", placeholder: "Initial password" },
          ]}
        />
      </div>
      <DataGrid
        rows={users.map((u) => ({
          ...u,
          role_label: u.role ? (ROLE_LABELS[u.role] ?? u.role) : "",
        })) as unknown as object[]}
        rowActions={["toggle"]}
        toggle={{
          field: "disabled",
          onToggle: setUserDisabled,
          labels: ["Disable", "Enable"],
        }}
        colDefs={[
          { field: "first_name", headerName: "First Name" },
          { field: "last_name", headerName: "Last Name" },
          { field: "email", headerName: "Email", flex: 2 },
          { field: "role_label", headerName: "Role" },
          { field: "disabled", headerName: "Disabled", cellRenderer: "agCheckboxCellRenderer", width: 110 },
        ]}
      />
    </div>
  );
}
