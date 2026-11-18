import { prisma } from "@/lib/db";
import { DEMO_ORGANIZATION_ID } from "@/lib/context";

/**
 * Automated escalation: queue supervisor notifications for overdue and
 * near-due work into sent_email. Idempotent per item + day via resend_id
 * ("esc:{kind}:{id}:{yyyy-mm-dd}") — production swaps this writer for a
 * real SMTP/Resend send, the table is the outbox either way.
 */
export async function escalateOverdueWork() {
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const in7 = new Date(now.getTime() + 7 * 86400_000);
  const scope = { deleted: false, organization_id: DEMO_ORGANIZATION_ID };

  const [tasks, actions, supervisors] = await Promise.all([
    prisma.task.findMany({
      where: { ...scope, status: { not: "DONE" }, due_date: { not: null, lte: in7 } },
      include: { r_assignee: true, r_engagement: true },
    }),
    prisma.correctiveAction.findMany({
      where: { ...scope, status: { not: "VERIFIED" }, due_date: { not: null, lte: in7 } },
      include: { r_owner: true },
    }),
    prisma.user.findMany({
      where: { deleted: false, disabled: false, role: { in: ["org:admin", "org:chief_audit_executive"] } },
      select: { email: true },
    }),
  ]);
  const cc = supervisors.map((s) => s.email).filter(Boolean) as string[];

  const items: { dedup: string; to: string; subject: string; body: string }[] = [];
  for (const t of tasks) {
    const overdue = t.due_date! < now;
    items.push({
      dedup: `esc:task:${t.id}:${day}`,
      to: t.r_assignee?.email ?? cc[0] ?? "",
      subject: `[ESCALATION] Task ${overdue ? "overdue" : "due soon"}: ${t.title}`,
      body: `Task "${t.title}" (${t.r_engagement?.engagement_name ?? "unlinked"}) assigned to ${t.r_assignee?.first_name ?? ""} ${t.r_assignee?.last_name ?? ""} is ${overdue ? "overdue" : "due within 7 days"} — due ${t.due_date!.toISOString().slice(0, 10)}. Status: ${t.status}.`,
    });
    if (!t.escalated) await prisma.task.update({ where: { id: t.id }, data: { escalated: true } });
  }
  for (const a of actions) {
    const overdue = a.due_date! < now;
    items.push({
      dedup: `esc:ca:${a.id}:${day}`,
      to: a.r_owner?.email ?? cc[0] ?? "",
      subject: `[ESCALATION] Corrective action ${overdue ? "overdue" : "due soon"}`,
      body: `Corrective action "${(a.action_description ?? "").slice(0, 120)}" owned by ${a.r_owner?.first_name ?? ""} ${a.r_owner?.last_name ?? ""} is ${overdue ? "overdue" : "due within 7 days"} — due ${a.due_date!.toISOString().slice(0, 10)}. Status: ${a.status}.`,
    });
  }

  // Upsert keyed on id = dedup key: concurrent renders can't duplicate
  const existing = await prisma.sentEmail.findMany({
    where: { id: { in: items.map((i) => i.dedup) } },
    select: { id: true },
  });
  const done = new Set(existing.map((e) => e.id));
  const fresh = items.filter((i) => i.to && !done.has(i.dedup));
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
            to_emails: [i.to],
            cc_emails: cc,
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
  }
  return { queued: fresh.length, total: items.length };
}
