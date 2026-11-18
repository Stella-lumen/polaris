import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { verifyCorrectiveAction, reviseDueDate, sendActionReminder, reassignCorrectiveAction } from "@/lib/actions";
import { CreateDialog } from "@/components/create-dialog";

export const instant = false;

const SOURCES: Record<string, string> = { INTERNAL_AUDIT: "Internal Audit", AG: "Auditor General", OTHER: "Other" };
const outcomes = [{ value: "EFFECTIVE", label: "Effective — close the action" }, { value: "NOT_EFFECTIVE", label: "Not Effective — reopen" }];

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
  const [history, evidence, verifier] = await Promise.all([
    prisma.auditLog.findMany({ where: { table_name: "Corrective Actions", record_id: id }, orderBy: { timestamp: "desc" }, take: 50 }),
    prisma.storedFile.findMany({ where: { entity_type: "corrective-action", entity_id: id, deleted: false }, select: { id: true, name: true, created_at: true, created_by: true } }),
    a.verified_by_id ? prisma.user.findUnique({ where: { id: a.verified_by_id }, select: { first_name: true, last_name: true } }) : null,
  ]);
  const risk = a.r_finding?.r_engagement?.r_planned_engagement?.riskAssessments_linked_planned_engagement?.[0];
  const daysOverdue = a.due_date ? Math.floor((Date.now() - a.due_date.getTime()) / 86400_000) : null;
  const isOverdue = daysOverdue != null && daysOverdue > 0 && a.status !== "VERIFIED";

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/follow-up" className="text-xs text-orange-600 hover:underline">← Follow-up</Link>
          <h1 className="text-xl font-semibold text-primary">{(a.action_description ?? "").slice(0, 140)}</h1>
          {isOverdue && <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">OVERDUE {daysOverdue} days</span>}
        </div>
        <div className="flex gap-2">
          <CreateDialog title="Verify Action" buttonLabel="Verify" action={verifyCorrectiveAction.bind(null, id)}
            fields={[
              { name: "outcome", label: "Verification outcome", type: "select", required: true, options: outcomes },
              { name: "verification_comments", label: "Comments / evidence reviewed", type: "textarea" },
              { name: "reopened_reason", label: "Reopen reason (if Not Effective)", type: "textarea" },
            ]} />
          <CreateDialog title="Revise Due Date" buttonLabel="Revise date" action={reviseDueDate.bind(null, id)}
            fields={[
              { name: "due_date", label: "New due date", type: "date", required: true },
              { name: "revision_reason", label: "Reason for revision", type: "textarea", required: true },
            ]} />
          <CreateDialog title="Reassign Owner" buttonLabel="Reassign" action={reassignCorrectiveAction.bind(null, id)}
            fields={[{ name: "owner_user_id", label: "New owner", type: "select", required: true, options: users.map((u) => ({ value: u.id, label: `${u.first_name} ${u.last_name}` })) }]} />
          <form action={sendActionReminder.bind(null, id)}><button className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">Send reminder</button></form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 rounded-md border p-4 md:grid-cols-4">
        <Item label="Status">{a.status?.replaceAll("_", " ")}{isOverdue ? " (overdue)" : ""}</Item>
        <Item label="Progress">{a.progress}%</Item>
        <Item label="Source">{SOURCES[a.source ?? "INTERNAL_AUDIT"]}{a.source === "AG" && a.ag_reference ? ` · ${a.ag_reference}` : ""}{a.ag_report_year ? ` · ${a.ag_report_year}` : ""}</Item>
        <Item label="Escalation level">{a.escalation_level ? `L${a.escalation_level}` : "—"}</Item>
        <Item label="Owner">{a.r_owner ? `${a.r_owner.first_name} ${a.r_owner.last_name}` : "—"}</Item>
        <Item label="Supervisor">{a.r_supervisor ? `${a.r_supervisor.first_name} ${a.r_supervisor.last_name}` : "—"}</Item>
        <Item label="Due date">{a.due_date?.toISOString().slice(0, 10) ?? "—"}</Item>
        <Item label="Original due date">{a.original_due_date?.toISOString().slice(0, 10) ?? "—"}{a.revision_count ? ` (${a.revision_count} revision${a.revision_count === 1 ? "" : "s"})` : ""}</Item>
        <Item label="Finding">
          {a.r_finding ? <Link href={`/engagements/${a.r_finding.engagement_id}/findings-and-recommendations`} className="text-orange-600 hover:underline">{(a.r_finding.detailed_finding ?? "").slice(0, 70)}…</Link> : "—"}
        </Item>
        <Item label="Engagement">
          {a.r_finding?.r_engagement ? <Link href={`/engagements/${a.r_finding.engagement_id}/dashboard`} className="text-orange-600 hover:underline">{a.r_finding.r_engagement.engagement_name}</Link> : "—"}
        </Item>
        <Item label="Originating risk">
          {risk ? <Link href={`/risk-assessment/${risk.id}`} className="text-orange-600 hover:underline">{risk.auditable_entity}</Link> : "—"}
        </Item>
        <Item label="Verification">
          {a.verified_date ? `${a.verification_outcome ?? ""} · ${a.verified_date.toISOString().slice(0, 10)}${verifier ? ` by ${verifier.first_name} ${verifier.last_name}` : ""}` : "Not yet verified"}
        </Item>
      </div>

      {(a.management_response || a.management_comments) && (
        <div className="rounded-md border p-4">
          {a.management_response && <Item label="Management response"><p className="whitespace-pre-wrap">{a.management_response}</p></Item>}
          {a.management_comments && <div className="mt-2"><Item label="Management comments"><p className="whitespace-pre-wrap">{a.management_comments}</p></Item></div>}
        </div>
      )}
      {a.revision_reason && <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm">Latest revision reason: {a.revision_reason}</div>}
      {a.reopened_reason && a.status !== "VERIFIED" && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm">Reopened: {a.reopened_reason}</div>}

      <section>
        <h2 className="mb-2 text-lg font-medium">Evidence</h2>
        <p className="mb-2 text-xs text-muted-foreground">Attach via the files icon on the register row, or upload here — evidence is required before an action can be marked IMPLEMENTED.</p>
        <ul className="list-inside list-disc text-sm">
          {evidence.map((f) => <li key={f.id}><a href={`/api/files/${f.id}`} className="text-orange-600 hover:underline">{f.name}</a> <span className="text-xs text-muted-foreground">{f.created_at?.toISOString().slice(0, 10)}</span></li>)}
          {!evidence.length && <li className="text-muted-foreground">No evidence files attached</li>}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">History</h2>
        {history.length ? (
          <div className="overflow-auto rounded-md border">
            <table className="w-full text-xs">
              <thead><tr className="border-b text-left text-muted-foreground"><th className="px-3 py-1.5">When</th><th className="px-3 py-1.5">Event</th><th className="px-3 py-1.5">Detail</th></tr></thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-3 py-1.5">{h.timestamp?.toISOString().replace("T", " ").slice(0, 16)}</td>
                    <td className="px-3 py-1.5">{h.operation_type}</td>
                    <td className="max-w-lg truncate px-3 py-1.5 text-muted-foreground">{JSON.stringify(h.new_values).slice(0, 180)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-sm text-muted-foreground">No history yet.</p>}
      </section>
    </div>
  );
}
