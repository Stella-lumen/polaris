import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { DataGrid } from "@/components/data-grid";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { createTask, updateTaskStatus, submitTaskForReview, approveTaskForm, sendBackTaskForm, generateStandardTasks } from "@/lib/actions";

export const instant = false;

const dstr = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "");
const STATUS: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", DONE: "Done" };
const REVIEW: Record<string, string> = { READY_FOR_REVIEW: "Ready for review", RETURNED: "Sent back", APPROVED: "Approved" };
const ESC: Record<number, string> = { 0: "None", 1: "Reminder sent", 2: "Supervisor informed", 3: "Escalated to Chief Audit Officer" };
const DAY = 86400_000;

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const me = await getSessionUser();
  const canReview = me ? canAuthorise(me) : false;
  const myOnly = sp.mine === "1";
  const teamOnly = sp.team === "1";

  const [stages, engagements, users, deps] = await Promise.all([
    prisma.taskStage.findMany({ where: { deleted: false }, orderBy: { sort: "asc" } }),
    prisma.engagement.findMany({ where: { deleted: false } }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
    prisma.taskDependency.findMany(),
  ]);
  const where = {
    deleted: false as const, organization_id: DEMO_ORGANIZATION_ID,
    ...(sp.engagement ? { engagement_id: sp.engagement } : {}),
    ...(sp.status ? { status: sp.status } : {}),
    ...(sp.stage ? { stage: sp.stage } : {}),
    ...(sp.priority ? { priority: sp.priority } : {}),
    ...(myOnly && me ? { assignee_user_id: me.id } : {}),
    ...(teamOnly && me ? { supervisor_user_id: me.id } : {}),
  };
  const tasks = await prisma.task.findMany({ where, include: { r_engagement: true, r_assignee: true }, orderBy: { due_date: "asc" } });
  const now = Date.now();
  const depMap = new Map<string, string[]>();
  for (const d of deps) if (d.task_id) depMap.set(d.task_id, [...(depMap.get(d.task_id) ?? []), d.depends_on_task_id ?? ""]);
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  const open = tasks.filter((t) => t.status === "OPEN").length;
  const inProg = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const ready = tasks.filter((t) => t.review_status === "READY_FOR_REVIEW").length;
  const overdue = tasks.filter((t) => t.due_date && t.due_date.getTime() < now && t.status !== "DONE").length;
  const due7 = tasks.filter((t) => t.due_date && t.due_date.getTime() >= now && t.due_date.getTime() < now + 7 * DAY && t.status !== "DONE").length;
  const doneMonth = tasks.filter((t) => t.status === "DONE" && t.completed_date && t.completed_date.getMonth() === new Date().getMonth()).length;

  const engagementOpts = engagements.map((e) => ({ value: e.id, label: e.engagement_name ?? e.id }));
  const userOpts = users.map((u) => ({ value: u.id, label: person(u) }));
  const stageOpts = stages.map((s) => ({ value: s.name ?? "", label: s.name ?? "" }));
  const taskOpts = tasks.map((t) => ({ value: t.id, label: (t.title ?? "").slice(0, 60) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm">
          <span>Open: <strong>{open}</strong></span>
          <span>In progress: <strong>{inProg}</strong></span>
          <span>Ready for review: <strong className={ready ? "text-amber-700" : ""}>{ready}</strong></span>
          <span>Overdue: <strong className={overdue ? "text-red-700" : ""}>{overdue}</strong></span>
          <span>Due in 7 days: <strong>{due7}</strong></span>
          <span>Done this month: <strong className="text-emerald-700">{doneMonth}</strong></span>
        </div>
        <div className="flex gap-2">
          <a href={`/tasks${myOnly ? "" : "?mine=1"}`} className={`rounded-md border px-3 py-1.5 text-sm ${myOnly ? "bg-orange-600 text-white" : ""}`}>My tasks</a>
          {canReview && <a href={`/tasks${teamOnly ? "" : "?team=1"}`} className={`rounded-md border px-3 py-1.5 text-sm ${teamOnly ? "bg-orange-600 text-white" : ""}`}>Team tasks</a>}
          <CreateDialog title="Add Task" buttonLabel="Add Task" action={createTask}
            fields={[
              { name: "title", label: "Task", required: true },
              { name: "description", label: "Description", type: "textarea" },
              { name: "engagement_id", label: "Engagement", type: "select", options: engagementOpts },
              { name: "stage", label: "Stage", type: "select", options: stageOpts },
              { name: "assignee_user_id", label: "Assignee", type: "select", required: true, options: userOpts },
              { name: "supervisor_user_id", label: "Supervisor (reviews the work)", type: "select", options: userOpts },
              { name: "priority", label: "Priority", type: "select", options: [{ value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }] },
              { name: "start_date", label: "Start date", type: "date" },
              { name: "due_date", label: "Due date", type: "date", required: true },
              { name: "planned_hours", label: "Planned hours", type: "number" },
            ]} />
        </div>
      </div>

      <form className="flex flex-wrap items-end gap-2 text-sm" action="/tasks" method="get">
        <select name="engagement" defaultValue={sp.engagement ?? ""} className="rounded border px-2 py-1"><option value="">All engagements</option>{engagementOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="stage" defaultValue={sp.stage ?? ""} className="rounded border px-2 py-1"><option value="">All stages</option>{stageOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
        <select name="status" defaultValue={sp.status ?? ""} className="rounded border px-2 py-1"><option value="">All statuses</option>{Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <select name="priority" defaultValue={sp.priority ?? ""} className="rounded border px-2 py-1"><option value="">All priorities</option><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select>
        <button className="rounded bg-orange-600 px-3 py-1 text-white">Apply</button>
        <a href="/tasks" className="px-2 py-1 text-muted-foreground hover:underline">Clear</a>
      </form>

      {canReview && engagements.length > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Generate standard tasks for:</span>
          {engagements.slice(0, 3).map((e) => (
            <form key={e.id} action={generateStandardTasks.bind(null, e.id)}><button className="rounded border px-2 py-1 text-xs hover:bg-accent">{e.engagement_name}</button></form>
          ))}
        </div>
      )}

      <DataGrid
        heightClass="h-[60vh]"
        hrefPattern="/tasks/{id}"
        rows={tasks.map((t) => {
          const daysOver = t.due_date ? Math.floor((now - t.due_date.getTime()) / DAY) : null;
          const daysTo = t.due_date ? Math.floor((t.due_date.getTime() - now) / DAY) : null;
          const depsOf = (depMap.get(t.id) ?? []).map((id) => taskById.get(id)).filter(Boolean);
          const waitingOn = depsOf.find((p) => p!.status !== "DONE" && p!.due_date && p!.due_date.getTime() < now);
          return {
            id: t.id,
            title: t.title,
            engagement: t.r_engagement?.engagement_name ?? "",
            stage: t.stage ?? "—",
            assignee: person(t.r_assignee),
            due_date: dstr(t.due_date),
            due_label: t.status === "DONE" ? "Done" : daysOver != null && daysOver > 0 ? `Overdue by ${daysOver} days` : daysTo != null && daysTo <= 7 ? `Due in ${daysTo} days` : "",
            status: t.review_status === "READY_FOR_REVIEW" ? "Ready for review" : t.review_status === "RETURNED" ? "Sent back" : STATUS[t.status ?? "OPEN"] ?? t.status,
            escalation: ESC[t.escalation_level ?? 0] ?? "None",
            waiting: waitingOn ? `Waiting on "${(waitingOn.title ?? "").slice(0, 40)}", which is ${Math.floor((now - waitingOn.due_date!.getTime()) / DAY)} days overdue` : "",
          };
        })}
        colDefs={[
          { field: "title", headerName: "Task", flex: 2, tooltipField: "title" },
          { field: "engagement", headerName: "Engagement", flex: 1.5, tooltipField: "engagement" },
          { field: "stage", headerName: "Stage", width: 140 },
          { field: "assignee", headerName: "Assignee", width: 150, tooltipField: "assignee" },
          { field: "due_date", headerName: "Due date", width: 105 },
          { field: "due_label", headerName: "Timing", width: 140, tooltipField: "waiting" },
          { field: "status", headerName: "Status", width: 140 },
          { field: "escalation", headerName: "Escalation", width: 180 },
        ]}
      />
      <p className="text-xs text-muted-foreground">Escalation is automatic — reminders and escalations are sent by the system and can&apos;t be ticked by hand.</p>

      {/* Review queue for supervisors */}
      {tasks.filter((t) => t.review_status === "READY_FOR_REVIEW" && (canReview || t.supervisor_user_id === me?.id)).length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-medium">Waiting for your review</h2>
          <div className="flex flex-col gap-1">
            {tasks.filter((t) => t.review_status === "READY_FOR_REVIEW" && t.assignee_user_id !== me?.id && (canReview || t.supervisor_user_id === me?.id)).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded border px-3 py-2 text-sm">
                <span>{t.title} — {person(t.r_assignee)} — due {dstr(t.due_date)}</span>
                <span className="flex gap-1">
                  <form action={approveTaskForm.bind(null, t.id)}><button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">Approve — done</button></form>
                  <CreateDialog title="Send back" buttonLabel="Send back" action={sendBackTaskForm.bind(null, t.id)} fields={[{ name: "comment", label: "What needs fixing?", type: "textarea", required: true }]} />
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
