import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { saveTypeDefaults, addTypeTask, removeTypeTask, updateEngagementType } from "@/lib/actions";
import { EditDialog } from "@/components/edit-dialog";
import { requireUser, canAuthorise } from "@/lib/auth";
import Link from "next/link";

export const instant = false;

const fmt = (d: Date | null) => (d ? d.toLocaleString("en-ZA", { dateStyle: "long", timeStyle: "short" }) : "Not recorded");
const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60";
const STAGES = ["Planning", "Fieldwork", "Reporting", "Follow-up"];
const ROLES = ["LEAD", "SENIOR", "AUDITOR", "REVIEWER"];

export default async function EngagementTypeDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string }> }) {
  const { id } = await params;
  const { edit } = await searchParams;
  const user = await requireUser();
  const admin = canAuthorise(user);

  const [t, engCount, plannedCount, tasks, planningTpls, fieldworkTpls, reportTpls, updater] = await Promise.all([
    prisma.engagementType.findUnique({ where: { id } }),
    prisma.engagement.count({ where: { engagement_type_id: id, deleted: false } }),
    prisma.plannedEngagement.count({ where: { engagement_type_id: id, deleted: false } }),
    prisma.taskTemplate.findMany({ where: { engagement_type_id: id, deleted: false }, orderBy: [{ stage: "asc" }, { sort: "asc" }] }),
    prisma.planningDocumentTemplate.findMany({ where: { deleted: false, OR: [{ section: null }, { section: "planning" }] }, select: { id: true, name: true } }),
    prisma.planningDocumentTemplate.findMany({ where: { deleted: false, section: "fieldwork" }, select: { id: true, name: true } }),
    prisma.reportDocumentTemplate.findMany({ where: { deleted: false }, select: { id: true, name: true } }),
    prisma.engagementType.findUnique({ where: { id }, select: { updated_by: true } }).then((r) => (r?.updated_by ? prisma.user.findUnique({ where: { id: r.updated_by }, select: { first_name: true, last_name: true, email: true } }) : null)),
  ]);
  if (!t) return <p>Engagement type not found.</p>;

  const dt = (t.default_templates as { planning?: string; fieldwork?: string; reporting?: string } | null) ?? {};
  const displayName = t.name === "Adhoc Engagements" ? "Ad hoc Engagements" : t.name;
  const updaterName = updater ? `${updater.first_name ?? ""} ${updater.last_name ?? ""}`.trim() || updater.email : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href="/admin/engagement-types" className="text-sm text-orange-600 hover:underline">← Back to engagement types</Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">{displayName}</h1>
          {t.disabled && <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Disabled — hidden from new engagements</span>}
          {admin && (
            <Link href={`/admin/engagement-types/${id}?edit=1`} title="Edit this type" className="text-orange-600 hover:text-orange-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            </Link>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{t.description ?? "No description."}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Used by {engCount} engagement{engCount === 1 ? "" : "s"} and {plannedCount} planned engagement{plannedCount === 1 ? "" : "s"} ·
          Last updated {fmt(t.updated_at)}{updaterName ? ` by ${updaterName}` : ""}
        </p>
      </div>

      {edit === "1" && (
        <EditDialog
          title={`Edit ${displayName}`}
          action={updateEngagementType.bind(null, id)}
          values={{ name: t.name, description: t.description }}
          returnPath={`/admin/engagement-types/${id}`}
          fields={[
            { name: "name", label: "Name", required: true },
            { name: "description", label: "Description", type: "textarea" },
          ]}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* defaults */}
        <form action={saveTypeDefaults.bind(null, id)} className="flex flex-col gap-4 rounded-lg border p-5">
          <div>
            <h2 className="font-semibold">Default templates and budget guide</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Offered when someone creates an engagement of this type — they can accept or change them.</p>
          </div>
          <div className="grid gap-4">
            {([
              ["Planning template", "planning_template", planningTpls, dt.planning],
              ["Fieldwork template", "fieldwork_template", fieldworkTpls, dt.fieldwork],
              ["Reporting template", "reporting_template", reportTpls, dt.reporting],
            ] as [string, string, { id: string; name: string | null }[], string | undefined][]).map(([label, name, opts, cur]) => (
              <label key={name} className="flex flex-col gap-1.5 text-sm font-medium">
                {label}
                <select name={name} defaultValue={cur ?? ""} className={input} disabled={!admin}>
                  <option value="">Not assigned — pick a template</option>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
            ))}
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Default hours
                <input name="default_hours" type="number" min={0} defaultValue={t.default_hours != null ? String(t.default_hours) : ""} placeholder="e.g. 120" className={input} disabled={!admin} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Budget guide (R)
                <input name="default_budget" type="number" min={0} defaultValue={t.default_budget != null ? String(t.default_budget) : ""} placeholder="e.g. 85000" className={input} disabled={!admin} />
              </label>
            </div>
          </div>
          {admin && <button className="self-start rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Save defaults</button>}
        </form>

        {/* checklist */}
        <section className="flex flex-col gap-3 rounded-lg border p-5">
          <div>
            <h2 className="font-semibold">Default checklist</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Tasks created automatically when a new engagement of this type accepts the defaults.
              Days are counted from the engagement start date.
            </p>
          </div>
          {STAGES.map((stage) => {
            const stageTasks = tasks.filter((x) => x.stage === stage);
            return (
              <div key={stage}>
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{stage}</div>
                {stageTasks.length ? stageTasks.map((x) => (
                  <div key={x.id} className="flex items-center gap-2 border-b py-1.5 text-sm last:border-0">
                    <span className="flex-1">{x.title}</span>
                    <span className="text-xs text-muted-foreground">day {x.days_offset}</span>
                    <span className="text-xs text-muted-foreground">{x.default_role?.toLowerCase() ?? "any role"}</span>
                    {x.planned_hours != null && <span className="text-xs text-muted-foreground">{String(x.planned_hours)}h</span>}
                    {admin && (
                      <form action={removeTypeTask.bind(null, x.id)}>
                        <button title="Remove this checklist task" className="text-xs text-red-600 hover:underline">remove</button>
                      </form>
                    )}
                  </div>
                )) : <div className="py-1 text-xs text-muted-foreground">No tasks yet</div>}
              </div>
            );
          })}
          {admin && (
            <form action={addTypeTask.bind(null, id)} className="mt-2 grid grid-cols-[1fr_110px_90px_110px_80px] items-end gap-2 border-t pt-3 text-sm">
              <label className="flex flex-col gap-1 font-medium">Task <input name="title" required placeholder="e.g. Draft the audit plan" className={input} /></label>
              <label className="flex flex-col gap-1 font-medium">Stage
                <select name="stage" className={input}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1 font-medium">Day <input name="days_offset" type="number" min={0} defaultValue={0} className={input} /></label>
              <label className="flex flex-col gap-1 font-medium">Role
                <select name="default_role" className={input}>{ROLES.map((r) => <option key={r} value={r}>{r.toLowerCase()}</option>)}</select>
              </label>
              <label className="flex flex-col gap-1 font-medium">Hours <input name="planned_hours" type="number" min={0} className={input} /></label>
              <button className="col-span-5 self-start rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Add checklist task</button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
