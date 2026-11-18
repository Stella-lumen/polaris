import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DataGrid } from "@/components/data-grid";

const STATUS_LABEL: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", READY_FOR_REVIEW: "Ready for review", RETURNED: "Sent back", DONE: "Done" };

export default async function EngagementTasksPage({ params }: { params: Promise<{ engagement_id: string }> }) {
  const { engagement_id } = await params;
  const engagement = await prisma.engagement.findUnique({ where: { id: engagement_id } });
  if (!engagement) notFound();
  const tasks = await prisma.task.findMany({ where: { engagement_id, deleted: false }, include: { r_assignee: true }, orderBy: { due_date: "asc" } });
  const now = Date.now();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-primary">Tasks</h2>
        <Link href="/tasks" className="rounded-md border border-primary px-3 py-1.5 text-xs text-primary">Open full task list</Link>
      </div>
      {tasks.length === 0 && <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">No tasks for this engagement. Generate standard tasks from the <Link href="/tasks" className="text-primary underline">tasks page</Link>.</div>}
      <DataGrid
        rows={tasks.map((t) => {
          const overdue = t.due_date && t.due_date.getTime() < now && t.status !== "DONE" ? Math.floor((now - t.due_date.getTime()) / 864e5) : 0;
          return {
            id: t.id,
            title: t.title,
            stage: t.stage ?? "—",
            assignee: t.r_assignee ? `${t.r_assignee.first_name} ${t.r_assignee.last_name}` : "Not assigned",
            due: t.due_date?.toISOString().slice(0, 10) ?? "—",
            status: STATUS_LABEL[t.status ?? ""] ?? "Open",
            flag: overdue ? `Overdue by ${overdue} day${overdue === 1 ? "" : "s"}` : "",
          };
        }) as unknown as object[]}
        hrefPattern="/tasks/{id}"
        colDefs={[
          { field: "title", headerName: "Task", flex: 2, tooltipField: "title" },
          { field: "stage", headerName: "Stage", width: 130 },
          { field: "assignee", headerName: "Assignee", width: 160, tooltipField: "assignee" },
          { field: "due", headerName: "Due", width: 110 },
          { field: "status", headerName: "Status", width: 140 },
          { field: "flag", headerName: "", width: 140, tooltipField: "flag" },
        ]}
      />
    </div>
  );
}
