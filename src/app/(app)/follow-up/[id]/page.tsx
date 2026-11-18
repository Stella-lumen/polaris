import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifyCorrectiveAction, reviseDueDate, reassignCorrectiveAction, sendActionReminder, uploadActionEvidence, reopenCorrectiveAction } from "@/lib/actions";
import { CreateDialog } from "@/components/create-dialog";
import { toTimeline } from "@/lib/history-sentences";

export const instant = false;

const SOURCES: Record<string, string> = { INTERNAL_AUDIT: "Internal Audit", AG: "Auditor General", OTHER: "Other" };
const ESC_LEVEL: Record<number, string> = {
  0: "No escalation", 1: "Reminder sent", 2: "Reminder sent to owner and supervisor",
  3: "Escalated to supervisor", 4: "Escalated to Head of Department", 5: "Escalated to Chief Audit Officer",
};
const STATUS_LABEL: Record<string, string> = {
  OPEN: "Open", IN_PROGRESS: "In progress", IMPLEMENTED: "Implemented", VERIFIED: "Verified", NOT_EFFECTIVE: "Not effective",
};
const outcomes = [{ value: "EFFECTIVE", label: "Effective — close the action" }, { value: "NOT_EFFECTIVE", label: "Not effective — reopen the action" }];
const fmtDate = (d: Date | null | undefined) => d ? d.toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : null;
const person = (u: { first_name: string | null; last_name: string | null } | null | undefined) => u ? `${u.first_name} ${u.last_name}` : null;

function Item({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="text-sm">{children}</div></div>;
}

export default async function ActionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a, users] = await Promise.all([
    prisma.correctiveAction.findUnique({
      where: { id },
      include: {
        r_finding: { include: { r_engagement: { include: { r_planned_engagement: { include: { riskAssessments_linked_planned_engagement: true } } } } } },
        r_owner: true,
        r_supervisor: true,
      },
    }),
    prisma.user.findMany({ where: { deleted: false, disabled: false } }),
  ]);
  if (!a) notFound();
  const [history, evidence, verifier, approver, escalationMail] = await Promise.all([
    prisma.auditLog.findMany({ where: { table_name: "Corrective Actions", record_id: id }, orderBy: { timestamp: "desc" }, take: 50 }),
    prisma.storedFile.findMany({ where: { entity_type: "corrective-action", entity_id: id, deleted: false } }),
    a.verified_by_id ? prisma.user.findUnique({ where: { id: a.verified_by_id }, select: { first_name: true, last_name: true } }) : null,
    a.revision_approved_by ? prisma.user.findUnique({ where: { id: a.revision_approved_by }, select: { first_name: true, last_name: true } }) : null,
    prisma.sentEmail.findFirst({ where: { id: { endsWith: `:${id}` }, created_by: "escalation-engine" }, orderBy: { created_at: "desc" } }),
  ]);
  const risk = a.r_finding?.r_engagement?.r_planned_engagement?.riskAssessments_linked_planned_engagement?.[0];
  const daysOverdue = a.due_date ? Math.floor((Date.now() - a.due_date.getTime()) / 86400_000) : null;
  const isOverdue = daysOverdue != null && daysOverdue > 0 && a.status !== "VERIFIED";
  const closed = a.status === "VERIFIED";

  const summaryLine = closed
    ? `Verified on ${fmtDate(a.verified_date) ?? "—"}${verifier ? ` by ${person(verifier)}` : ""}. The action was ${a.verification_outcome === "NOT_EFFECTIVE" ? "not effective" : "effective"}.`
    : isOverdue
      ? `Overdue by ${daysOverdue} days. ${ESC_LEVEL[a.escalation_level ?? 0] ?? "Reminder sent"}${escalationMail ? ` on ${fmtDate(escalationMail.created_at)}` : ""}.`
      : `${STATUS_LABEL[a.status ?? "OPEN"] ?? a.status} — due ${fmtDate(a.due_date) ?? "not set"}.`;

  const userMap = new Map(users.map((u) => [u.id, `${u.first_name} ${u.last_name}`]));
  const timeline = toTimeline(history, userMap);
  const canVerify = a.status === "IMPLEMENTED";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link href="/follow-up" className="text-xs text-orange-600 hover:underline">← Back to follow-up register</Link>
        <h1 className="mt-1 text-xl font-semibold text-primary">{(a.action_description ?? "").slice(0, 160)}</h1>
        <p className={`mt-2 rounded-md px-3 py-2 text-sm ${closed ? "bg-emerald-50 text-emerald-800" : isOverdue ? "bg-red-50 text-red-800" : "bg-zinc-50 text-zinc-700"}`}>
          {summaryLine}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {canVerify && (
          <CreateDialog title="Verify action" buttonLabel="Verify action" action={verifyCorrectiveAction.bind(null, id)}
            fields={[
              { name: "outcome", label: "Was the action effective?", type: "select", required: true, options: outcomes },
              { name: "verification_comments", label: "What did you review? Comments", type: "textarea" },
              { name: "reopened_reason", label: "Reason for reopening (only if not effective)", type: "textarea" },
            ]} />
        )}
        {!closed && (
          <CreateDialog title="Change due date" buttonLabel="Change due date" action={reviseDueDate.bind(null, id)}
            fields={[
              { name: "due_date", label: "New due date", type: "date", required: true },
              { name: "revision_reason", label: "Reason for the change", type: "textarea", required: true },
            ]} />
        )}
        {!closed && (
          <CreateDialog title="Reassign owner" buttonLabel="Reassign owner" action={reassignCorrectiveAction.bind(null, id)}
            fields={[{ name: "owner_user_id", label: "New owner", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: person(u) ?? u.id })) }]} />
        )}
        {!closed && <form action={sendActionReminder.bind(null, id)}><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Send reminder</button></form>}
        {closed && (
          <CreateDialog title="Reopen action" buttonLabel="Reopen" action={reopenCorrectiveAction.bind(null, id)}
            fields={[{ name: "reopened_reason", label: "Reason for reopening", type: "textarea", required: true }]} />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">People</h2>
          <Item label="Owner">{person(a.r_owner) ?? <span className="text-red-700">Not assigned</span>}</Item>
          <Item label="Supervisor (receives escalations)">{person(a.r_supervisor) ?? "Not assigned"}</Item>
        </div>
        <div className="flex flex-col gap-3 rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Dates</h2>
          <Item label="Due date">{fmtDate(a.due_date) ?? "Not set"}{isOverdue ? ` — ${daysOverdue} days overdue` : ""}</Item>
          <Item label="Original due date">{fmtDate(a.original_due_date) ?? "Same as due date"}</Item>
          <Item label="Due date changes">{a.revision_count === 0 ? "Never changed" : `Changed ${a.revision_count} time${a.revision_count === 1 ? "" : "s"}${approver ? ` — last approved by ${person(approver)}` : ""}`}</Item>
        </div>
        <div className="flex flex-col gap-3 rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Where it came from</h2>
          <Item label="Source">{SOURCES[a.source ?? "INTERNAL_AUDIT"]}</Item>
          {a.source === "AG" && (
            <>
              <Item label="AG reference">{a.ag_reference ?? "Not recorded"}</Item>
              <Item label="AG report year">{a.ag_report_year ?? "Not recorded"}</Item>
            </>
          )}
          <Item label="Finding">
            {a.r_finding
              ? <Link href={`/engagements/${a.r_finding.engagement_id}/findings-and-recommendations`} className="text-orange-600 hover:underline">{(a.r_finding.detailed_finding ?? "").slice(0, 90)}</Link>
              : "Not linked to a finding"}
          </Item>
          <Item label="Engagement">
            {a.r_finding?.r_engagement
              ? <Link href={`/engagements/${a.r_finding.engagement_id}/dashboard`} className="text-orange-600 hover:underline">{a.r_finding.r_engagement.engagement_name}</Link>
              : "Not linked to an engagement"}
          </Item>
          <Item label="Risk">
            {risk
              ? <Link href={`/risk-assessment/${risk.id}`} className="text-orange-600 hover:underline">{risk.auditable_entity}</Link>
              : <span>Not linked to a risk — <Link href="/risk-assessment" className="text-orange-600 hover:underline">view risk register</Link></span>}
          </Item>
        </div>
        <div className="flex flex-col gap-3 rounded-md border p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Result</h2>
          <Item label="Status">{STATUS_LABEL[a.status ?? "OPEN"] ?? a.status}{isOverdue ? " — overdue" : ""}</Item>
          <Item label="Progress">{a.progress ?? 0}% done</Item>
          <Item label="Verification">
            {a.verified_date
              ? `Verified on ${fmtDate(a.verified_date)}${verifier ? ` by ${person(verifier)}` : " — verifier not recorded"}, outcome: ${a.verification_outcome === "NOT_EFFECTIVE" ? "not effective" : "effective"}`
              : closed ? "Verified — verifier not recorded (flagged)" : "Not yet verified"}
          </Item>
          <Item label="Escalation">{ESC_LEVEL[a.escalation_level ?? 0] ?? "No escalation"}</Item>
        </div>
      </div>

      {(a.management_response || a.management_comments) && (
        <div className="rounded-md border p-4">
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Management comments</h2>
          {a.management_response && <div className="mb-2"><div className="text-xs text-muted-foreground">Management response{a.created_at ? ` · ${fmtDate(a.created_at)}` : ""}</div><p className="whitespace-pre-wrap text-sm">{a.management_response}</p></div>}
          {a.management_comments && <div><div className="text-xs text-muted-foreground">Latest comment{a.updated_at ? ` · ${fmtDate(a.updated_at)}` : ""}</div><p className="whitespace-pre-wrap text-sm">{a.management_comments}</p></div>}
        </div>
      )}
      {a.reopened_reason && !closed && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">Reopened: {a.reopened_reason}</div>}

      <section>
        <h2 className="mb-1 text-lg font-medium">Evidence</h2>
        <p className="mb-2 text-xs text-muted-foreground">Add evidence to show the action was done.</p>
        <form action={uploadActionEvidence.bind(null, id)} className="mb-3 flex items-center gap-2">
          <input type="file" name="files" multiple className="text-sm" />
          <button className="rounded-md bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-500">Upload evidence</button>
        </form>
        {evidence.length ? (
          <ul className="flex flex-col gap-1 text-sm">
            {evidence.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded border px-2 py-1.5">
                <a href={`/api/files/${f.id}`} className="text-orange-600 hover:underline">{f.name}</a>
                <span className="text-xs text-muted-foreground">
                  uploaded {fmtDate(f.created_at)}{f.created_by && userMap.get(f.created_by) ? ` by ${userMap.get(f.created_by)}` : ""}
                </span>
                <a href={`/api/files/${f.id}`} className="ml-auto text-xs text-orange-600 hover:underline">Download</a>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">No evidence files attached yet.</p>}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">History</h2>
        {timeline.length ? (
          <ol className="flex flex-col gap-2 border-l-2 border-orange-200 pl-4">
            {timeline.map((e, i) => (
              <li key={i} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-orange-400" />
                <span className="text-xs text-muted-foreground">{e.when?.toLocaleString("en-ZA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} · {e.who}</span>
                <div>{e.sentence}</div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted-foreground">No history yet.</p>}
      </section>
    </div>
  );
}
