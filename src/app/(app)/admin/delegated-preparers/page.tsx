import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { addDelegatedPreparer } from "@/lib/actions";

export const instant = false;

export default async function DelegatedPreparersPage() {
  const [rows, candidates] = await Promise.all([
    prisma.user.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, role: "org:delegated_preparer" },
    }),
    prisma.user.findMany({
      where: {
        deleted: false, disabled: false, organization_id: DEMO_ORGANIZATION_ID,
        role: { in: ["org:member", "org:delegated_preparer"] },
      },
      orderBy: { first_name: "asc" },
    }),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Delegated Preparers</h1>
        <CreateDialog
          title="Add Delegated Preparer"
          buttonLabel="Add Delegated Preparer"
          action={addDelegatedPreparer}
          fields={[
            {
              name: "user_id", label: "User", type: "select", required: true, placeholder: "Select a user",
              options: candidates.map((u) => ({
                value: u.id,
                label: `${u.first_name} ${u.last_name}`,
              })),
            },
          ]}
        />
      </div>
      <DataGrid
        rows={rows as unknown as object[]}
        colDefs={[
          { field: "first_name", headerName: "First Name" },
          { field: "last_name", headerName: "Last Name" },
          { field: "email", headerName: "Email", flex: 2 },
        ]}
      />
    </div>
  );
}
