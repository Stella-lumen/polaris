import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";
import { ruleFires } from "@/lib/escalation-rules";

/**
 * Automated escalation, rule-driven. Each escalation_rule fires at most once
 * per corrective action (dedup key esc:ca:{ruleId}:{actionId}), so the same
 * level can never notify twice. Tasks keep the daily 7-day-window reminder.
 * Everything lands in the sent_email outbox — production swaps the writer
 * for a real SMTP/Resend send.
 */
export async function escalateOverdueWork() {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const DAY = 86400_000;
  const in7 = new Date(now.getTime() + 7 * DAY);
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };

  const [tasks, actions, rules, admins, cae] = await Promise.all([
    prisma.task.findMany({
      where: { ...scope, status: { not: "DONE" } },
      include: { r_assignee: true, r_engagement: true },
    }),
    prisma.correctiveAction.findMany({
      where: { ...scope, status: { not: "VERIFIED" } },
      include: { r_owner: true, r_supervisor: true },
    }),
    prisma.escalationRule.findMany({ where: { deleted: false, organization_id: DEMO_ORGANIZATION_ID }, orderBy: { sort_order: "asc" } }),
    prisma.user.findMany({
      where: { deleted: false, disabled: false, role: "org:admin" },
      select: { email: true },
    }),
    prisma.user.findMany({
      where: { deleted: false, disabled: false, role: "org:chief_audit_executive" },
      select: { email: true },
    }),
  ]);
  const adminEmails = admins.map((u) => u.email).filter(Boolean) as string[];
  const caeEmails = cae.map((u) => u.email).filter(Boolean) as string[];

  const items: { dedup: string; to: string[]; cc: string[]; subject: string; body: string }[] = [];
  const levelBumps: { id: string; level: number }[] = [];
  const taskBumps: { id: string; level: number }[] = [];
  const supUsers = await prisma.user.findMany({ where: { deleted: false }, select: { id: true, email: true } });
  const supervisors = new Map(supUsers.map((u) => [u.id, u.email ?? ""]));

  // ---- tasks: rule-based levels (same dedup-once pattern as corrective actions) ----
  for (const t of tasks) {
    const daysToDue = t.due_date ? Math.floor((t.due_date.getTime() - now.getTime()) / DAY) : null;
    const daysOverdue = t.due_date ? Math.floor((now.getTime() - t.due_date.getTime()) / DAY) : null;
    const daysInReview = t.review_status === "READY_FOR_REVIEW" && t.updated_at ? Math.floor((now.getTime() - t.updated_at.getTime()) / DAY) : null;
    const supEmail = t.supervisor_user_id ? (supervisors.get(t.supervisor_user_id) ?? null) : null;

    const fire = (level: number, trig: string, d: number, to: string[], cc: string[], label: string) => {
      items.push({
        dedup: `esc:task:${trig}:${t.id}`,
        to: to.length ? to : [adminEmails[0] ?? ""],
        cc,
        subject: `[ESCALATION L${level}] Task ${label}: ${t.title}`,
        body: `Task "${t.title}" (${t.r_engagement?.engagement_name ?? "unlinked"}) assigned to ${t.r_assignee?.first_name ?? ""} ${t.r_assignee?.last_name ?? ""} is ${label} — due ${t.due_date?.toISOString().slice(0, 10) ?? "—"}. Status: ${t.status}.`,
      });
      if (level > (t.escalation_level ?? 0)) taskBumps.push({ id: t.id, level });
    };

    if (ruleFires("TASK_DAYS_OVERDUE", 7, { daysToDue, daysOverdue, daysUnverified: null, daysInReview, status: t.status }))
      fire(3, "overdue7", 7, [t.r_assignee?.email ?? ""], [...caeEmails, ...(supEmail ? [supEmail] : [])], `overdue by ${daysOverdue} days`);
    else if (ruleFires("TASK_DUE_PASSED", 0, { daysToDue, daysOverdue, daysUnverified: null, daysInReview, status: t.status }))
      fire(2, "duepassed", 0, [t.r_assignee?.email ?? "", ...(supEmail ? [supEmail] : [])], adminEmails, `overdue by ${daysOverdue} days`);
    else if (ruleFires("TASK_DAYS_BEFORE_DUE", 2, { daysToDue, daysOverdue, daysUnverified: null, daysInReview, status: t.status }))
      fire(1, "before2", 2, [t.r_assignee?.email ?? "", ...(supEmail ? [supEmail] : [])], [], `due in ${daysToDue} days`);
    else if (ruleFires("TASK_DAYS_BEFORE_DUE", 7, { daysToDue, daysOverdue, daysUnverified: null, daysInReview, status: t.status }))
      fire(1, "before7", 7, [t.r_assignee?.email ?? ""], [], `due in ${daysToDue} days`);
    if (ruleFires("REVIEW_PENDING_DAYS", 3, { daysToDue, daysOverdue, daysUnverified: null, daysInReview, status: t.status }))
      fire(1, "review3", 3, [supEmail ?? ""], [], `waiting for review for ${daysInReview} days`);
  }

  // ---- corrective actions: each rule fires once per action ----
  for (const a of actions) {
    const daysToDue = a.due_date ? Math.floor((a.due_date.getTime() - now.getTime()) / DAY) : null;
    const daysOverdue = a.due_date ? Math.floor((now.getTime() - a.due_date.getTime()) / DAY) : null;
    const daysUnverified = a.implemented_date ? Math.floor((now.getTime() - a.implemented_date.getTime()) / DAY) : null;

    for (const rule of rules) {
      const d = rule.days ?? 0;
      if (!ruleFires(rule.trigger, rule.days, { daysToDue, daysOverdue, daysUnverified, status: a.status })) continue;

      const to: string[] = [];
      if (rule.notify_owner && a.r_owner?.email) to.push(a.r_owner.email);
      if (rule.notify_supervisor && a.r_supervisor?.email) to.push(a.r_supervisor.email);
      if (rule.notify_hod && a.r_supervisor?.email) to.push(a.r_supervisor.email);
      const cc: string[] = [];
      if (rule.notify_hod) cc.push(...adminEmails);
      if (rule.notify_cae) cc.push(...caeEmails);
      if (!to.length) to.push(adminEmails[0] ?? "");

      const label = rule.trigger === "DAYS_BEFORE_DUE" ? `due in ${daysToDue}d` : rule.trigger === "ON_DUE_NOT_DONE" ? "overdue — not implemented" : rule.trigger === "DAYS_OVERDUE" ? `${daysOverdue}d overdue` : `implemented, unverified ${daysUnverified}d`;
      items.push({
        dedup: `esc:ca:${rule.id}:${a.id}`,
        to,
        cc,
        subject: `[ESCALATION L${rule.sort_order}] Corrective action ${label}`,
        body: `Corrective action "${(a.action_description ?? "").slice(0, 140)}" (owner: ${a.r_owner?.first_name ?? ""} ${a.r_owner?.last_name ?? ""}, due ${a.due_date?.toISOString().slice(0, 10) ?? "—"}, status ${a.status}) triggered escalation rule ${rule.trigger}${d ? ` @${d}d` : ""}.${rule.notify_cae ? " Flagged for the audit committee report." : ""}`,
      });
      if ((rule.sort_order ?? 0) > (a.escalation_level ?? 0)) levelBumps.push({ id: a.id, level: rule.sort_order ?? 0 });
    }
  }

  const existing = await prisma.sentEmail.findMany({
    where: { id: { in: items.map((i) => i.dedup) } },
    select: { id: true },
  });
  const done = new Set(existing.map((e) => e.id));
  const fresh = items.filter((i) => i.to[0] && !done.has(i.dedup));
  if (fresh.length) {
    await prisma.$transaction(
      fresh.map((i) =>
        prisma.sentEmail.upsert({
          where: { id: i.dedup },
          update: {},
          create: {
            id: i.dedup,
            resend_id: i.dedup,
            from_email: "notifications@polaris.internal",
            to_emails: i.to,
            cc_emails: i.cc,
            bcc_emails: [],
            subject: i.subject,
            body: i.body,
            attachments: [],
            scheduled_at: now,
            organization_id: DEMO_ORGANIZATION_ID,
            created_by: "escalation-engine",
            created_at: now,
          },
        }),
      ),
    );
    for (const b of levelBumps) {
      await prisma.correctiveAction.update({ where: { id: b.id }, data: { escalation_level: b.level } });
    }
    for (const b of taskBumps) {
      await prisma.task.update({ where: { id: b.id }, data: { escalation_level: b.level, escalated: true } });
    }
    for (const i of fresh) {
      await prisma.auditLog.create({
        data: { organization_id: DEMO_ORGANIZATION_ID, schema_name: "public", table_name: "Corrective Actions", record_id: i.dedup.split(":")[3] ?? i.dedup, operation_type: "ESCALATION", timestamp: now, original_values: {}, new_values: { subject: i.subject, to: i.to }, query: "escalation-engine" },
      });
    }
  }
  return { queued: fresh.length, total: items.length };
}
