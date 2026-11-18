import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { ruleFires } from "@/lib/escalation-rules";
import { deliverEmail } from "@/lib/mailer";

/**
 * The single shared escalation engine for tasks and corrective actions.
 *
 * How it works:
 *  - Every rule lives in the escalation_rule table (admins can edit the
 *    timings). Rules are evaluated per item and only the highest-severity
 *    matching rule fires — one notification per item per run.
 *  - A level is sent once per item and per recipient. The dedup key
 *    "esc:{kind}:{level}:{itemId}" is stored on the outbox row; before
 *    sending we check whether that level already reached this person.
 *  - Completed, verified or closed items never escalate.
 *  - Every notification is written to the outbox and to Audit Logs, and the
 *    outbox row links back to the task or action it is about.
 */
export async function escalateOverdueWork() {
  const now = new Date();
  const DAY = 86400_000;

  const [tasks, actions, rules, users] = await Promise.all([
    prisma.task.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, status: { notIn: ["DONE", "CLOSED"] } },
      include: { r_assignee: true, r_engagement: true },
    }),
    prisma.correctiveAction.findMany({
      where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID, status: { notIn: ["VERIFIED", "CLOSED"] } },
      include: { r_owner: true, r_supervisor: true },
    }),
    prisma.escalationRule.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { sort_order: "asc" } }),
    prisma.user.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, select: { id: true, email: true, role: true, first_name: true, last_name: true } }),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const caeEmails = users.filter((u) => u.role === "org:chief_audit_executive").map((u) => u.email).filter(Boolean) as string[];
  const adminEmails = users.filter((u) => u.role === "org:admin").map((u) => u.email).filter(Boolean) as string[];
  const fallback = adminEmails[0] ?? caeEmails[0] ?? "";

  const taskRules = rules.filter((r) => (r.entity_kind ?? "corrective_action") === "task");
  const caRules = rules.filter((r) => (r.entity_kind ?? "corrective_action") === "corrective_action");

  type Notice = { kind: string; itemId: string; level: number; ruleId: string; to: string[]; cc: string[]; subject: string; reason: string; body: string };
  const notices: Notice[] = [];

  for (const t of tasks) {
    const ctx = {
      daysToDue: t.due_date ? Math.floor((t.due_date.getTime() - now.getTime()) / DAY) : null,
      daysOverdue: t.due_date ? Math.floor((now.getTime() - t.due_date.getTime()) / DAY) : null,
      daysUnverified: null,
      daysInReview: t.review_status === "READY_FOR_REVIEW" && t.updated_at ? Math.floor((now.getTime() - t.updated_at.getTime()) / DAY) : null,
      status: t.status,
    };
    const winner = taskRules.filter((r) => ruleFires(r.trigger, r.days, ctx)).pop();
    if (!winner) continue;
    const level = taskRules.indexOf(winner) + 1;
    const sup = t.supervisor_user_id ? byId.get(t.supervisor_user_id) : null;
    const assignee = t.r_assignee?.email ?? "";
    const to = [assignee].filter(Boolean);
    const cc: string[] = [];
    if (winner.notify_supervisor && sup?.email) cc.push(sup.email);
    if (winner.notify_cae) cc.push(...caeEmails);
    if (winner.notify_hod) cc.push(...adminEmails);
    if (level >= 2 && sup?.email && !cc.includes(sup.email)) cc.push(sup.email); // supervisors copied on later levels
    const reason = ctx.daysOverdue != null && ctx.daysOverdue > 0
      ? `Overdue: task is ${ctx.daysOverdue} day${ctx.daysOverdue === 1 ? "" : "s"} overdue${ctx.daysOverdue >= 7 ? " — escalated to supervisor" : ""}`
      : `Reminder: task due in ${ctx.daysToDue} day${ctx.daysToDue === 1 ? "" : "s"}`;
    notices.push({
      kind: "task", itemId: t.id, level, ruleId: winner.id,
      to: to.length ? to : [fallback].filter(Boolean), cc,
      subject: `${reason} — ${t.title}`,
      reason,
      body: `Task "${t.title}" (${t.r_engagement?.engagement_name ?? "not linked to an engagement"}) assigned to ${[t.r_assignee?.first_name, t.r_assignee?.last_name].filter(Boolean).join(" ") || "an unassigned user"} is ${ctx.daysOverdue ? `overdue by ${ctx.daysOverdue} day(s)` : `due in ${ctx.daysToDue} day(s)`} — due date ${t.due_date?.toISOString().slice(0, 10) ?? "not set"}.`,
    });
  }

  for (const a of actions) {
    const ctx = {
      daysToDue: a.due_date ? Math.floor((a.due_date.getTime() - now.getTime()) / DAY) : null,
      daysOverdue: a.due_date ? Math.floor((now.getTime() - a.due_date.getTime()) / DAY) : null,
      daysUnverified: a.implemented_date ? Math.floor((now.getTime() - a.implemented_date.getTime()) / DAY) : null,
      status: a.status,
    };
    const winner = caRules.filter((r) => ruleFires(r.trigger, r.days, ctx)).pop();
    if (!winner) continue;
    const level = caRules.indexOf(winner) + 1;
    const to: string[] = [], cc: string[] = [];
    if (winner.notify_owner && a.r_owner?.email) to.push(a.r_owner.email);
    if (winner.notify_supervisor && a.r_supervisor?.email) cc.push(a.r_supervisor.email);
    if (winner.notify_cae) cc.push(...caeEmails);
    if (winner.notify_hod) cc.push(...adminEmails);
    const reason = winner.trigger === "UNVERIFIED_DAYS"
      ? "Corrective action implemented but not yet verified"
      : ctx.daysOverdue != null && ctx.daysOverdue > 0
        ? `Overdue: corrective action overdue by ${ctx.daysOverdue} day${ctx.daysOverdue === 1 ? "" : "s"}${level >= 3 ? " — escalated to management" : ""}`
        : `Reminder: corrective action due in ${ctx.daysToDue} day${ctx.daysToDue === 1 ? "" : "s"}`;
    notices.push({
      kind: "corrective_action", itemId: a.id, level, ruleId: winner.id,
      to: to.length ? to : [fallback].filter(Boolean), cc,
      subject: `${reason} — ${(a.action_description ?? "Corrective action").slice(0, 80)}`,
      reason,
      body: `Corrective action "${(a.action_description ?? "").slice(0, 120)}" owned by ${[a.r_owner?.first_name, a.r_owner?.last_name].filter(Boolean).join(" ") || "an unassigned user"} — ${reason.toLowerCase()}. Due date ${a.due_date?.toISOString().slice(0, 10) ?? "not set"}; status ${(a.status ?? "").toLowerCase().replace(/_/g, " ")}.`,
    });
  }

  // Deliver each notice once per level per recipient.
  let sent = 0;
  for (const n of notices) {
    const prior = await prisma.sentEmail.findMany({ where: { entity_id: n.itemId, level: n.level, deleted: false } });
    const alreadyTo = new Set(prior.flatMap((e) => [...(e.to_emails as string[] ?? []), ...(e.cc_emails as string[] ?? [])]));
    const to = n.to.filter((e) => !alreadyTo.has(e));
    const cc = n.cc.filter((e) => !alreadyTo.has(e) && !to.includes(e));
    if (!to.length && !cc.length) continue;
    const row = await prisma.sentEmail.create({
      data: {
        resend_id: `esc:${n.kind}:${n.level}:${n.itemId}`,
        to_emails: to, cc_emails: cc, bcc_emails: [], attachments: [],
        subject: n.subject, body: n.body, reason_label: n.reason,
        entity_type: n.kind, entity_id: n.itemId, level: n.level,
        organization_id: DEMO_ORGANIZATION_ID, created_at: now,
      },
    });
    await deliverEmail(row.id);
    await prisma.auditLog.create({
      data: {
        organization_id: DEMO_ORGANIZATION_ID, schema_name: "public",
        table_name: n.kind === "task" ? "Tasks" : "Corrective Actions", record_id: n.itemId,
        operation_type: "NOTIFICATION", timestamp: now, original_values: {},
        new_values: { message: `${n.reason}: notification sent to ${to.join(", ") || cc.join(", ")}` },
        query: "escalation-engine",
      },
    });
    sent++;
  }

  await prisma.emailSetting.updateMany({ where: { organization_id: DEMO_ORGANIZATION_ID }, data: { last_run_at: now } });
  return { sent, evaluated: notices.length };
}
