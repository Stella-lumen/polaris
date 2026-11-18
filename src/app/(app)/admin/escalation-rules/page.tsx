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
  DECL_UNSIGNED_BEFORE_START: "days before the engagement starts while unsigned",
  DECL_UNSIGNED_AFTER_START: "days after the engagement starts while still unsigned",
  DECL_CONFLICT_OPEN_DAYS: "days a disclosed conflict waits for review",
  DECL_REDECLARE_DAYS: "days since last signing (annual re-declaration)",
  DELEGATION_EXPIRY_DAYS: "days before the delegation ends",
  API_KEY_EXPIRY_DAYS: "days before the key expires",
};

const input = "w-20 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 disabled:opacity-60";

export default async function EscalationRulesPage() {
  const user = await requireUser();
  const admin = canAuthorise(user);
  const rules = await prisma.escalationRule.findMany({
    where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID },
    orderBy: [{ entity_kind: "asc" }, { sort_order: "asc" }],
  });
  const groups = [
    { kind: "corrective_action", title: "Corrective action reminders and escalations" },
    { kind: "task", title: "Task reminders and escalations" },
    { kind: "declaration", title: "Declaration reminders and escalations" },
    { kind: "delegation", title: "Delegation expiry reminders" },
    { kind: "api_key", title: "API key expiry reminders" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Escalation rules</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          When the engine runs, each item is checked against these rules and the most serious matching
          rule sends one notification. Each level is sent once per item and per person. Completed or
          verified items are never escalated. Every change here is written to the audit log.
        </p>
      </div>

      {groups.map((g) => (
        <section key={g.kind} className="flex flex-col gap-3">
          <h2 className="font-semibold">{g.title}</h2>
          <div className="flex flex-col gap-2">
            {rules.filter((r) => (r.entity_kind ?? "corrective_action") === g.kind).map((r, i) => (
              <form key={r.id} action={updateEscalationRule.bind(null, r.id)} className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border bg-card px-4 py-3 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-800">L{i + 1}</span>
                <span className="flex items-center gap-2">
                  {r.trigger === "TASK_DUE_PASSED" || r.trigger === "ON_DUE_NOT_DONE" ? (
                    <span>When {TRIGGER_LABEL[r.trigger ?? ""] ?? r.trigger}</span>
                  ) : (
                    <>
                      <input name="days" type="number" min={0} defaultValue={r.days ?? 0} className={input} disabled={!admin} />
                      <span>{TRIGGER_LABEL[r.trigger ?? ""] ?? r.trigger}</span>
                    </>
                  )}
                </span>
                <span className="h-5 w-px bg-border" />
                <span className="text-muted-foreground">Notify:</span>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="notify_owner" defaultChecked={r.notify_owner} className="h-4 w-4 accent-orange-600" disabled={!admin} /> person responsible</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="notify_supervisor" defaultChecked={r.notify_supervisor} className="h-4 w-4 accent-orange-600" disabled={!admin} /> supervisor</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="notify_cae" defaultChecked={r.notify_cae} className="h-4 w-4 accent-orange-600" disabled={!admin} /> chief audit executive</label>
                <label className="flex items-center gap-1.5"><input type="checkbox" name="notify_hod" defaultChecked={r.notify_hod} className="h-4 w-4 accent-orange-600" disabled={!admin} /> administrators</label>
                {admin && (
                  <button className="ml-auto rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700">Save</button>
                )}
              </form>
            ))}
          </div>
        </section>
      ))}

      <p className="max-w-3xl rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        The engine runs when the dashboard is opened and can be scheduled externally by calling the
        /api/escalation/run endpoint (for example with Windows Task Scheduler once a day).
      </p>
    </div>
  );
}
