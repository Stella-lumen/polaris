import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createCorrectiveAction, updateCorrectiveAction } from "@/lib/actions";

export const instant = false;

async function advanceAction(id: string, status: string) {
  "use server";
  const fd = new FormData();
  fd.set("status", status);
  fd.set("progress", status === "VERIFIED" ? "100" : status === "IMPLEMENTED" ? "90" : status === "IN_PROGRESS" ? "50" : "0");
  await updateCorrectiveAction(id, fd);
}

export default async function FollowUpPage() {
  const [rows, findings, users] = await Promise.all([
    prisma.correctiveAction.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_finding: { include: { r_engagement: true } }, r_owner: true },
      orderBy: { due_date: "asc" },
    }),
    prisma.engagementFindingAndRecommendations.findMany({
      where: { deleted: false },
      include: { r_engagement: true },
    }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Follow-up — Corrective Actions</h1>
        <CreateDialog
          title="Add Corrective Action"
          buttonLabel="Add Action"
          action={createCorrectiveAction}
          fields={[
            { name: "finding_id", label: "Finding", type: "select", required: true, options: findings.map((f) => ({ value: f.id, label: `${f.r_engagement?.engagement_name ?? ""} — ${(f.detailed_finding ?? "").slice(0, 60)}` })) },
            { name: "action_description", label: "Corrective Action", type: "textarea", required: true },
            { name: "owner_user_id", label: "Owner", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) },
            { name: "due_date", label: "Due Date", type: "date", required: true },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((a) => ({
          id: a.id,
          action_description: a.action_description,
          status: a.status,
          progress: a.progress,
          r_finding: { detailed_finding: a.r_finding?.detailed_finding },
          owner_name: a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "",
          status_label: (a.status ?? "").replaceAll("_", " "),
          due_date: a.due_date?.toISOString().slice(0, 10),
          verified_date: a.verified_date?.toISOString().slice(0, 10),
        })) as unknown as object[]}
        rowActions={["workflow"]}
        workflow={{ steps: ["OPEN", "IN_PROGRESS", "IMPLEMENTED", "VERIFIED"], onAdvance: advanceAction }}
        heightClass="h-[70vh]"
        colDefs={[
          { field: "r_finding.detailed_finding", headerName: "Finding", flex: 2 },
          { field: "action_description", headerName: "Corrective Action", flex: 2 },
          { field: "owner_name", headerName: "Owner" },
          { field: "due_date", headerName: "Due Date" },
          { field: "status_label", headerName: "Status" },
          { field: "progress", headerName: "% Done" },
          { field: "verified_date", headerName: "Verified" },
        ]}
      />
    </div>
  );
}
