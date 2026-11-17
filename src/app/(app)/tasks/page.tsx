import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { createTask, updateTaskStatus } from "@/lib/actions";

export const instant = false;

const stages = ["Independence Assessment", "Engagement Planning", "Engagement Audit Program", "Engagement Fieldwork", "Engagement Reporting"].map((s) => ({ value: s, label: s }));

export default async function TasksPage() {
  const [rows, engagements, users] = await Promise.all([
    prisma.task.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_engagement: true, r_assignee: true },
      orderBy: { due_date: "asc" },
    }),
    prisma.engagement.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">Tasks &amp; Scheduling</h1>
        <CreateDialog
          title="Add Task"
          buttonLabel="Add Task"
          action={createTask}
          fields={[
            { name: "title", label: "Title", required: true },
            { name: "description", label: "Description", type: "textarea" },
            { name: "engagement_id", label: "Engagement", type: "select", options: engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id })) },
            { name: "stage", label: "Stage", type: "select", options: stages },
            { name: "assignee_user_id", label: "Assignee", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) },
            { name: "due_date", label: "Due Date", type: "date", required: true },
          ]}
        />
      </div>
      <DataGrid
        rows={rows.map((t) => ({
          ...t,
          assignee_name: t.r_assignee ? `${t.r_assignee.first_name} ${t.r_assignee.last_name}` : "",
          status_label: (t.status ?? "").replaceAll("_", " "),
          due_date: t.due_date?.toISOString().slice(0, 10),
        })) as unknown as object[]}
        rowActions={["workflow"]}
        workflow={{ steps: ["OPEN", "IN_PROGRESS", "DONE"], onAdvance: updateTaskStatus }}
        heightClass="h-[70vh]"
        colDefs={[
          { field: "title", headerName: "Task", flex: 2 },
          { field: "r_engagement.engagement_name", headerName: "Engagement", flex: 1.6 },
          { field: "stage", headerName: "Stage" },
          { field: "assignee_name", headerName: "Assignee" },
          { field: "due_date", headerName: "Due Date" },
          { field: "status_label", headerName: "Status" },
          { field: "escalated", headerName: "Escalated" },
        ]}
      />
    </div>
  );
}
