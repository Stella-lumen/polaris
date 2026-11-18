import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { updateEscalationRule } from "@/lib/actions";
import { requireUser, canAuthorise } from "@/lib/auth";

export const instant = false;

const TRIGGER_LABEL: Record<string, string> = {
  DAYS_BEFORE_DUE: "days before the due date",
  ON_DUE_NOT_DONE: "on the due date if not done",
  DAYS_OVERDUE: "days overdue",
  UNVERIFIED_DAYS: "days after implementation without verification",
  TASK_DAYS_BEFORE_DUE: "days before the due date",
  TASK_DUE_PASSED: "the due date passes",
  TASK_DAYS_OVERDUE: "days overdue",
  REVIEW_PENDING_DAYS: "days waiting for review",
};

export default async function EscalationRulesPage() {
  const user = await requireUser();
  const admin = canAuthorise(user);
  const rules = await prisma.escalationRule.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: [{ entity_kind: "asc" }, { sort_order: "asc" }],
  });
  const groups = [
    { kind: "task", title: "Task reminders and escalations" },
    { kind: "corrective_action", title: "Corrective action reminders and escalations" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Escalation rules</h1>
        <p className="text-sm text-muted-foreground">
          When the engine runs, each item is checked against these rules and the most serious matching
          rule sends one notification. Each level is sent once per item and per person. Completed or
          verified items are never escalated. Every change here is written to the audit log.
        </p>
      </div>
      {groups.map((g) => (
        <section key={g.kind} className="flex flex-col gap-2">
          <h2 className="font-semibold">{g.title}</h2>
          <div className="flex flex-col gap-2">
            {rules.filter((r) => (r.entity_kind ?? "corrective_action") === g.kind).map((r, i) => (
              <form key={r.id} action={updateEscalationRule.bind(null, r.id)} className="rounded-md border p-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                <span className="font-medium w-8">L{i + 1}</span>
                <span className="flex items-center gap-2">
                  {r.trigger === "TASK_DUE_PASSED" || r.trigger === "ON_DUE_NOT_DONE" ? (
                    <>When {TRIGGER_LABEL[r.trigger ?? ""] ?? r.trigger}</>
                  ) : (
                    <>
                      <input name="days" type="number" min={0} defaultValue={r.days ?? 0} className="border rounded px-2 py-1 w-16" disabled={!admin} />
                      {TRIGGER_LABEL[r.trigger ?? ""] ?? r.trigger}
                    </>
                  )}
                </span>
                <span className="text-muted-foreground">Notify:</span>
                <label className="flex items-center gap-1"><input type="checkbox" name="notify_owner" defaultChecked={r.notify_owner} disabled={!admin} /> person responsible</label>
                <label className="flex items-center gap-1"><input type="checkbox" name="notify_supervisor" defaultChecked={r.notify_supervisor} disabled={!admin} /> supervisor</label>
                <label className="flex items-center gap-1"><input type="checkbox" name="notify_cae" defaultChecked={r.notify_cae} disabled={!admin} /> chief audit executive</label>
                <label className="flex items-center gap-1"><input type="checkbox" name="notify_hod" defaultChecked={r.notify_hod} disabled={!admin} /> administrators</label>
                {admin && <button className="rounded bg-orange-600 text-white px-3 py-1 ml-auto">Save</button>}
              </form>
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">
        The engine runs when the dashboard is opened and can be scheduled externally by calling the
        /api/escalation/run endpoint (for example with Windows Task Scheduler once a day).
      </p>
    </div>
  );
}
