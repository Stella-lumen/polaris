import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CreateDialog } from "@/components/create-dialog";
import { getSessionUser, canAuthorise } from "@/lib/auth";
import { submitTaskForReview, approveTaskForm, sendBackTaskForm, addTaskDependency } from "@/lib/actions";
import { toTimeline } from "@/lib/history-sentences";

export const instant = false;

const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => (u ? `${u.first_name} ${u.last_name}` : "Not assigned");
const STATUS: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", DONE: "Done" };
const fmt = (d: Date | null | undefined) => d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "Not set";

export default async function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await getSessionUser();
  const t = await prisma.task.findUnique({ where: { id }, include: { r_engagement: true, r_assignee: true } });
  if (!t || t.deleted) notFound();
  const [deps, allTasks, history, users, reviewer] = await Promise.all([
    prisma.taskDependency.findMany({ where: { task_id: id } }),
    prisma.task.findMany({ where: { deleted: false, id: { not: id } }, select: { id: true, title: true, status: true, due_date: true } }),
    prisma.auditLog.findMany({ where: { table_name: "Tasks", record_id: id }, orderBy: { timestamp: "desc" }, take: 50 }),
    prisma.user.findMany({ where: { deleted: false }, select: { id: true, first_name: true, last_name: true } }),
    t.reviewed_by ? prisma.user.findUnique({ where: { id: t.reviewed_by }, select: { first_name: true, last_name: true } }) : null,
  ]);
  const depTasks = allTasks.filter((a) => deps.some((d) => d.depends_on_task_id === a.id));
  const supervisor = users.find((u) => u.id === t.supervisor_user_id);
  const now = Date.now();
  const overdue = t.due_date && t.due_date.getTime() < now && t.status !== "DONE" ? Math.floor((now - t.due_date.getTime()) / 86400000) : 0;
  const timeline = toTimeline(history, new Map(users.map((u) => [u.id, person(u)])));
  const isAssignee = t.assignee_user_id === me?.id;
  const canReview = me ? (canAuthorise(me) || t.supervisor_user_id === me.id) : false;

  return (
    <div className="flex max-w-3xl flex-col gap-5">
      <div>
        <Link href="/tasks" className="text-xs text-orange-600 hover:underline">← Back to tasks</Link>
        <h1 className="mt-1 text-xl font-semibold text-primary">{t.title}</h1>
        <p className={`mt-2 rounded-md px-3 py-2 text-sm ${t.status === "DONE" ? "bg-emerald-50 text-emerald-800" : overdue ? "bg-red-50 text-red-800" : "bg-zinc-50 text-zinc-700"}`}>
          {t.status === "DONE"
            ? `Done — approved${reviewer ? ` by ${person(reviewer)}` : " (reviewer not recorded)"}${t.reviewed_date ? ` on ${fmt(t.reviewed_date)}` : ""}.`
            : overdue ? `Overdue by ${overdue} days. Due ${fmt(t.due_date)}.` : `${STATUS[t.status ?? "OPEN"] ?? t.status} — due ${fmt(t.due_date)}.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isAssignee && t.review_status !== "READY_FOR_REVIEW" && t.status !== "DONE" && (
          <form action={submitTaskForReview.bind(null, id)}><button className="rounded-md bg-orange-600 px-3 py-1.5 text-sm text-white">Submit for review</button></form>
        )}
        {t.review_status === "READY_FOR_REVIEW" && canReview && !isAssignee && (
          <>
            <form action={approveTaskForm.bind(null, id)}><button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white">Approve — done</button></form>
            <CreateDialog title="Send back" buttonLabel="Send back" action={sendBackTaskForm.bind(null, id)} fields={[{ name: "comment", label: "What needs fixing?", type: "textarea", required: true }]} />
          </>
        )}
        <CreateDialog title="Add dependency" buttonLabel="Add dependency" action={async (fd: FormData) => { "use server"; await addTaskDependency(id, String(fd.get("depends_on") ?? "")); }}
          fields={[{ name: "depends_on", label: "Cannot start until this task is done", type: "select", required: true, options: allTasks.map((a) => ({ value: a.id, label: (a.title ?? "").slice(0, 60) })) }]} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-md border p-4 text-sm">
          <div><span className="text-xs text-muted-foreground">Assignee</span><div>{person(t.r_assignee)}</div></div>
          <div><span className="text-xs text-muted-foreground">Supervisor</span><div>{supervisor ? person(supervisor) : "Not assigned"}</div></div>
          <div><span className="text-xs text-muted-foreground">Engagement</span><div>{t.r_engagement ? <Link href={`/engagements/${t.engagement_id}/dashboard`} className="text-orange-600 hover:underline">{t.r_engagement.engagement_name}</Link> : "Not linked"}</div></div>
        </div>
        <div className="flex flex-col gap-2 rounded-md border p-4 text-sm">
          <div><span className="text-xs text-muted-foreground">Dates</span><div>{fmt(t.start_date)} → {fmt(t.due_date)}</div></div>
          <div><span className="text-xs text-muted-foreground">Priority</span><div>{t.priority ? t.priority[0] + t.priority.slice(1).toLowerCase() : "Not set"}</div></div>
          <div><span className="text-xs text-muted-foreground">Planned hours</span><div>{t.planned_hours?.toString() ?? "Not set"}</div></div>
          <div><span className="text-xs text-muted-foreground">Depends on</span><div>{depTasks.length ? depTasks.map((d) => `${d.title} (${STATUS[d.status ?? "OPEN"] ?? d.status})`).join("; ") : "Nothing"}</div></div>
        </div>
      </div>
      {t.description && <div className="rounded-md border p-4 text-sm"><div className="text-xs text-muted-foreground">Description</div>{t.description}</div>}
      <section>
        <h2 className="mb-2 text-lg font-medium">History</h2>
        {timeline.length ? (
          <ol className="flex flex-col gap-2 border-l-2 border-orange-200 pl-4">
            {timeline.map((e, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-xs text-muted-foreground">{e.when?.toLocaleString("en-ZA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · {e.who}</span>
                <div>{e.sentence}</div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No history yet.</p>}
      </section>
    </div>
  );
}
