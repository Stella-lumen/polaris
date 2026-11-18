import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { ruleFires } from "@/lib/escalation-rules";
import { isEffective } from "@/lib/declarations";
import { deliverEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

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

  const [tasks, actions, rules, users, auditors, activeDecls, declSignRows, delegations, apiKeys] = await Promise.all([
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
    prisma.engagementAuditor.findMany({
      where: { deleted: false },
      include: { r_user: true, r_engagement: { select: { id: true, engagement_name: true, start_date: true } } },
    }),
    prisma.declaration.findMany({ where: { deleted: false, disabled: false }, select: { id: true } }),
    prisma.engagementAuditorDeclaration.findMany({ where: { deleted: false } }),
    prisma.delegation.findMany({
      where: { deleted: false, disabled: false, status: "ACTIVE", end_date: { not: null }, organization_id: DEMO_ORGANIZATION_ID },
      include: { r_delegate: true, r_principal: true },
    }),
    prisma.apiKey.findMany({
      where: { deleted: false, disabled: false, expires_at: { not: null }, organization_id: DEMO_ORGANIZATION_ID },
      select: { id: true, name: true, expires_at: true, disabled: true, created_by: true },
    }),
  ]);
  const byId = new Map(users.map((u) => [u.id, u]));
  const caeEmails = users.filter((u) => u.role === "org:chief_audit_executive").map((u) => u.email).filter(Boolean) as string[];
  const adminEmails = users.filter((u) => u.role === "org:admin").map((u) => u.email).filter(Boolean) as string[];
  const fallback = adminEmails[0] ?? caeEmails[0] ?? "";

  const taskRules = rules.filter((r) => (r.entity_kind ?? "corrective_action") === "task");
  const caRules = rules.filter((r) => (r.entity_kind ?? "corrective_action") === "corrective_action");
  const declRules = rules.filter((r) => r.entity_kind === "declaration");
  const delegationRules = rules.filter((r) => r.entity_kind === "delegation");
  const keyRules = rules.filter((r) => r.entity_kind === "api_key");

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

  // --- declarations: unsigned before start, open conflicts, annual re-declaration ---
  if (declRules.length && activeDecls.length) {
    const requiredIds = new Set(activeDecls.map((d) => d.id));
    const rowsByAud = new Map<string, typeof declSignRows>();
    for (const r of declSignRows) {
      if (!r.engagement_auditor_id) continue;
      if (!rowsByAud.has(r.engagement_auditor_id)) rowsByAud.set(r.engagement_auditor_id, []);
      rowsByAud.get(r.engagement_auditor_id)!.push(r);
    }
    for (const a of auditors) {
      const mine = rowsByAud.get(a.id) ?? [];
      const engName = a.r_engagement?.engagement_name ?? "an engagement";
      const person = [a.r_user?.first_name, a.r_user?.last_name].filter(Boolean).join(" ") || "A team member";
      const signedIds = new Set(mine.filter((r) => isEffective(r)).map((r) => r.declaration_id).filter(Boolean) as string[]);
      const unsigned = [...requiredIds].filter((id) => !signedIds.has(id));
      const openConflict = mine.find((r) => r.status === "CONFLICT");
      const latestSigned = mine.filter((r) => r.signed_at).sort((x, y) => (y.signed_at?.getTime() ?? 0) - (x.signed_at?.getTime() ?? 0))[0];

      const ctx = {
        daysToDue: a.r_engagement?.start_date ? Math.floor((a.r_engagement.start_date.getTime() - now.getTime()) / DAY) : null,
        daysOverdue: a.r_engagement?.start_date ? Math.floor((now.getTime() - a.r_engagement.start_date.getTime()) / DAY) : null,
        daysUnverified: openConflict
          ? Math.floor((now.getTime() - (openConflict.updated_at?.getTime() ?? now.getTime())) / DAY)
          : latestSigned?.signed_at
            ? Math.floor((now.getTime() - latestSigned.signed_at.getTime()) / DAY)
            : null,
        status: unsigned.length ? "UNSIGNED" : "SIGNED",
      };

      for (const rule of declRules) {
        const applies =
          rule.trigger === "DECL_UNSIGNED_BEFORE_START" || rule.trigger === "DECL_UNSIGNED_AFTER_START"
            ? unsigned.length > 0
            : rule.trigger === "DECL_CONFLICT_OPEN_DAYS"
              ? !!openConflict
              : rule.trigger === "DECL_REDECLARE_DAYS"
                ? !unsigned.length && !!latestSigned
                : false;
        if (!applies || !ruleFires(rule.trigger, rule.days, ctx)) continue;
        const level = declRules.indexOf(rule) + 1;
        const to = a.r_user?.email ? [a.r_user.email] : [];
        const cc: string[] = [];
        if (rule.notify_supervisor || level >= 2) {
          const lead = auditors.find((x) => x.engagement_id === a.engagement_id && x.position_on_audit === "LEAD" && x.id !== a.id);
          if (lead?.r_user?.email) cc.push(lead.r_user.email);
        }
        if (rule.notify_cae) cc.push(...caeEmails);
        const reason =
          rule.trigger === "DECL_UNSIGNED_BEFORE_START"
            ? `Reminder: ${unsigned.length} declaration${unsigned.length === 1 ? "" : "s"} to sign before ${engName} starts`
            : rule.trigger === "DECL_UNSIGNED_AFTER_START"
              ? `Escalation: ${unsigned.length} declaration${unsigned.length === 1 ? "" : "s"} still unsigned after ${engName} started`
              : rule.trigger === "DECL_CONFLICT_OPEN_DAYS"
                ? `Disclosed conflict waiting for review${ctx.daysUnverified ? ` for ${ctx.daysUnverified} day${ctx.daysUnverified === 1 ? "" : "s"}` : ""}`
                : `Annual re-declaration due — last signed ${latestSigned?.signed_at?.toISOString().slice(0, 10) ?? "over a year ago"}`;
        notices.push({
          kind: "declaration", itemId: a.id, level, ruleId: rule.id,
          to: rule.trigger === "DECL_CONFLICT_OPEN_DAYS" && cc.length ? cc.slice(0, 1) : to.length ? to : [fallback].filter(Boolean),
          cc: rule.trigger === "DECL_CONFLICT_OPEN_DAYS" && cc.length ? [] : cc,
          subject: `${reason} — ${person}`,
          reason,
          body: `${person} on "${engName}": ${reason.toLowerCase()}. Sign or review under Independence assessment.`,
        });
        break; // highest-priority matching rule wins per auditor
      }
    }
  }

  // --- delegations: reminder before the end date ---
  const fullName = (u: { first_name?: string | null; last_name?: string | null; email?: string | null } | null | undefined) =>
    u ? [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email || "a user" : "a user";
  for (const d of delegations) {
    const ctx = {
      daysToDue: d.end_date ? Math.floor((d.end_date.getTime() - now.getTime()) / DAY) : null,
      daysOverdue: null,
      daysUnverified: null,
      status: d.status,
    };
    const winner = delegationRules.filter((r) => r.trigger === "DELEGATION_EXPIRY_DAYS" && ruleFires(r.trigger, r.days, ctx)).pop();
    if (!winner) continue;
    const level = delegationRules.indexOf(winner) + 1;
    const delegateName = fullName(d.r_delegate);
    const principalName = fullName(d.r_principal);
    const to = [d.r_delegate?.email].filter(Boolean) as string[];
    const cc: string[] = [];
    if (d.r_principal?.email) cc.push(d.r_principal.email);
    if (winner.notify_cae) cc.push(...caeEmails);
    if (winner.notify_hod || level >= 2) cc.push(...adminEmails);
    const reason = `Delegation expires in ${ctx.daysToDue} day${ctx.daysToDue === 1 ? "" : "s"} — ${delegateName} preparing for ${principalName}`;
    notices.push({
      kind: "delegation", itemId: d.id, level, ruleId: winner.id,
      to: to.length ? to : [fallback].filter(Boolean), cc,
      subject: reason,
      reason,
      body: `${delegateName}'s delegation to prepare on behalf of ${principalName} ends on ${d.end_date?.toISOString().slice(0, 10) ?? "an unset date"}. Extend it under Admin → Delegated preparers if it should continue.`,
    });
  }

  // --- API keys: reminder before the key expires ---
  for (const k of apiKeys) {
    const ctx = {
      daysToDue: k.expires_at ? Math.floor((k.expires_at.getTime() - now.getTime()) / DAY) : null,
      daysOverdue: null,
      daysUnverified: null,
      status: k.disabled ? "REVOKED" : "ACTIVE",
    };
    const winner = keyRules.filter((r) => r.trigger === "API_KEY_EXPIRY_DAYS" && ruleFires(r.trigger, r.days, ctx)).pop();
    if (!winner) continue;
    const level = keyRules.indexOf(winner) + 1;
    const creator = k.created_by ? byId.get(k.created_by) : null;
    const cc: string[] = [...adminEmails];
    if (winner.notify_cae) cc.push(...caeEmails);
    const reason = `API key "${k.name ?? "unnamed"}" expires in ${ctx.daysToDue} day${ctx.daysToDue === 1 ? "" : "s"}`;
    notices.push({
      kind: "api_key", itemId: k.id, level, ruleId: winner.id,
      to: creator?.email ? [creator.email] : [fallback].filter(Boolean), cc,
      subject: reason,
      reason,
      body: `${reason} — it will stop working on ${k.expires_at?.toISOString().slice(0, 10)}. Renew or replace it under Admin → API keys if it is still needed.`,
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
    await logAudit(
      n.kind === "task" ? "Tasks" : n.kind === "declaration" ? "Engagement Auditor Declarations" : n.kind === "delegation" ? "Delegations" : n.kind === "api_key" ? "Api Keys" : "Corrective Actions",
      n.itemId,
      "NOTIFICATION",
      { message: `${n.reason}: notification sent to ${to.join(", ") || cc.join(", ")}` },
      { system: true },
    );
    sent++;
  }

  await prisma.emailSetting.updateMany({ where: { organization_id: DEMO_ORGANIZATION_ID }, data: { last_run_at: now } });
  return { sent, evaluated: notices.length };
}
